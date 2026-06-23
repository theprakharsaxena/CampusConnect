import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getMessaging, MulticastMessage } from 'firebase-admin/messaging';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin SDK
const serviceAccountPath = path.resolve(process.cwd(), 'firebase-service-account.json');

let firebaseApp: App | undefined;

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
  if (getApps().length === 0) {
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
    });
  } else {
    firebaseApp = getApps()[0];
  }
  console.log('Firebase Admin SDK initialized');
} else {
  console.warn('firebase-service-account.json not found — push notifications disabled');
}

/**
 * Send a push notification to specific device tokens.
 */
export const sendPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  if (!firebaseApp || tokens.length === 0) return;

  const validTokens = tokens.filter((t) => t && t.trim().length > 0);
  if (validTokens.length === 0) return;

  try {
    const message: MulticastMessage = {
      tokens: validTokens,
      notification: { title, body },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'campusconnect_channel',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            alert: { title, body },
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const messaging = getMessaging(firebaseApp);
    const response = await messaging.sendEachForMulticast(message);

    if (response.failureCount > 0) {
      response.responses.forEach((resp: { success: boolean; error?: { message?: string } }, i: number) => {
        if (!resp.success) {
          console.warn(`FCM send failed for token ${i}:`, resp.error?.message);
        }
      });
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

/**
 * Send push notification to a specific user by their ID.
 */
export const sendPushToUser = async (
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> => {
  try {
    const { User } = await import('../models');
    const user = await User.findById(userId).select('fcmTokens');
    if (user && user.fcmTokens && user.fcmTokens.length > 0) {
      await sendPushNotification(user.fcmTokens, title, body, data);
    }
  } catch (error) {
    console.error('Error sending push to user:', error);
  }
};

/**
 * Send push notification to all users (e.g., new post approved).
 */
export const sendPushToAll = async (
  title: string,
  body: string,
  data?: Record<string, string>,
  excludeUserId?: string
): Promise<void> => {
  try {
    const { User } = await import('../models');
    const query: Record<string, unknown> = {
      fcmTokens: { $exists: true, $ne: [] },
      isBlocked: false,
    };
    if (excludeUserId) query._id = { $ne: excludeUserId };

    const users = await User.find(query).select('fcmTokens');
    const allTokens = users.flatMap((u) => u.fcmTokens || []);

    if (allTokens.length > 0) {
      // FCM allows max 500 tokens per multicast
      for (let i = 0; i < allTokens.length; i += 500) {
        const batch = allTokens.slice(i, i + 500);
        await sendPushNotification(batch, title, body, data);
      }
    }
  } catch (error) {
    console.error('Error sending push to all:', error);
  }
};
