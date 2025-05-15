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
      
      // If no match by order ID, try matching by email + amount
      const emailSessions = sessionsByEmail.get(paymentEmail) || [];
      
      if (emailSessions.length > 0) {
        // Find sessions with matching email and a close amount match
        // We allow a small margin of error in the amount
        const amountMatchSessions = emailSessions.filter(session => {
          // Don't remap sessions that already have a payment ID
          if (session.paymentId) {
            return false;
          }
          
          // Check if the session has an amount, and if so, if it matches the payment amount
          if (session.amount) {
            // Allow a 1 rupee difference to account for rounding errors
            return Math.abs(session.amount - paymentAmount) <= 1;
          }
          
          // If the session doesn't have an amount, estimate based on duration and isStudent
          let estimatedAmount = 0;
          if (session.isStudent) {
            estimatedAmount = session.duration === 30 ? 500 : 800;
          } else {
            estimatedAmount = session.duration === 30 ? 1000 : 1500;
          }
          
          // Allow a 1 rupee difference to account for rounding errors
          return Math.abs(estimatedAmount - paymentAmount) <= 1;
        });
        
        if (amountMatchSessions.length === 1) {
          // If only one session matches, update it
          const session = amountMatchSessions[0];
          
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