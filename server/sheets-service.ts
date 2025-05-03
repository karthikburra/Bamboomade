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
  try {
    // Check if credentials are available
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.warn('Google Sheets integration disabled: Missing service account credentials');
      return false;
    }

    // Check if spreadsheet ID is available
    if (!process.env.GOOGLE_SPREADSHEET_ID) {
      console.warn('Google Sheets integration disabled: Missing spreadsheet ID');
      return false;
    }

    // Create JWT client for authentication
    const client = new google.auth.JWT(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      undefined,
      // The private key needs to have \n replaced with actual newlines
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    // Create Sheets client
    sheetsClient = google.sheets({ version: 'v4', auth: client });
    spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    
    console.log('Google Sheets integration initialized successfully');
    isInitialized = true;
    
    // Create tabs if they don't exist
    setupSpreadsheetTabs().catch(error => {
      console.error('Error setting up spreadsheet tabs:', error);
    });
    
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
  if (!isInitialized || !sheetsClient || !spreadsheetId) {
    console.warn('Google Sheets integration not initialized, skipping update');
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
  if (!isInitialized || !sheetsClient || !spreadsheetId) {
    console.warn('Google Sheets integration not initialized, skipping update');
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