import cron from 'node-cron';
import { Challenge } from '../models/Challenge.model';
import { sendPushToAll } from '../utils/firebase';

/**
 * Runs at 9:00 AM UTC every day.
 * Sends a push notification to all users about the daily challenge.
 */
export function startDailyChallengeNotification(): void {
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running daily challenge notification...');
    try {
      const today = new Date().toISOString().slice(0, 10);
      const challenge = await Challenge.findOne({ date: today });

      if (!challenge) {
        console.warn('[Cron] No challenge found for today:', today);
        return;
      }

      const difficultyEmoji = {
        easy: '🟢',
        medium: '🟡',
        hard: '🔴',
      }[challenge.difficulty] ?? '⚡';

      await sendPushToAll(
        `${difficultyEmoji} Daily DSA Challenge is Live!`,
        `Today: ${challenge.title} — ${challenge.topic.replace('-', ' ')}. Keep your streak going! 🔥`,
        {
          type: 'daily_challenge',
          date: today,
          topic: challenge.topic,
          difficulty: challenge.difficulty,
        }
      );

      console.log(`[Cron] Daily challenge notification sent for: ${challenge.title}`);
    } catch (error) {
      console.error('[Cron] Failed to send daily challenge notification:', error);
    }
  }, {
    timezone: 'UTC',
  });

  console.log('[Cron] Daily challenge notification scheduled at 09:00 UTC');
}
