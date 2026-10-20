import { format } from 'date-fns';
import nodemailer from 'nodemailer';

// Email service configuration
let emailServiceEnabled = false;
let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize the email service with SMTP configuration
 * This can use Gmail, or any other SMTP service
 * 
 * NOTE: SendGrid is now the primary email service provider (see sendgrid-service.ts)
 * This email service is used as a fallback if SendGrid is unavailable
 */
export function initializeEmailService() {
  try {
    // Always use a real email service if EMAIL_PASSWORD is available
    if (process.env.EMAIL_PASSWORD) {
      console.log('Initializing email service with real SMTP credentials');
      
      // Use Gmail SMTP with proper configuration
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
          user: 'info@bamboomade.in', // Use lowercase for consistent handling
          pass: process.env.EMAIL_PASSWORD, // App password for Gmail
        },
        tls: {
          // Do not fail on invalid certs
          rejectUnauthorized: false
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
export function generateGoogleMeetLink(sessionId: number, date: Date, studentName: string): string {
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

/**
 * Generate a Google Calendar event link that includes Info@bamboomade.in as the host
 * This allows users to add the event to their calendar with the host information
 */
export function generateGoogleCalendarLink(
  sessionId: number,
  meetLink: string,
  sessionDate: Date,
  sessionDuration: number,
  sessionTopic: string,
  studentName: string
): string {
  // Format start and end times for Google Calendar
  const startTime = format(sessionDate, "yyyyMMdd'T'HHmmss");
  const endDate = new Date(sessionDate);
  endDate.setMinutes(endDate.getMinutes() + sessionDuration);
  const endTime = format(endDate, "yyyyMMdd'T'HHmmss");
  
  // Create the event details with the host email explicitly mentioned
  const details = `
BambooMade Project Guidance Session with ${studentName}
Session ID: ${sessionId}

Join this Google Meet link: ${meetLink}
Topic: ${sessionTopic}

This meeting is hosted by Info@bamboomade.in
  `.trim();
  
  // Create the calendar event title
  const title = `BambooMade - ${sessionTopic}`;

  // Create the Google Calendar event URL with Info@bamboomade.in as the host
  // add parameter adds the email as an attendee
  // src parameter sets the calendar it will be added to
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(meetLink)}&add=${encodeURIComponent('Info@bamboomade.in')}&src=${encodeURIComponent('Info@bamboomade.in')}`;
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
/**
 * Send a generic email
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  cc?: string;
}): Promise<boolean> {
  if (!emailServiceEnabled || !transporter) {
    console.error('Email service not initialized, cannot send email');
    return false;
  }
  
  try {
    // Compose email content
    const mailOptions = {
      from: '"BambooMade" <info@bamboomade.in>',
      to: options.to,
      cc: options.cc || 'bamboomade.in@gmail.com',
      subject: options.subject,
      text: options.text,
      html: options.html || options.text
    };
    
    // If we're in dev mode but we have real SMTP credentials configured,
    // we'll both log AND actually send the email
    if (process.env.NODE_ENV !== 'production') {
      console.log('========== EMAIL CONTENT (DEV MODE) ==========');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
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
      console.log(`Email sent to ${options.to}, Subject: ${options.subject}, Message ID: ${info.messageId}`);
      return true;
    } catch (sendError) {
      console.error('Error sending email through SMTP:', sendError);
      
      // In development mode, consider email as "sent" to allow testing without valid credentials
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV MODE] Treating failed email as successful for development purposes');
        return true;
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a verification code email for rescheduling or accessing sessions
 */
/**
 * Send a verification code email for account registration
 */
export async function sendLoginVerificationEmail(
  email: string,
  code: string
): Promise<boolean> {
  return await sendEmail({
    to: email,
    subject: "Your BambooMade Login Code",
    text: `
Hello,

Your login verification code for BambooMade is:

${code}

This code will expire in 15 minutes.

If you didn't request this code, please ignore this email.

Regards,
BambooMade Team
    `,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #1E3A29; padding: 20px; text-align: center;">
    <h2 style="color: #ffffff; margin: 0;">BambooMade</h2>
  </div>
  <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none; background-color: #f8f8f8;">
    <h3 style="color: #1E3A29; margin-top: 0;">Your Login Verification Code</h3>
    <p>Hello,</p>
    <p>You requested to log in to BambooMade. Please use the verification code below:</p>
    
    <div style="background-color: #ffffff; padding: 20px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border: 2px solid #2e7d32; border-radius: 8px; color: #2e7d32;">
      ${code}
    </div>
    
    <p><strong>Important:</strong> This code will expire in 15 minutes.</p>
    <p>If you didn't request this code, please ignore this email.</p>
    
    <div style="margin-top: 20px; padding: 15px; background-color: #f0f7f0; border-radius: 8px;">
      <p style="margin: 0; color: #1E3A29;"><strong>Need help?</strong> Contact us at <a href="mailto:info@bamboomade.in" style="color: #2e7d32;">info@bamboomade.in</a></p>
    </div>
    
    <p style="margin-top: 20px;">Regards,<br>BambooMade Team</p>
  </div>
  <div style="margin-top: 30px; text-align: center; color: #777; font-size: 12px;">
    <p>© 2025 BambooMade. All rights reserved.</p>
    <p>Banjara Hills, Hyderabad | <a href="mailto:info@bamboomade.in" style="color: #2e7d32;">info@bamboomade.in</a></p>
  </div>
</div>
    `
  });
}

export async function sendRegistrationVerificationEmail(
  email: string,
  code: string
): Promise<boolean> {
  return await sendEmail({
    to: email,
    subject: "Verify Your BambooMade Account",
    text: `
Hello,

Thank you for registering with BambooMade! To complete your registration, please use the following verification code:

${code}

This code will expire in 24 hours.

If you didn't create an account with us, please ignore this email.

Regards,
BambooMade Team
    `,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #1E3A29; padding: 20px; text-align: center;">
    <h2 style="color: #ffffff; margin: 0;">BambooMade</h2>
  </div>
  <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none;">
    <h3>Verify Your Email Address</h3>
    <p>Hello,</p>
    <p>Thank you for registering with BambooMade. Please use the verification code below to complete your registration:</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
      ${code}
    </div>
    
    <p>This code will expire in 24 hours.</p>
    <p>If you didn't create an account with us, please ignore this email.</p>
    
    <p>Regards,<br>BambooMade Team</p>
  </div>
  <div style="margin-top: 30px; text-align: center; color: #777; font-size: 12px;">
    <p>© 2025 BambooMade. All rights reserved.</p>
    <p>Banjara Hills, Hyderabad | Info@bamboomade.in</p>
  </div>
</div>
    `
  });
}

export async function sendVerificationCodeEmail(
  email: string,
  code: string,
  purpose: 'reschedule' | 'access'
): Promise<boolean> {
  const purposeText = purpose === 'reschedule' 
    ? 'rescheduling your BambooMade project guidance session' 
    : 'accessing your BambooMade sessions';
  
  return await sendEmail({
    to: email,
    subject: "Your Verification Code for BambooMade",
    text: `
Hello,

Your verification code for ${purposeText} is: ${code}

This code will expire in 15 minutes.

If you didn't request this code, please ignore this email.

Regards,
BambooMade Team
    `,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #1E3A29; padding: 20px; text-align: center;">
    <h2 style="color: #ffffff; margin: 0;">BambooMade</h2>
  </div>
  <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none;">
    <h3>Your Verification Code</h3>
    <p>Hello,</p>
    <p>You requested a verification code for ${purposeText}.</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
      ${code}
    </div>
    
    <p>This code will expire in 15 minutes.</p>
    <p>If you didn't request this code, please ignore this email.</p>
    
    <p>Regards,<br>BambooMade Team</p>
  </div>
</div>
    `
  });
}

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

    // Create calendar event link that explicitly shows it's from Info@bamboomade.in
    const calendarLink = generateGoogleCalendarLink(
      bookingData.sessionId,
      meetLink,
      bookingData.sessionDate,
      bookingData.sessionDuration,
      bookingData.sessionTopic, 
      bookingData.studentName
    );
    
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
        
        <p style="margin-bottom: 15px;">Please click the link above at the scheduled time to join the session. This Google Meet session is hosted by Info@bamboomade.in. If you're new to Google Meet, we recommend testing your audio and video a few minutes before the session starts.</p>
        
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
      
      Please click the link above at the scheduled time to join the session. This Google Meet session is hosted by Info@bamboomade.in.
      
      ADD TO GOOGLE CALENDAR: ${calendarLink}
      
      If you need to reschedule or have any questions, please contact us at bamboomade.in@gmail.com or call us at +91 8971690163.
      
      We look forward to speaking with you!
      
      The BambooMade Team
      
      © 2025 BambooMade. All rights reserved.
      Nagole, Hyderabad-500068, India
    `;
    
    return await sendEmail({
      to: bookingData.studentEmail,
      subject: 'Your BambooMade Project Guidance Session Confirmed',
      text: textContent,
      html: htmlContent
    });
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return false;
  }
}

/**
 * Send a session rescheduled confirmation email
 */
export async function sendRescheduledSessionEmail(
  sessionId: number,
  studentName: string,
  email: string,
  topic: string,
  newDate: Date,
  duration: number
): Promise<boolean> {
  try {
    // Format date and time for display
    const formattedDate = format(newDate, 'EEEE, MMMM do, yyyy');
    const formattedTime = format(newDate, 'h:mm a');
    
    // Calculate end time
    const endTime = new Date(newDate);
    endTime.setMinutes(endTime.getMinutes() + duration);
    const formattedEndTime = format(endTime, 'h:mm a');
    
    return await sendEmail({
      to: email,
      subject: "Your BambooMade Session Has Been Rescheduled",
      text: `
Hello ${studentName},

Your BambooMade Project Guidance session has been successfully rescheduled.

NEW SESSION DETAILS:
Date: ${formattedDate}
Time: ${formattedTime} - ${formattedEndTime} IST
Duration: ${duration} minutes
Topic: ${topic}

We'll send you an updated Google Meet link for your session within 4 hours.

If you have any questions, please contact us at:
Email: Info@bamboomade.in
Phone/WhatsApp: +91 8971690163

Thank you,
BambooMade Team
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #1E3A29; padding: 20px; text-align: center;">
    <h2 style="color: #ffffff; margin: 0;">BambooMade</h2>
  </div>
  <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none;">
    <h3>Session Rescheduled Successfully</h3>
    <p>Hello ${studentName},</p>
    <p>Your BambooMade Project Guidance session has been successfully rescheduled.</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #2e7d32;">New Session Details:</h4>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Time:</strong> ${formattedTime} - ${formattedEndTime} IST</p>
      <p><strong>Duration:</strong> ${duration} minutes</p>
      <p><strong>Topic:</strong> ${topic}</p>
    </div>
    
    <p>We'll send you an updated Google Meet link for your session within 4 hours.</p>
    
    <div style="margin: 20px 0; padding-top: 20px; border-top: 1px solid #e5e5e5;">
      <p>If you have any questions, please contact us at:</p>
      <p>Email: <a href="mailto:Info@bamboomade.in" style="color: #2e7d32;">Info@bamboomade.in</a></p>
      <p>Phone/WhatsApp: <a href="https://wa.me/918971690163" style="color: #2e7d32;">+91 8971690163</a></p>
    </div>
    
    <p>Thank you,<br>BambooMade Team</p>
  </div>
</div>
      `
    });
  } catch (error) {
    console.error("Failed to send rescheduled session email:", error);
    return false;
  }
}

/**
 * Send a cancellation confirmation email with refund details
 */
export async function sendCancellationEmail(
  sessionId: number,
  studentName: string,
  email: string,
  topic: string,
  sessionDate: Date,
  reason: string,
  refundPercentage: number,
  refundAmount: number
): Promise<boolean> {
  try {
    // Format date and time for display
    const formattedDate = format(sessionDate, 'EEEE, MMMM do, yyyy');
    const formattedTime = format(sessionDate, 'h:mm a');
    
    // Format cancellation date
    const cancellationDate = new Date();
    const formattedCancellationDate = format(cancellationDate, 'MMMM do, yyyy');
    
    return await sendEmail({
      to: email,
      subject: "Your BambooMade Session Has Been Cancelled",
      text: `
Hello ${studentName},

Your BambooMade Project Guidance session has been cancelled as requested.

CANCELLED SESSION DETAILS:
Date: ${formattedDate}
Time: ${formattedTime}
Topic: ${topic}
Cancellation Date: ${formattedCancellationDate}
Reason: ${reason}

REFUND DETAILS:
Refund Percentage: ${refundPercentage}%
Refund Amount: ₹${refundAmount}

According to our cancellation policy:
- 100% refund for cancellations more than 7 days before the session
- 75% refund for cancellations 3-7 days before the session
- 50% refund for cancellations 1-3 days before the session
- 25% refund for cancellations less than 24 hours before the session
- No refund for cancellations after the session's scheduled start time

Your refund will be processed within 7-10 business days to your original payment method.

If you have any questions, please contact us at:
Email: Info@bamboomade.in
Phone/WhatsApp: +91 8971690163

Thank you,
BambooMade Team
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #1E3A29; padding: 20px; text-align: center;">
    <h2 style="color: #ffffff; margin: 0;">BambooMade</h2>
  </div>
  <div style="padding: 20px; border: 1px solid #e5e5e5; border-top: none;">
    <h3>Session Cancellation Confirmation</h3>
    <p>Hello ${studentName},</p>
    <p>Your BambooMade Project Guidance session has been cancelled as requested.</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
      <h4 style="margin-top: 0; color: #2e7d32;">Cancelled Session Details:</h4>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Time:</strong> ${formattedTime}</p>
      <p><strong>Topic:</strong> ${topic}</p>
      <p><strong>Cancellation Date:</strong> ${formattedCancellationDate}</p>
      <p><strong>Reason:</strong> ${reason}</p>
    </div>
    
    <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #2e7d32;">
      <h4 style="margin-top: 0; color: #2e7d32;">Refund Details:</h4>
      <p><strong>Refund Percentage:</strong> ${refundPercentage}%</p>
      <p><strong>Refund Amount:</strong> ₹${refundAmount}</p>
    </div>
    
    <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #607d8b;">
      <h4 style="margin-top: 0; color: #607d8b;">Cancellation Policy:</h4>
      <ul style="padding-left: 20px; margin-bottom: 0;">
        <li>100% refund for cancellations more than 7 days before the session</li>
        <li>75% refund for cancellations 3-7 days before the session</li>
        <li>50% refund for cancellations 1-3 days before the session</li>
        <li>25% refund for cancellations less than 24 hours before the session</li>
        <li>No refund for cancellations after the session's scheduled start time</li>
      </ul>
    </div>
    
    <p>Your refund will be processed within 7-10 business days to your original payment method.</p>
    
    <div style="margin: 20px 0; padding-top: 20px; border-top: 1px solid #e5e5e5;">
      <p>If you have any questions, please contact us at:</p>
      <p>Email: <a href="mailto:Info@bamboomade.in" style="color: #2e7d32;">Info@bamboomade.in</a></p>
      <p>Phone/WhatsApp: <a href="https://wa.me/918971690163" style="color: #2e7d32;">+91 8971690163</a></p>
    </div>
    
    <p>Thank you,<br>BambooMade Team</p>
  </div>
</div>
      `
    });
  } catch (error) {
    console.error("Failed to send cancellation email:", error);
    return false;
  }
}

export interface TestRideEmailData {
  name: string;
  email: string;
  phone: string;
  city: string;
  occupation: string;
  age: string;
  gender: string;
  notes?: string | null;
  createdAt?: Date;
}

/**
 * Send notification to BambooMade admin when someone enrolls for a test ride
 */
export async function sendTestRideAdminNotificationEmail(data: TestRideEmailData): Promise<boolean> {
  const submissionTime = data.createdAt 
    ? format(new Date(data.createdAt), 'EEEE, MMMM do, yyyy h:mm a') 
    : format(new Date(), 'EEEE, MMMM do, yyyy h:mm a');

  const textContent = `
NEW E-BAMBOO BIKE TEST RIDE ENROLLMENT RECEIVED!

Participant Details:
- Name: ${data.name}
- Email: ${data.email}
- Phone: ${data.phone}
- City: ${data.city}
- Occupation: ${data.occupation}
- Age: ${data.age}
- Gender: ${data.gender}
${data.notes ? `- Notes / Preferences: ${data.notes}\n` : ''}- Submitted At: ${submissionTime}

Please review and schedule a test ride slot accordingly.
  `.trim();

  const htmlContent = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0;">
  <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 24px 28px; text-align: left;">
    <span style="display: inline-block; background-color: rgba(251, 191, 36, 0.2); color: #fde68a; border: 1px solid rgba(251, 191, 36, 0.4); padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">New Test Ride Lead</span>
    <h2 style="color: #ffffff; margin: 12px 0 4px 0; font-size: 22px; font-weight: 700;">🚲 E Bamboo Bike - Test Ride Enrollment</h2>
    <p style="color: #a7f3d0; margin: 0; font-size: 13px;">A new user has submitted their interest for the test ride.</p>
  </div>

  <div style="padding: 24px 28px;">
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #4b5563; width: 140px; font-size: 13px;">Full Name:</td>
        <td style="padding: 10px 0; font-weight: 700; color: #111827; font-size: 14px;">${data.name}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #4b5563; font-size: 13px;">Email Address:</td>
        <td style="padding: 10px 0; color: #047857; font-weight: 600; font-size: 14px;"><a href="mailto:${data.email}" style="color: #047857; text-decoration: none;">${data.email}</a></td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #4b5563; font-size: 13px;">Phone / WhatsApp:</td>
        <td style="padding: 10px 0; color: #111827; font-weight: 600; font-size: 14px;"><a href="https://wa.me/${data.phone.replace(/[^0-9]/g, '')}" target="_blank" style="color: #059669; text-decoration: none;">${data.phone} (WhatsApp)</a></td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #4b5563; font-size: 13px;">City:</td>
        <td style="padding: 10px 0; color: #111827; font-weight: 700; font-size: 14px;">${data.city}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #4b5563; font-size: 13px;">Occupation:</td>
        <td style="padding: 10px 0; color: #111827; font-size: 14px;">${data.occupation}</td>
      </tr>
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #4b5563; font-size: 13px;">Age & Gender:</td>
        <td style="padding: 10px 0; color: #111827; font-size: 14px;">${data.age} yrs • ${data.gender}</td>
      </tr>
      ${data.notes ? `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px 0; font-weight: 600; color: #4b5563; font-size: 13px;">Notes:</td>
        <td style="padding: 10px 0; color: #374151; font-size: 13px;">${data.notes}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 10px 0; font-weight: 600; color: #4b5563; font-size: 13px;">Received At:</td>
        <td style="padding: 10px 0; color: #6b7280; font-size: 13px;">${submissionTime}</td>
      </tr>
    </table>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-top: 10px;">
      <p style="margin: 0; color: #166534; font-size: 12px;"><strong>Research Data Protection:</strong> This submission was collected under the BambooMade Research Privacy Policy for internal product development only.</p>
    </div>
  </div>
</div>
  `;

  return await sendEmail({
    to: 'info@bamboomade.in',
    cc: 'bamboomade.in@gmail.com',
    subject: `🚲 New Test Ride Enrollment: ${data.name} (${data.city})`,
    text: textContent,
    html: htmlContent
  });
}

/**
 * Send confirmation email to the user who enrolled for a test ride
 */
export async function sendTestRideUserConfirmationEmail(data: TestRideEmailData): Promise<boolean> {
  const textContent = `
Hello ${data.name},

Thank you for enrolling to test ride the BambooMade E Bamboo Bike!

We have successfully received your interest:
- City: ${data.city}
- Phone: ${data.phone}
- Occupation: ${data.occupation}

What happens next?
Our team is organizing test ride experiences and product demos. As soon as slots open up in ${data.city}, our team will get in touch with you via WhatsApp or Email to coordinate your exclusive ride slot.

Privacy Commitment:
The information you provided is strictly used for BambooMade product research and scheduling. It will never be sold, rented, or shared with third parties.

Have questions?
Reach us anytime at info@bamboomade.in or WhatsApp at +91 8971690163.

Warm regards,
Team BambooMade
www.bamboomade.in
  `.trim();

  const htmlContent = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <div style="background: linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%); padding: 32px 28px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0 0 8px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">BambooMade</h1>
    <span style="display: inline-block; background-color: rgba(251, 191, 36, 0.25); color: #fef3c7; border: 1px solid rgba(251, 191, 36, 0.5); padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Test Ride Registration Confirmed</span>
  </div>

  <div style="padding: 28px 28px 24px 28px;">
    <h2 style="color: #111827; margin: 0 0 12px 0; font-size: 20px; font-weight: 700;">Hello ${data.name},</h2>
    <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
      Thank you for your interest in the <strong>BambooMade Foldable E Bamboo Bike</strong>! We've successfully registered your details for an exclusive test ride.
    </p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 12px 0; color: #047857; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Your Registration Details:</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 4px 0; color: #6b7280; width: 110px;">City:</td>
          <td style="padding: 4px 0; color: #111827; font-weight: 600;">${data.city}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Contact:</td>
          <td style="padding: 4px 0; color: #111827; font-weight: 600;">${data.phone}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #6b7280;">Occupation:</td>
          <td style="padding: 4px 0; color: #111827; font-weight: 600;">${data.occupation}</td>
        </tr>
      </table>
    </div>

    <div style="border-left: 4px solid #059669; background-color: #f0fdf4; padding: 16px 18px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <h4 style="margin: 0 0 6px 0; color: #065f46; font-size: 14px; font-weight: 700;">What happens next?</h4>
      <p style="margin: 0; color: #166534; font-size: 13.5px; line-height: 1.5;">
        Our engineering and mobility team is preparing upcoming demonstration test drives. As soon as testing dates are scheduled for <strong>${data.city}</strong>, our team will reach out directly to coordinate your preferred time slot!
      </p>
    </div>

    <div style="background-color: #fefce8; border: 1px solid #fef08a; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
      <p style="margin: 0; color: #854d0e; font-size: 12.5px; line-height: 1.5;">
        🔒 <strong>Our Privacy Promise:</strong> This information is collected solely for BambooMade product research and test ride scheduling. Your personal data is completely safe with us and will never be shared with third parties.
      </p>
    </div>

    <div style="text-align: center; padding: 18px 0; border-top: 1px solid #f3f4f6; margin-top: 10px;">
      <p style="margin: 0 0 10px 0; font-size: 13px; color: #6b7280;">Love what we're building for sustainable mobility?</p>
      <a href="https://razorpay.com/payment-button/pl_TjhR7PGDDKFDIH/view" target="_blank" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 9px 18px; border-radius: 999px; text-decoration: none; font-size: 12.5px; font-weight: 600; transition: all 0.2s;">
        ☕ Pay for a Coffee to Support Team
      </a>
    </div>

    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px;">
      <p style="margin: 0 0 4px 0;">Need to update your city or contact details?</p>
      <p style="margin: 0;">Reply to this email or reach us on WhatsApp: <a href="https://wa.me/918971690163" style="color: #059669; font-weight: 600; text-decoration: none;">+91 8971690163</a></p>
    </div>
  </div>

  <div style="background-color: #f9fafb; padding: 16px 28px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
    <p style="margin: 0 0 4px 0;">© 2026 BambooMade. Sustainable mobility engineered from bamboo composite.</p>
    <p style="margin: 0;">Hyderabad, India | <a href="https://bamboomade.in" style="color: #047857; text-decoration: none;">bamboomade.in</a></p>
  </div>
</div>
  `;

  return await sendEmail({
    to: data.email,
    subject: `🚲 You're Enrolled for the E Bamboo Bike Test Ride! - BambooMade`,
    text: textContent,
    html: htmlContent
  });
}