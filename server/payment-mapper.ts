import { db } from './db';
import { projectGuidances } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { getAllRazorpayPayments } from './razorpay-service';
import { IStorage } from './storage';

interface PaymentMappingResult {
  success: boolean;
  mappedCount: number;
  errors: string[];
  mappedSessions: Array<{
    sessionId: number;
    paymentId: string;
    amount: number;
    email: string;
  }>;
}

/**
 * Automatically map Razorpay payments to sessions based on email, amount, and timing
 * This will scan recent Razorpay payments and try to match them with pending sessions
 */
export async function autoMapPaymentsToSessions(storage: IStorage): Promise<PaymentMappingResult> {
  const result: PaymentMappingResult = {
    success: true,
    mappedCount: 0,
    errors: [],
    mappedSessions: []
  };

  try {
    // Step 1: Get all pending sessions that don't have a payment ID
    const pendingSessions = await db.select()
      .from(projectGuidances)
      .where(
        and(
          eq(projectGuidances.paymentConfirmed, false),
          eq(projectGuidances.paymentStatus, 'Pending')
        )
      );

    console.log(`Found ${pendingSessions.length} pending sessions without confirmed payment`);
    
    if (pendingSessions.length === 0) {
      return result;
    }

    // Step 2: Get recent Razorpay payments (limit to 50 for performance)
    const razorpayResponse = await getAllRazorpayPayments({ count: 50 });
    
    if (!razorpayResponse.success || !razorpayResponse.payments) {
      result.success = false;
      result.errors.push('Failed to fetch payments from Razorpay');
      return result;
    }

    const payments = razorpayResponse.payments.filter(p => 
      p.status === 'captured' || p.status === 'authorized'
    );
    
    console.log(`Found ${payments.length} successful Razorpay payments to check`);

    // Step 3: Create session lookup maps by email and order ID
    const sessionsByEmail = new Map();
    const sessionsByOrderId = new Map();
    
    pendingSessions.forEach(session => {
      // Map by email
      if (!sessionsByEmail.has(session.email.toLowerCase())) {
        sessionsByEmail.set(session.email.toLowerCase(), []);
      }
      sessionsByEmail.get(session.email.toLowerCase()).push(session);
      
      // Map by order ID if available
      if (session.orderId) {
        sessionsByOrderId.set(session.orderId, session);
      }
    });

    // Step 4: Attempt to match payments with sessions
    for (const payment of payments) {
      // Skip payments that don't have an email
      if (!payment.email) {
        continue;
      }
      
      let matched = false;
      const paymentEmail = payment.email.toLowerCase();
      const paymentAmount = payment.amount / 100; // Convert from paise to rupees
      
      // First try matching by order ID (most reliable)
      if (payment.orderId && sessionsByOrderId.has(payment.orderId)) {
        const session = sessionsByOrderId.get(payment.orderId);
        
        // Don't remap sessions that already have a payment ID
        if (session.paymentId) {
          console.log(`Session ${session.id} already has payment ID ${session.paymentId}`);
          continue;
        }
        
        try {
          // Update the session with payment details
          const updatedSession = await storage.updateProjectGuidancePayment(
            session.id, 
            payment.id, 
            paymentAmount
          );
          
          if (updatedSession) {
            console.log(`✓ Matched payment ${payment.id} to session ${session.id} via order ID ${payment.orderId}`);
            result.mappedCount++;
            result.mappedSessions.push({
              sessionId: session.id,
              paymentId: payment.id,
              amount: paymentAmount,
              email: session.email
            });
            matched = true;
          }
        } catch (error) {
          result.errors.push(`Error updating session ${session.id}: ${error.message}`);
        }
        
        // Remove the matched session from both maps to prevent double-matching
        if (matched) {
          sessionsByOrderId.delete(payment.orderId);
          const emailSessions = sessionsByEmail.get(session.email.toLowerCase()) || [];
          const filteredSessions = emailSessions.filter(s => s.id !== session.id);
          
          if (filteredSessions.length > 0) {
            sessionsByEmail.set(session.email.toLowerCase(), filteredSessions);
          } else {
            sessionsByEmail.delete(session.email.toLowerCase());
          }
        }
        
        continue;
      }
      
      // If no match by order ID, try matching by email + amount + booking time
      const emailSessions = sessionsByEmail.get(paymentEmail) || [];
      
      if (emailSessions.length > 0) {
        console.log(`Found ${emailSessions.length} sessions with matching email: ${paymentEmail}`);
        
        // Find sessions with matching email, amount, and booking time
        // We allow a small margin of error in the amount and a reasonable time window
        const matchingSessions = emailSessions.filter(session => {
          // Don't remap sessions that already have a payment ID
          if (session.paymentId) {
            console.log(`Session ${session.id} already has payment ID ${session.paymentId}`);
            return false;
          }
          
          // 1. Check amount match
          let amountMatches = false;
          let estimatedAmount = 0;
          
          // Check if the session has an amount, and if so, if it matches the payment amount
          if (session.amount) {
            // Allow a 1 rupee difference to account for rounding errors
            amountMatches = Math.abs(session.amount - paymentAmount) <= 1;
            estimatedAmount = session.amount;
          } else {
            // If the session doesn't have an amount, estimate based on duration and isStudent
            if (session.isStudent) {
              estimatedAmount = session.duration === 30 ? 500 : 800;
            } else {
              estimatedAmount = session.duration === 30 ? 1000 : 1500;
            }
            
            // Allow a 1 rupee difference to account for rounding errors
            amountMatches = Math.abs(estimatedAmount - paymentAmount) <= 1;
          }
          
          if (!amountMatches) {
            console.log(`Amount mismatch for session ${session.id}: Expected ₹${estimatedAmount}, got ₹${paymentAmount}`);
            return false;
          }
          
          // 2. Check time match - payment should occur after session booking and within 48 hours
          const paymentTime = new Date(payment.createdAt).getTime();
          
          // Use session.date since createdAt is not available in the schema
          // The date field represents when the guidance session is scheduled for
          const sessionBookingTime = new Date(session.date).getTime();
          
          // For now, we'll use only session.date as the reference point
          // We assume booking happens shortly before payment
          const sessionTime = sessionBookingTime;
          
          // For project guidance sessions, the payment typically happens at booking time
          // or may happen a few days before the scheduled session
          // Since session.date is the future event date, payment must happen BEFORE session date
          // Allow payment to be made up to 14 days before the scheduled session
          const timeWindowMs = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
          
          // Check if payment happens before the session date but not too far in advance
          // This means: payment time must be LESS than session time (payment happens before session)
          // And the difference shouldn't be more than timeWindowMs (not booked too far in advance)
          const timeMatches = paymentTime < sessionTime && (sessionTime - paymentTime) <= timeWindowMs;
          
          if (!timeMatches) {
            console.log(`Time mismatch for session ${session.id}: Session time ${new Date(sessionTime).toISOString()}, payment time ${new Date(paymentTime).toISOString()}`);
            return false;
          }
          
          console.log(`✓ Found potential match for payment ${payment.id}: Session ${session.id} (email: ${session.email}, amount: ₹${estimatedAmount}, duration: ${session.duration}min)`);
          return true;
        });
        
        // Log if multiple matches found
        if (matchingSessions.length > 1) {
          console.log(`⚠️ Multiple sessions (${matchingSessions.length}) match payment ${payment.id} for email ${paymentEmail}:`);
          matchingSessions.forEach(session => {
            console.log(`  - Session ${session.id}: ${session.studentName}, ${session.duration}min, booked for ${new Date(session.date).toISOString().split('T')[0]}`);
          });
          // Skip mapping if multiple matches are found
          continue;
        }
        
        if (matchingSessions.length === 1) {
          // If only one session matches, update it
          const session = matchingSessions[0];
          
          try {
            // Update the session with payment details
            const updatedSession = await storage.updateProjectGuidancePayment(
              session.id, 
              payment.id, 
              paymentAmount,
              payment.orderId
            );
            
            if (updatedSession) {
              console.log(`✓ Matched payment ${payment.id} to session ${session.id} via email and amount`);
              result.mappedCount++;
              result.mappedSessions.push({
                sessionId: session.id,
                paymentId: payment.id,
                amount: paymentAmount,
                email: session.email
              });
              matched = true;
              
              // Remove the matched session from the email map
              const remainingSessions = emailSessions.filter(s => s.id !== session.id);
              
              if (remainingSessions.length > 0) {
                sessionsByEmail.set(paymentEmail, remainingSessions);
              } else {
                sessionsByEmail.delete(paymentEmail);
              }
            }
          } catch (error) {
            result.errors.push(`Error updating session ${session.id}: ${error.message}`);
          }
        }
      }
    }

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(`Unexpected error: ${error.message}`);
    return result;
  }
}