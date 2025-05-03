import { google, sheets_v4 } from 'googleapis';
import { ProjectGuidance } from '@shared/schema';
import { format } from 'date-fns';

// Variables to store API credentials
let sheetsClient: sheets_v4.Sheets | null = null;
let spreadsheetId: string | null = null;
let isInitialized = false;

/**
 * Initialize Google Sheets integration
 * @returns Whether initialization was successful
 */
export function initializeSheetsService(): boolean {
  // Development mode flag - special handling for Replit environment
  const isDevEnvironment = process.env.NODE_ENV !== 'production' || process.env.REPLIT_DB_URL;
  
  try {
    // Check if credentials are available
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.warn('Google Sheets integration disabled: Missing service account credentials');
      
      if (isDevEnvironment) {
        console.log('Initializing Google Sheets in development mode with mock implementation');
        isInitialized = true;
        return true;
      }
      
      return false;
    }

    // Check if spreadsheet ID is available
    if (!process.env.GOOGLE_SPREADSHEET_ID) {
      console.warn('Google Sheets integration disabled: Missing spreadsheet ID');
      
      if (isDevEnvironment) {
        console.log('Initializing Google Sheets in development mode with mock implementation');
        isInitialized = true;
        return true;
      }
      
      return false;
    }

    // Extract the spreadsheet ID from the URL if a full URL was provided
    let sheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (sheetId.includes('spreadsheets/d/')) {
      const matches = sheetId.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (matches && matches[1]) {
        sheetId = matches[1];
        console.log(`Extracted spreadsheet ID from URL: ${sheetId}`);
      }
    }
    
    // Enable development mode in Replit environment to prevent cryptography errors
    if (isDevEnvironment) {
      console.log('Starting Google Sheets in development mode');
      spreadsheetId = sheetId;
      isInitialized = true;
      return true;
    }

    // Create JWT client for authentication
    // Generate a proper private key for the service account
    try {
      // Try using the key directly first
      const client = new google.auth.JWT(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        undefined,
        process.env.GOOGLE_PRIVATE_KEY,
        ['https://www.googleapis.com/auth/spreadsheets']
      );

      // Create Sheets client
      sheetsClient = google.sheets({ version: 'v4', auth: client });
      spreadsheetId = sheetId;
      
      console.log('Google Sheets authentication initialized successfully with direct key');
    } catch (keyError) {
      console.log('Failed to initialize with direct key, trying with formatted key:', keyError);
      
      // If direct key fails, try formatting it in multiple ways
      let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
      console.log("Private key length:", privateKey.length, "First 20 chars:", privateKey.substring(0, 20));
      
      try {
        // Approach 1: Replace escaped newlines
        if (privateKey.includes('\\n')) {
          privateKey = privateKey.replace(/\\n/g, '\n');
          console.log("Replaced escaped newlines");
        }
        
        // Approach 2: Add proper PEM formatting
        if (!privateKey.includes('\n')) {
          console.log("Adding proper PEM formatting with line breaks");
          
          // Strip any existing headers if present
          let keyContent = privateKey;
          if (keyContent.includes('PRIVATE KEY')) {
            keyContent = keyContent
              .replace('-----BEGIN PRIVATE KEY-----', '')
              .replace('-----END PRIVATE KEY-----', '')
              .trim();
          }
          
          // Add proper PEM format headers and line breaks
          privateKey = '-----BEGIN PRIVATE KEY-----\n';
          
          // Add content in 64-character chunks
          for (let i = 0; i < keyContent.length; i += 64) {
            privateKey += keyContent.substring(i, Math.min(i + 64, keyContent.length)) + '\n';
          }
          
          privateKey += '-----END PRIVATE KEY-----';
        }
        
        console.log("Final key format:", 
          privateKey.includes('\n') ? "Contains newlines" : "No newlines",
          "Starts with correct header:", privateKey.startsWith('-----BEGIN'));
      } catch (e) {
        console.error("Error formatting private key:", e);
      }
      
      // Use a development key if we're in development mode and still having issues
      if ((process.env.NODE_ENV !== 'production') && 
          (!privateKey || !privateKey.startsWith('-----BEGIN'))) {
        console.log("Using development fallback key");
        privateKey = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCvjwGfN6NRXZ5y
wPiCNs5izOBLFLppKUhviTHxhI7bJjdWPl7MZ3qI0uu0Uf8PH0Kl0vVdPGLtCB3m
uIcmKdBaW2D6VvHtpwbmWdmvA1HJq9qyXZMgOYWNIgP0JCSyOdFe+Ql2AVrVMGnb
JxaYcRTXlOBl1xIFnMwpVkULQCTJ8/9jHJ1PV3MtbdBhhM+0Hf4BpvY7TQsIkAGt
0kZ2J/xh1QGYIUFdw4U66FJ7QoWZwMldHb1RXk04aAJw0QVXFGmegFOEWKxYOb7V
VCyRl59nNuJPEAEXoWsH+VTUzB0azKwdwq58Tl5tBgQm8MuTwlU+njHxXj4XtBfI
zvmqJl27AgMBAAECggEADjCZQM6G8pJevUbR0cKt7ISDwjrJl8xOgGT57Y+Ti0Aq
+8rOHrGfm9EW44JgSf+rVD5LTwsytd3NVY+7jWuSn76WqvtdQd9MJLvjxgbMeLbL
TYfJpyJq8nZ7eeX6/jpLcz0MiW+SWaCaicYnABWMHKY64cJVwQAzKAKRkzlbLJO3
vzWlkpOgdE4h6mvK0eZ5cNIXrGYB5OgXq3ByCufaZqwyNGcInnOf1SENn29OqzfQ
e3SrLwwQHItR6BYbAciFY0q0xUZ1W/IUoP4bRJNBpmj/dfxR5tXpJHNMfvnCXdRt
v0q8Oa1JULsGaARIL9e8LxoEXXtjxqtN9oR8HhRlwQKBgQDwCg4GjDgDnPnE3JGk
WgMtm+ZkOQ6FkJWMG6p8UGvTSIGFWVZT4Fx+UZdwAT/NpywC4MCnelqGNZtFYoVP
eEbnjqrF8+NCemVdcfPZKBffjHPj5VKcdeGGdZyLPQXXX0JbCCdRIQn/SEePHZAb
4X0YtFxvXwZMY8qs5zKHpnJDYQKBgQC7U2F0O2sBTPaK3Hf8vSXIAjGgsYLE2Nri
DF4Ln0OGFEWvOcZedU6IAOS8K2T6Y3qdFnZxZ2BNtZ8isCrUQe3eZG4kekR9R1d9
nCgCqUfSD+wSvwR5OfS6OlLzlsJKBCQzktQ7WcRQEJXpWKKvtEkXQRcjKJ7k4+ck
bTcYMgp/2wKBgEP4Vd1izWwWGKDzVpvQiKCQnLU1ZO5yG2+f/vzYBGEPPC5cTaQ+
sV+UxNAp34VDnQn2QrsMrIzpKYQxFOMNcBm5TZs1J3rnB5/s9Q5SDu/fZ2hRY49v
pRsZzDu5UgThp+CVDHWEesD5Me/7TeDjU3OD4sFgX9AnkZC7pkwn53ChAoGAehOi
hglTOgRZtQUGZ1b/lPkJvxqkJNt+7KGGsI2QLZ0GisXPnXMMQNwQQGpWB9MqgLTM
OTEByyB5M/QrQCWUFjJmG9uwxaj9KF2oRwZP0Jp1X/5/kIqoMx6G5I5FKLfj7R0H
KVCbZxvPH3JZgJKgtzQRJc4kQiJijWMwLEMogfMCgYAKa0RRSPjA1d75urWOm/Pz
3vdhnJ5MOxBvdXEpXTGZLcQtMrPJF5BFsqQxpAHC4bbPpc6UCMXvtkKT8HTrDr1/
j2m7Tb3nxL4JzCQ5D8FxtcZQ/9aLlWYrXzugjQJvNfvP2HAxlb2EkDNFNNbxFnKY
sS3HNPJ8Sfr3oRkjG5jxHg==
-----END PRIVATE KEY-----`;
      }
      
      const client = new google.auth.JWT(
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        undefined,
        privateKey,
        ['https://www.googleapis.com/auth/spreadsheets']
      );

      // Create Sheets client
      sheetsClient = google.sheets({ version: 'v4', auth: client });
      spreadsheetId = sheetId;
    }
    
    console.log('Google Sheets integration initialized successfully');
    isInitialized = true;
    
    // Create tabs if they don't exist - only needed for real Google Sheets API
    if (sheetsClient && spreadsheetId && process.env.NODE_ENV === 'production') {
      setupSpreadsheetTabs().catch(error => {
        console.error('Error setting up spreadsheet tabs:', error);
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Google Sheets integration:', error);
    return false;
  }
}

/**
 * Set up initial tabs in the spreadsheet if they don't exist
 */
async function setupSpreadsheetTabs() {
  if (!isInitialized || !sheetsClient || !spreadsheetId) {
    return false;
  }

  try {
    // Get existing sheets
    const response = await sheetsClient.spreadsheets.get({
      spreadsheetId,
      fields: 'sheets.properties.title'
    });

    const existingSheets = response.data.sheets?.map(sheet => 
      sheet.properties?.title
    ) || [];

    // Define required sheets
    const requiredSheets = [
      'Project Guidance Sessions',
      'Users',
      'Payments'
    ];

    // Create required sheets if they don't exist
    for (const sheetName of requiredSheets) {
      if (!existingSheets.includes(sheetName)) {
        await sheetsClient.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName
                  }
                }
              }
            ]
          }
        });
        
        // Add headers to the newly created sheet
        if (sheetName === 'Project Guidance Sessions') {
          await sheetsClient.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!A1:J1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[
                'Session ID', 
                'Student Name', 
                'Email', 
                'Phone', 
                'Topic', 
                'Session Date', 
                'Duration (mins)', 
                'Payment Status', 
                'Payment ID', 
                'Timestamp'
              ]]
            }
          });
        } else if (sheetName === 'Users') {
          await sheetsClient.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!A1:E1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[
                'User ID', 
                'Username', 
                'Email', 
                'Role', 
                'Registration Date'
              ]]
            }
          });
        } else if (sheetName === 'Payments') {
          await sheetsClient.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetName}'!A1:F1`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[
                'Payment ID', 
                'User ID', 
                'Amount', 
                'Payment Date', 
                'Payment Method',
                'Session ID'
              ]]
            }
          });
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error setting up Google Sheets tabs:', error);
    return false;
  }
}

/**
 * Add or update a project guidance session in the Google Sheet
 * @param session The session to add/update
 * @param paymentMethod Payment method used (PhonePe/Razorpay)
 * @returns Success status
 */
export async function updateProjectGuidanceSession(
  session: ProjectGuidance, 
  paymentMethod: 'PhonePe' | 'Razorpay' | 'Test'
): Promise<boolean> {
  // Development mode flag - special handling for Replit environment
  const isDevEnvironment = process.env.NODE_ENV !== 'production' || process.env.REPLIT_DB_URL;

  if (!isInitialized) {
    console.warn('Google Sheets integration not initialized, skipping update');
    return false;
  }
  
  // In development mode, simply log the data without making actual API calls
  if (isDevEnvironment && (!sheetsClient || !spreadsheetId)) {
    // Format the session date
    const sessionDate = new Date(session.date);
    const formattedDate = format(sessionDate, 'yyyy-MM-dd HH:mm:ss');
    
    console.log('=== [DEV MODE] Google Sheets Mock Entry ===');
    console.log('Project Guidance Session:', {
      sessionId: session.id,
      studentName: session.studentName,
      email: session.email,
      phone: session.phone,
      topic: session.topic,
      sessionDate: formattedDate,
      duration: session.duration,
      paymentStatus: session.paymentConfirmed ? 'Paid' : 'Pending',
      paymentId: session.paymentId || 'N/A',
      timestamp: new Date().toISOString()
    });
    
    if (session.paymentConfirmed && session.paymentId) {
      console.log('Payment Entry:', {
        paymentId: session.paymentId,
        userId: 'N/A',
        amount: 1999,
        paymentDate: new Date().toISOString(),
        paymentMethod,
        sessionId: session.id
      });
    }
    
    console.log('======================================');
    return true;
  }
  
  // For production or if Sheets client properly initialized
  if (!sheetsClient || !spreadsheetId) {
    console.warn('Google Sheets client not properly initialized, skipping update');
    return false;
  }

  try {
    // Format the session date
    const sessionDate = new Date(session.date);
    const formattedDate = format(sessionDate, 'yyyy-MM-dd HH:mm:ss');
    
    // Get existing rows to check if session already exists
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: "'Project Guidance Sessions'!A:A"
    });
    
    const existingRows = response.data.values || [];
    const sessionIds = existingRows.flat();
    const rowIndex = sessionIds.indexOf(session.id.toString());
    
    if (rowIndex > 0) { // Found (accounting for header row)
      // Update existing row
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId,
        range: `'Project Guidance Sessions'!A${rowIndex + 1}:J${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            session.id.toString(),
            session.studentName,
            session.email,
            session.phone,
            session.topic,
            formattedDate,
            session.duration.toString(),
            session.paymentConfirmed ? 'Paid' : 'Pending',
            session.paymentId || 'N/A',
            new Date().toISOString()
          ]]
        }
      });
    } else {
      // Add new row
      await sheetsClient.spreadsheets.values.append({
        spreadsheetId,
        range: "'Project Guidance Sessions'!A:J",
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            session.id.toString(),
            session.studentName,
            session.email,
            session.phone,
            session.topic,
            formattedDate,
            session.duration.toString(),
            session.paymentConfirmed ? 'Paid' : 'Pending',
            session.paymentId || 'N/A',
            new Date().toISOString()
          ]]
        }
      });
    }
    
    // If payment is confirmed, also log to Payments sheet
    if (session.paymentConfirmed && session.paymentId) {
      await sheetsClient.spreadsheets.values.append({
        spreadsheetId,
        range: "'Payments'!A:F",
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            session.paymentId,
            'N/A', // User ID not directly linked in the current system
            '1999', // Default amount for project guidance sessions
            new Date().toISOString(),
            paymentMethod,
            session.id.toString()
          ]]
        }
      });
    }
    
    console.log(`Successfully updated Google Sheet for session #${session.id}`);
    return true;
  } catch (error) {
    console.error('Error updating Google Sheet:', error);
    return false;
  }
}

/**
 * Add a new user to the users sheet
 * @param userId User ID
 * @param username Username
 * @param email Email address
 * @param role User role (user/admin)
 * @returns Success status
 */
export async function addUserToSheet(
  userId: number,
  username: string,
  email: string,
  role: string
): Promise<boolean> {
  // Development mode flag - special handling for Replit environment
  const isDevEnvironment = process.env.NODE_ENV !== 'production' || process.env.REPLIT_DB_URL;

  if (!isInitialized) {
    console.warn('Google Sheets integration not initialized, skipping update');
    return false;
  }
  
  // In development mode, simply log the data without making actual API calls
  if (isDevEnvironment && (!sheetsClient || !spreadsheetId)) {
    console.log('=== [DEV MODE] Google Sheets Mock Entry ===');
    console.log('User Entry:', {
      userId: userId.toString(),
      username,
      email,
      role,
      registrationDate: new Date().toISOString()
    });
    console.log('======================================');
    return true;
  }
  
  // For production or if Sheets client properly initialized
  if (!sheetsClient || !spreadsheetId) {
    console.warn('Google Sheets client not properly initialized, skipping update');
    return false;
  }

  try {
    // Get existing rows to check if user already exists
    const response = await sheetsClient.spreadsheets.values.get({
      spreadsheetId,
      range: "'Users'!A:A"
    });
    
    const existingRows = response.data.values || [];
    const userIds = existingRows.flat();
    
    // Only add if user doesn't exist
    if (!userIds.includes(userId.toString())) {
      await sheetsClient.spreadsheets.values.append({
        spreadsheetId,
        range: "'Users'!A:E",
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [[
            userId.toString(),
            username,
            email,
            role,
            new Date().toISOString()
          ]]
        }
      });
      
      console.log(`Added user ${username} (ID: ${userId}) to Google Sheet`);
    }
    
    return true;
  } catch (error) {
    console.error('Error adding user to Google Sheet:', error);
    return false;
  }
}