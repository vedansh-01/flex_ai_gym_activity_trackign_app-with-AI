import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as storage from './storage';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Request permission for notifications */
export async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.warn('Notification permission not granted. Current status:', finalStatus);
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'FlexAI Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF5722',
      enableVibration: true,
      showBadge: true,
    });
  }

  return true;
}

/** Schedule a recurring daily notification */
export async function scheduleDailyReminder(id, title, body, hour, minute) {
  // Cancel existing with same ID if any
  await cancelReminder(id);

  // We need permissions before scheduling
  const hasPermission = await requestPermissions();
  if (!hasPermission) return null;

  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: { 
        title, 
        body, 
        sound: true,
        // Crucial for Android 8+
        priority: 'max',
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    // Store the identifier in local storage to manage it later
    const currentReminders = (await storage.getItem('reminders')) || {};
    currentReminders[id] = { identifier, hour, minute, title, enabled: true };
    await storage.setItem('reminders', currentReminders);

    console.log(`✅ Scheduled ${id} at ${hour}:${minute}`);
    return identifier;
  } catch (error) {
    console.error(`❌ Error scheduling ${id}:`, error);
    return null;
  }
}

/** Cancel a specific reminder */
export async function cancelReminder(id) {
  const currentReminders = (await storage.getItem('reminders')) || {};
  const reminder = currentReminders[id];

  if (reminder && reminder.identifier) {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
    } catch (e) {}
    delete currentReminders[id];
    await storage.setItem('reminders', currentReminders);
  }
}

/** Cancel all notifications */
export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await storage.setItem('reminders', {});
}

/** Schedule a reminder 15 minutes before the specified time */
export async function scheduleWorkoutReminder(timeStr) {
  if (!timeStr) return;
  const parts = timeStr.split(':');
  if (parts.length < 2) return;
  
  const [h, m] = parts.map(Number);
  
  // Calculate 15 mins prior
  let targetH = h;
  let targetM = m - 15;
  
  if (targetM < 0) {
    targetM += 60;
    targetH -= 1;
  }
  if (targetH < 0) {
    targetH = 23;
  }

  return await scheduleDailyReminder(
    'workout_personalized',
    '💪 Workout Soon!',
    `Get ready! Your workout starts in 15 minutes (${timeStr}).`,
    targetH,
    targetM
  );
}

/** Predefined reminders setup */
export async function setupDefaultReminders() {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return false;

  // 1. Morning Hydration (8:00 AM)
  await scheduleDailyReminder('water_morning', '💧 Hydration Time', 'Start your day with a glass of water!', 8, 0);
  
  // 2. Afternoon Workout (5:00 PM)
  await scheduleDailyReminder('workout_afternoon', '🏋️ Time to Flex!', 'Ready for your workout session?', 17, 0);

  // 3. Evening Nutrition (8:30 PM)
  await scheduleDailyReminder('meal_evening', '🥗 Log Your Meals', "Don't forget to log your dinner and macros!", 20, 30);

  return true;
}
