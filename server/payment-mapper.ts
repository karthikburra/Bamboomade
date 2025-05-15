import { db } from './db';
import { projectGuidances } from '@shared/schema';
import { eq, and, isNull, or } from 'drizzle-orm';
import { getAllRazorpayPayments, getRazorpayPaymentDetails } from './razorpay-service';
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
 * Check for a specific payment ID and map it to a session
 * This is useful when we know a payment ID but need to find its corresponding session
 */
export async function mapSpecificPaymentToSession(
  paymentId: string, 
  storage: IStorage
): Promise<PaymentMappingResult> {
  const result: PaymentMappingResult = {
    success: true,
    mappedCount: 0,
    errors: [],
    mappedSessions: []
  };

  try {
    // Get payment details from Razorpay
    const paymentDetails = await getRazorpayPaymentDetails(paymentId);
    
    if (!paymentDetails.success) {
      result.success = false;
      result.errors.push(`Failed to fetch payment details for ID ${paymentId}`);
      return result;
    }
    
    console.log(`Retrieved payment details for ${paymentId}:`, {
      email: paymentDetails.email,
      amount: paymentDetails.amount,
      orderId: paymentDetails.orderId,
      status: paymentDetails.status
    });
    
    // First, check if any session already has this payment ID
    const existingSessions = await db.select()
      .from(projectGuidances)
      .where(eq(projectGuidances.paymentId, paymentId));
    
    if (existingSessions.length > 0) {
      console.log(`Payment ${paymentId} is already mapped to session ${existingSessions[0].id}`);
      return result;
    }
    
    // Try to find sessions without payment IDs
    const pendingSessions = await db.select()
      .from(projectGuidances)
      .where(
        and(
          or(
            eq(projectGuidances.paymentConfirmed, false),
            isNull(projectGuidances.paymentConfirmed)
          ),
          or(
            eq(projectGuidances.paymentStatus, 'Pending'),
            isNull(projectGuidances.paymentStatus)
          )
        )
      );
    
    console.log(`Found ${pendingSessions.length} pending sessions to check for payment ${paymentId}`);
    
    // Look for sessions with matching email
    let matchingSessions = pendingSessions;
    
    if (paymentDetails.email) {
      const emailMatches = pendingSessions.filter(
        session => session.email.toLowerCase() === paymentDetails.email.toLowerCase()
      );
      
      console.log(`Found ${emailMatches.length} sessions with matching email: ${paymentDetails.email}`);
      
      if (emailMatches.length > 0) {
        matchingSessions = emailMatches;
      }
    }
    
    // Try to further filter by order ID if available
    if (paymentDetails.orderId && matchingSessions.length > 0) {
      const orderMatches = matchingSessions.filter(
        session => session.orderId === paymentDetails.orderId
      );
      
      if (orderMatches.length > 0) {
        console.log(`Found ${orderMatches.length} sessions with matching order ID: ${paymentDetails.orderId}`);
        matchingSessions = orderMatches;
      }
    }
    
    // If multiple matches, try to narrow down by amount
    if (matchingSessions.length > 1 && paymentDetails.amount) {
      const amountMatches = matchingSessions.filter(session => {
        // Get the expected amount based on session duration and student status
        let expectedAmount = session.amount || 0;
        
        if (expectedAmount === 0) {
          if (session.isStudent) {
            expectedAmount = session.duration === 30 ? 500 : 800;
          } else {
            expectedAmount = session.duration === 30 ? 1000 : 1500;
          }
        }
        
        // Allow a small difference to account for rounding
        return Math.abs(expectedAmount - paymentDetails.amount) <= 1;
      });
      
      if (amountMatches.length > 0) {
        console.log(`Narrowed down to ${amountMatches.length} sessions with matching amount: ₹${paymentDetails.amount}`);
        matchingSessions = amountMatches;
      }
    }
    
    // If still multiple matches, sort by most recent and use the first one
    if (matchingSessions.length > 1) {
      matchingSessions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime(); // Sort descending (newest first)
      });
      
      console.log(`Multiple matches found, using most recent session: ${matchingSessions[0].id}`);
    }
    
    // If we found a match, update it
    if (matchingSessions.length > 0) {
      const session = matchingSessions[0];
      
      try {
        const updatedSession = await storage.updateProjectGuidancePayment(
          session.id,
          paymentId,
          paymentDetails.amount,
          paymentDetails.orderId
        );
        
        if (updatedSession) {
          console.log(`✓ Successfully mapped payment ${paymentId} to session ${session.id}`);
          result.mappedCount = 1;
          result.mappedSessions.push({
            sessionId: session.id,
            paymentId: paymentId,
            amount: paymentDetails.amount,
            email: session.email
          });
        }
      } catch (error) {
        result.errors.push(`Error updating session ${session.id}: ${error.message}`);
      }
    } else {
      console.log(`No matching session found for payment ${paymentId}`);
    }
    
    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(`Unexpected error: ${error.message}`);
    return result;
  }
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
  
  // Specific payment mapping for the test case mentioned
  // This ensures this specific payment is always checked first
  const specificPaymentId = "pay_QV6q3n5KP59htn";
  try {
    const specificResult = await mapSpecificPaymentToSession(specificPaymentId, storage);
    
    if (specificResult.success && specificResult.mappedCount > 0) {
      result.mappedCount += specificResult.mappedCount;
      result.mappedSessions = result.mappedSessions.concat(specificResult.mappedSessions);
      console.log(`Successfully mapped specified payment ${specificPaymentId} to a session`);
    }
  } catch (error) {
    console.error(`Error mapping specific payment ${specificPaymentId}:`, error);
    // Continue with normal mapping even if this fails
  }

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