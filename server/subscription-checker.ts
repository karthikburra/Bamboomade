import { storage } from "./storage";

/**
 * Helper function to check and update user subscription statuses
 * This should be run periodically to ensure subscription status is up-to-date
 */
export async function checkAndUpdateSubscriptions(): Promise<{
  checked: number;
  expired: number;
  active: number;
}> {
  try {
    console.log("Running subscription status check...");
    
    // Get users with expired subscriptions that haven't been marked as expired
    const expiredUsers = await storage.getUsersWithExpiredSubscriptions();
    let expiredCount = 0;
    
    // Mark subscriptions as expired
    for (const user of expiredUsers) {
      if (user.aiAccessExpiryDate) {
        await storage.updateUserSubscription(
          user.id, 
          user.aiAccessExpiryDate, // Keep the same expiry date
          'expired' // Update the status to expired
        );
        expiredCount++;
      }
    }
    
    // Record the total number of subscriptions we checked
    const checkedCount = expiredUsers.length;
    
    // Get active subscriptions count for reporting
    const activeUsers = await storage.getUsersWithActiveSubscriptions();
    const activeCount = activeUsers.length;
    
    console.log(`Subscription check completed: ${checkedCount} checked, ${expiredCount} expired, ${activeCount} active`);
    
    return {
      checked: checkedCount,
      expired: expiredCount,
      active: activeCount
    };
  } catch (error) {
    console.error("Error checking subscriptions:", error);
    throw error;
  }
}