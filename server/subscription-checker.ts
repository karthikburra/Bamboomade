import { storage } from "./storage";

/**
 * Helper function to check and update user subscription statuses
 * This should be run periodically to ensure subscription status is up-to-date
 * 
 * @param userIds Optional array of specific user IDs to check
 * @returns Statistics on subscription checks
 */
export async function checkAndUpdateSubscriptions(userIds?: number[]): Promise<{
  checked: number;
  expired: number;
  active: number;
  updatedIds?: number[];
  statusMap?: Record<number, string>;
}> {
  try {
    console.log(`Running subscription status check${userIds ? ' for specific users' : ''}...`);
    
    let expiredUsers = [];
    let updatedIds = [];
    let statusMap: Record<number, string> = {};
    
    // If specific user IDs are provided, check only those users
    if (userIds && userIds.length > 0) {
      for (const userId of userIds) {
        const user = await storage.getUser(userId);
        if (!user) continue;
        
        const now = new Date();
        
        // Determine subscription status
        if (user.aiAccessExpiryDate) {
          const expiryDate = new Date(user.aiAccessExpiryDate);
          const isActive = expiryDate > now;
          const status = isActive ? 'active' : 'expired';
          
          // Only update if status changed
          if (status !== user.subscriptionStatus) {
            await storage.updateUserSubscription(
              userId,
              user.aiAccessExpiryDate,
              status
            );
            updatedIds.push(userId);
          }
          
          statusMap[userId] = status;
        } else {
          // No subscription
          statusMap[userId] = 'inactive';
        }
      }
      
      return {
        checked: userIds.length,
        expired: Object.values(statusMap).filter(s => s === 'expired').length,
        active: Object.values(statusMap).filter(s => s === 'active').length,
        updatedIds,
        statusMap
      };
    } else {
      // Get users with expired subscriptions that haven't been marked as expired
      expiredUsers = await storage.getUsersWithExpiredSubscriptions();
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
          updatedIds.push(user.id);
          statusMap[user.id] = 'expired';
        }
      }
      
      // Record the total number of subscriptions we checked
      const checkedCount = expiredUsers.length;
      
      // Get active subscriptions count for reporting
      const activeUsers = await storage.getUsersWithActiveSubscriptions();
      const activeCount = activeUsers.length;
      
      // Add active users to status map
      for (const user of activeUsers) {
        statusMap[user.id] = 'active';
      }
      
      console.log(`Subscription check completed: ${checkedCount} checked, ${expiredCount} expired, ${activeCount} active`);
      
      return {
        checked: checkedCount,
        expired: expiredCount,
        active: activeCount,
        updatedIds,
        statusMap
      };
    }
  } catch (error) {
    console.error("Error checking subscriptions:", error);
    throw error;
  }
}