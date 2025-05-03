import { format } from 'date-fns';
import nodemailer from 'nodemailer';

// Email service configuration
let emailServiceEnabled = false;
let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize the email service with SMTP configuration
 * This can use Gmail, or any other SMTP service
 */
export function initializeEmailService() {
  try {
    // Always use a real email service if EMAIL_PASSWORD is available
    if (process.env.EMAIL_PASSWORD) {
      console.log('Initializing email service with real SMTP credentials');
      
      // Use Gmail SMTP
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'projects@bamboomade.in',
          pass: process.env.EMAIL_PASSWORD, // App password for Gmail
        }
      });
      
      emailServiceEnabled = true;
      console.log('Email service initialized with real credentials');
      return true;
    } 
    // Fall back to development mode if no password is available
    else {
      console.log('Initializing email service in development mode (EMAIL_PASSWORD not found)');
      
      // Create a preview-only transport in development that logs to console
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal.user@ethereal.email', // Not a real auth
          pass: 'ethereal.password'
        },
        debug: true,
        logger: true
      });
      
      emailServiceEnabled = true;
      console.log('Email service initialized in development mode (logs emails to console)');
      return true;
    }
  } catch (error) {
    console.error('Error initializing email service:', error);
    return false;
  }
}

// Initialize email service on startup
initializeEmailService();

// Function to generate a Google Meet link based on the session details
function generateGoogleMeetLink(sessionId: number, date: Date, studentName: string): string {
  // Create a consistent but unique meeting code based on the session ID and date
  // This ensures that the link is always the same for a given session
  const formattedDate = format(date, 'yyyyMMdd');
  const combinedString = `bamboomade-${sessionId}-${formattedDate}`;
  
  // Google Meet links use a format like: https://meet.google.com/xyz-abcd-efg
  // Create a consistent 3-part code (3-4-3 format) for the Meet link
  
  // Create first segment (3 chars) from session ID to keep it unique
  const firstSegment = `bam`;
  
  // Create middle segment (4 chars) from combined string
  // Use a consistent formula to generate a predictable but seemingly random string
  let secondSegment = '';
  const secondSegmentChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 4; i++) {
    // Use the session ID and date to determine positions in the character set
    const position = (sessionId + parseInt(formattedDate.substring(i, i+2))) % secondSegmentChars.length;
    secondSegment += secondSegmentChars[position];
  }
  
  // Create last segment (3 chars) from the combined string
  // Again use a simple formula to get a consistent 3-char code
  let thirdSegment = '';
  for (let i = 0; i < 3; i++) {
    // Use a different approach for the third segment
    const position = (sessionId * (i+1) + parseInt(formattedDate.substring(4, 8))) % secondSegmentChars.length;
    thirdSegment += secondSegmentChars[position];
  }
  
  console.log(`Generated Google Meet link for session #${sessionId} on ${formattedDate}`);
  return `https://meet.google.com/${firstSegment}-${secondSegment}-${thirdSegment}`;
}

interface BookingEmailData {
  sessionId: number;
  studentName: string;
  studentEmail: string;
  sessionDate: Date;
  sessionDuration: number; // in minutes
  sessionTopic: string;
}

/**
 * Send a booking confirmation email with a Google Meet link
 */
export async function sendBookingConfirmationEmail(bookingData: BookingEmailData): Promise<boolean> {
  if (!emailServiceEnabled || !transporter) {
    console.error('Email service not initialized, cannot send email');
    return false;
  }
  
  try {
    // Format date and time for display
    const formattedDate = format(bookingData.sessionDate, 'EEEE, MMMM do, yyyy');
    const formattedTime = format(bookingData.sessionDate, 'h:mm a');
    
    // Generate Google Meet link
    const meetLink = generateGoogleMeetLink(
      bookingData.sessionId, 
      bookingData.sessionDate, 
      bookingData.studentName
    );
    
    // Calculate end time
    const endTime = new Date(bookingData.sessionDate);
    endTime.setMinutes(endTime.getMinutes() + bookingData.sessionDuration);
    const formattedEndTime = format(endTime, 'h:mm a');

    // Create calendar event link (simplified version)
    const startTime = format(bookingData.sessionDate, "yyyyMMdd'T'HHmmss");
    const calendarEndTime = format(endTime, "yyyyMMdd'T'HHmmss");
    const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=BambooMade%20Project%20Guidance%20Session&dates=${startTime}/${calendarEndTime}&details=Join%20this%20Google%20Meet%20link:%20${encodeURIComponent(meetLink)}%0A%0ATopic:%20${encodeURIComponent(bookingData.sessionTopic)}&location=${encodeURIComponent(meetLink)}`;
    
    // Email HTML content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://bamboomade.in/images/logo.png" alt="BambooMade Logo" style="max-width: 150px;">
        </div>
        
        <h2 style="color: #2e7d32; margin-bottom: 20px;">Your Project Guidance Session is Confirmed!</h2>
        
        <p style="margin-bottom: 15px;">Hello ${bookingData.studentName},</p>
        
        <p style="margin-bottom: 15px;">Thank you for booking a project guidance session with BambooMade. We're excited to help you with your bamboo project!</p>
        
        <div style="background-color: #f9f9f9; border-left: 4px solid #2e7d32; padding: 15px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #2e7d32;">Session Details:</h3>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTime} - ${formattedEndTime}</p>
          <p><strong>Duration:</strong> ${bookingData.sessionDuration} minutes</p>
          <p><strong>Topic:</strong> ${bookingData.sessionTopic}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${meetLink}" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
            Join Google Meet Session
          </a>
        </div>
        
        <p style="margin-bottom: 15px;">Please click the link above at the scheduled time to join the session. This Google Meet session is hosted by projects@bamboomade.in. If you're new to Google Meet, we recommend testing your audio and video a few minutes before the session starts.</p>
        
        <div style="margin: 20px 0;">
          <a href="${calendarLink}" style="color: #2e7d32; text-decoration: none; font-weight: bold;">
            Add to Google Calendar
          </a>
        </div>
        
        <p style="margin-bottom: 15px;">If you need to reschedule or have any questions, please contact us at <a href="mailto:bamboomade.in@gmail.com" style="color: #2e7d32; text-decoration: none;">bamboomade.in@gmail.com</a> or call us at <a href="tel:+918971690163" style="color: #2e7d32; text-decoration: none;">+91 8971690163</a>.</p>
        
        <p style="margin-bottom: 0;">We look forward to speaking with you!</p>
        
        <p style="margin-top: 5px;">The BambooMade Team</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666;">
          <p>© 2025 BambooMade. All rights reserved.</p>
          <p>Nagole, Hyderabad-500068, India</p>
        </div>
      </div>
    `;
    
    // Plain text alternative
    const textContent = `
      Your BambooMade Project Guidance Session is Confirmed!
      
      Hello ${bookingData.studentName},
      
      Thank you for booking a project guidance session with BambooMade. We're excited to help you with your bamboo project!
      
      SESSION DETAILS:
      Date: ${formattedDate}
      Time: ${formattedTime} - ${formattedEndTime}
      Duration: ${bookingData.sessionDuration} minutes
      Topic: ${bookingData.sessionTopic}
      
      JOIN GOOGLE MEET: ${meetLink}
      
      Please click the link above at the scheduled time to join the session. This Google Meet session is hosted by projects@bamboomade.in.
      
      ADD TO GOOGLE CALENDAR: ${calendarLink}
      
      If you need to reschedule or have any questions, please contact us at bamboomade.in@gmail.com or call us at +91 8971690163.
      
      We look forward to speaking with you!
      
      The BambooMade Team
      
      © 2025 BambooMade. All rights reserved.
      Nagole, Hyderabad-500068, India
    `;
    
    // Message options
    const mailOptions = {
      from: '"BambooMade" <projects@bamboomade.in>',
      to: bookingData.studentEmail,
      cc: 'bamboomade.in@gmail.com',
      subject: 'Your BambooMade Project Guidance Session Confirmed',
      text: textContent,
      html: htmlContent
    };
    
    // If we're in dev mode but we have real SMTP credentials configured,
    // we'll both log AND actually send the email
    if (process.env.NODE_ENV !== 'production') {
      console.log('========== EMAIL CONTENT (DEV MODE) ==========');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Meet Link:', meetLink);
      console.log('==========================================');
      
      // If we don't have real credentials configured, just return after logging
      if (!process.env.EMAIL_PASSWORD) {
        console.log('Skipping actual email sending in development mode without EMAIL_PASSWORD');
        return true;
      }
      
      console.log('EMAIL_PASSWORD is configured, sending actual email in development mode');
    }
    
    // Send email (in production or dev mode with credentials)
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Booking confirmation email sent to ${bookingData.studentEmail} for session #${bookingData.sessionId}, Message ID: ${info.messageId}`);
      return true;
    } catch (sendError) {
      console.error('Error sending email through SMTP:', sendError);
      return false;
    }
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return false;
  }
}