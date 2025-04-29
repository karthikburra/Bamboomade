import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { processMessageForTraining } from './openai-service.js';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory for storing chat data
const DATA_DIR = path.join(__dirname, '..', 'whatsapp-data');
const CHAT_LOG_FILE = path.join(DATA_DIR, 'chat-logs.json');
const TRAINING_DATA_FILE = path.join(DATA_DIR, 'training-data.json');

// Ensure directories exist
fs.ensureDirSync(DATA_DIR);

// Initialize chat logs and training data if they don't exist
if (!fs.existsSync(CHAT_LOG_FILE)) {
  fs.writeJsonSync(CHAT_LOG_FILE, []);
}

if (!fs.existsSync(TRAINING_DATA_FILE)) {
  fs.writeJsonSync(TRAINING_DATA_FILE, []);
}

class WhatsAppBot {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.targetGroupId = null;
    this.activeGroups = [];
    this.chatHistory = [];
    this.trainingData = [];
    this.loadExistingData();

    // Schedule periodic training data processing
    cron.schedule('0 */4 * * *', () => { // Every 4 hours
      this.processTrainingData();
    });
  }

  loadExistingData() {
    try {
      this.chatHistory = fs.readJsonSync(CHAT_LOG_FILE);
      this.trainingData = fs.readJsonSync(TRAINING_DATA_FILE);
      console.log(`[WhatsApp Bot] Loaded ${this.chatHistory.length} chat records and ${this.trainingData.length} training data items`);
    } catch (error) {
      console.error('[WhatsApp Bot] Error loading existing data:', error);
    }
  }

  saveData() {
    try {
      fs.writeJsonSync(CHAT_LOG_FILE, this.chatHistory);
      fs.writeJsonSync(TRAINING_DATA_FILE, this.trainingData);
    } catch (error) {
      console.error('[WhatsApp Bot] Error saving data:', error);
    }
  }

  async initialize() {
    try {
      console.log('[WhatsApp Bot] Initializing...');
      
      // Initialize the WhatsApp client with session persistence
      this.client = new Client({
        authStrategy: new LocalAuth({ clientId: 'bamboomade-bot' }),
        puppeteer: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        }
      });

      // Handle QR code for login
      this.client.on('qr', (qr) => {
        console.log('[WhatsApp Bot] QR code received, scan this to log in:');
        qrcode.generate(qr, { small: true });
      });

      // Client is ready
      this.client.on('ready', async () => {
        this.isReady = true;
        console.log('[WhatsApp Bot] Client is ready!');
        await this.updateGroupList();
      });

      // Handle incoming messages
      this.client.on('message', async (message) => {
        await this.handleMessage(message);
      });

      // Reconnect on disconnections
      this.client.on('disconnected', (reason) => {
        this.isReady = false;
        console.log('[WhatsApp Bot] Client was disconnected:', reason);
        // Attempt to reconnect after a delay
        setTimeout(() => this.initialize(), 10000);
      });

      // Initialize the client
      await this.client.initialize();
      return true;
    } catch (error) {
      console.error('[WhatsApp Bot] Initialization error:', error);
      return false;
    }
  }

  async updateGroupList() {
    if (!this.isReady || !this.client) {
      console.log('[WhatsApp Bot] Client not ready. Cannot update group list.');
      return;
    }

    try {
      const chats = await this.client.getChats();
      this.activeGroups = chats.filter(chat => chat.isGroup);
      console.log(`[WhatsApp Bot] Found ${this.activeGroups.length} groups`);
      
      // Log the available groups
      this.activeGroups.forEach((group, index) => {
        console.log(`[WhatsApp Bot] Group ${index + 1}: ${group.name} (${group.id._serialized})`);
      });
    } catch (error) {
      console.error('[WhatsApp Bot] Error updating group list:', error);
    }
  }

  async joinGroupByInvite(inviteCode) {
    // For development: simulate successful join without requiring WhatsApp login
    // This is a placeholder until the Chromium dependency issues are resolved
    console.log('[WhatsApp Bot] Development mode: Simulating successful group join for code:', inviteCode);
    
    // Generate a fake but unique group ID based on the invite code
    const mockGroupId = `mock_group_${inviteCode.substring(0, 8)}`;
    
    return { 
      success: true, 
      groupId: mockGroupId,
      development: true
    };
    
    // The original implementation is commented out for reference
    /*
    if (!this.isReady || !this.client) {
      console.log('[WhatsApp Bot] Client not ready. Cannot join group.');
      return { 
        success: false, 
        error: "WhatsApp bot client is not ready. Please try again later." 
      };
    }

    try {
      // Clean the invite code from any URL parts
      const cleanCode = inviteCode.replace('https://chat.whatsapp.com/', '');
      
      // Join the group
      const joinResult = await this.client.acceptInvite(cleanCode);
      console.log('[WhatsApp Bot] Successfully joined group:', joinResult);

      // Update group list
      await this.updateGroupList();
      
      // Set this as target group for processing
      const groupId = joinResult.gid._serialized;
      
      // Return success response with group ID
      return { 
        success: true, 
        groupId: groupId 
      };
    } catch (error) {
      console.error('[WhatsApp Bot] Error joining group:', error);
      
      // Return detailed error message
      return { 
        success: false, 
        error: error.message || "Error joining WhatsApp group" 
      };
    }
    */
  }

  async setTargetGroup(groupId) {
    this.targetGroupId = groupId;
    console.log(`[WhatsApp Bot] Target group set to: ${groupId}`);
    
    // Send a notification message to the group
    if (this.isReady && this.client && this.targetGroupId) {
      try {
        await this.client.sendMessage(
          this.targetGroupId,
          'Hello! BambooMade AI bot is now active and will learn from this group\'s messages to provide better assistance in the future.'
        );
        return true;
      } catch (error) {
        console.error('[WhatsApp Bot] Error sending notification to target group:', error);
        return false;
      }
    }
  }

  async handleMessage(message) {
    try {
      // Get message details
      const chat = await message.getChat();
      
      // Only process messages from groups and save if it's the target group
      if (chat.isGroup) {
        const contact = await message.getContact();
        const sender = contact.pushname || contact.number;
        const messageData = {
          id: message.id.id,
          timestamp: message.timestamp,
          from: sender,
          fromNumber: contact.number,
          body: message.body,
          groupId: chat.id._serialized,
          groupName: chat.name
        };

        // Save the message in chat history
        this.chatHistory.push(messageData);

        // If this is our target group, process for training
        if (chat.id._serialized === this.targetGroupId) {
          // Only process messages that have actual text content
          if (message.body && message.body.trim().length > 0) {
            // Add to training data queue for later processing
            this.trainingData.push({
              message: messageData,
              processed: false,
              dateAdded: new Date().toISOString()
            });

            // If someone mentions "bamboo" directly, respond with helpful information
            if (message.body.toLowerCase().includes('bamboo') ||
                message.mentionedIds?.includes(this.client.info.wid._serialized)) {
              await this.respondToMention(message);
            }
          }
        }

        // Save updated data every 10 messages
        if (this.chatHistory.length % 10 === 0) {
          this.saveData();
        }
      }
    } catch (error) {
      console.error('[WhatsApp Bot] Error handling message:', error);
    }
  }

  async respondToMention(message) {
    try {
      // Process the message content to create an appropriate response
      const response = await processMessageForTraining(message.body);
      if (response) {
        // Reply to the original message
        await message.reply(response);
      }
    } catch (error) {
      console.error('[WhatsApp Bot] Error responding to mention:', error);
    }
  }

  async processTrainingData() {
    console.log('[WhatsApp Bot] Processing training data...');
    const unprocessedData = this.trainingData.filter(item => !item.processed);
    
    if (unprocessedData.length === 0) {
      console.log('[WhatsApp Bot] No new training data to process');
      return;
    }

    console.log(`[WhatsApp Bot] Processing ${unprocessedData.length} training data items`);
    
    try {
      for (const item of unprocessedData) {
        // Call OpenAI service to process and generate training data
        await processMessageForTraining(item.message.body);
        
        // Mark as processed
        item.processed = true;
        item.processedDate = new Date().toISOString();
      }
      
      // Save the updated training data
      this.saveData();
      console.log('[WhatsApp Bot] Training data processing complete');
    } catch (error) {
      console.error('[WhatsApp Bot] Error processing training data:', error);
    }
  }

  async sendMessage(groupId, message) {
    if (!this.isReady || !this.client) {
      console.log('[WhatsApp Bot] Client not ready. Cannot send message.');
      return false;
    }

    try {
      await this.client.sendMessage(groupId, message);
      return true;
    } catch (error) {
      console.error('[WhatsApp Bot] Error sending message:', error);
      return false;
    }
  }

  async close() {
    if (this.client) {
      this.saveData();
      await this.client.destroy();
      this.isReady = false;
      console.log('[WhatsApp Bot] Client has been closed');
    }
  }
}

// Create and export a singleton instance
const whatsappBot = new WhatsAppBot();

// Auto-initialize the WhatsApp bot when the module is loaded
(async () => {
  try {
    console.log('[WhatsApp Bot] Auto-initializing bot on server start...');
    await whatsappBot.initialize();
  } catch (error) {
    console.error('[WhatsApp Bot] Auto-initialization failed:', error);
  }
})();

export default whatsappBot;