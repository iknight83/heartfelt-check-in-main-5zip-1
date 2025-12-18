import { useState, useEffect, useCallback } from "react";
import { LocalNotifications, ScheduleOptions } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

interface NotificationState {
  permissionGranted: boolean;
  permissionDenied: boolean;
  isSupported: boolean;
}

const REMINDER_NOTIFICATION_ID = 1;

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    permissionGranted: false,
    permissionDenied: false,
    isSupported: false,
  });

  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (isNative) {
      try {
        const { display } = await LocalNotifications.checkPermissions();
        setState({
          isSupported: true,
          permissionGranted: display === "granted",
          permissionDenied: display === "denied",
        });
      } catch {
        setState({ isSupported: false, permissionGranted: false, permissionDenied: false });
      }
    } else if ("Notification" in window) {
      // Web fallback
      setState({
        isSupported: true,
        permissionGranted: Notification.permission === "granted",
        permissionDenied: Notification.permission === "denied",
      });
    } else {
      setState({ isSupported: false, permissionGranted: false, permissionDenied: false });
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (isNative) {
      try {
        const { display } = await LocalNotifications.requestPermissions();
        const granted = display === "granted";
        setState(prev => ({
          ...prev,
          permissionGranted: granted,
          permissionDenied: display === "denied",
        }));
        return granted;
      } catch {
        return false;
      }
    } else if ("Notification" in window) {
      // Web fallback
      const permission = await Notification.requestPermission();
      const granted = permission === "granted";
      setState(prev => ({
        ...prev,
        permissionGranted: granted,
        permissionDenied: permission === "denied",
      }));
      return granted;
    }
    return false;
  };

  const scheduleDailyReminder = useCallback(async (time: string): Promise<boolean> => {
    // Parse time (format: "8:00 PM" or "20:00")
    let hours: number;
    let minutes: number;

    if (time.includes("AM") || time.includes("PM")) {
      const [timePart, period] = time.split(" ");
      const [h, m] = timePart.split(":").map(Number);
      hours = period === "PM" && h !== 12 ? h + 12 : period === "AM" && h === 12 ? 0 : h;
      minutes = m;
    } else {
      const [h, m] = time.split(":").map(Number);
      hours = h;
      minutes = m;
    }

    // Calculate next notification time
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If the time has already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    if (isNative) {
      try {
        // Cancel existing reminder first
        await LocalNotifications.cancel({ notifications: [{ id: REMINDER_NOTIFICATION_ID }] });

        const options: ScheduleOptions = {
          notifications: [
            {
              id: REMINDER_NOTIFICATION_ID,
              title: "Time to check in",
              body: "A short moment of reflection can help you notice patterns.",
              schedule: {
                at: scheduledTime,
                repeats: true,
                every: "day",
                allowWhileIdle: true,
              },
              sound: "default",
              smallIcon: "ic_stat_icon_config_sample",
              iconColor: "#7C3AED",
            },
          ],
        };

        await LocalNotifications.schedule(options);
        
        // Save settings
        saveReminderSettings(time, true);
        return true;
      } catch (error) {
        console.error("Failed to schedule notification:", error);
        return false;
      }
    } else {
      // Web: Store the preference (actual scheduling would need a service worker)
      saveReminderSettings(time, true);
      return true;
    }
  }, [isNative]);

  const cancelDailyReminder = useCallback(async (): Promise<void> => {
    if (isNative) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: REMINDER_NOTIFICATION_ID }] });
      } catch (error) {
        console.error("Failed to cancel notification:", error);
      }
    }
    saveReminderSettings(null, false);
  }, [isNative]);

  const openNotificationSettings = useCallback(async () => {
    if (isNative) {
      try {
        // On native, this will prompt the user or they need to go to settings manually
        await LocalNotifications.requestPermissions();
      } catch {
        // Fallback: nothing we can do
      }
    }
  }, [isNative]);

  return {
    ...state,
    requestPermission,
    scheduleDailyReminder,
    cancelDailyReminder,
    openNotificationSettings,
    checkPermission,
  };
};

// Helper functions for localStorage
function saveReminderSettings(time: string | null, enabled: boolean) {
  const settings = {
    dailyReminder: enabled,
    reminderTime: time || "20:00",
    weeklySummary: false,
    insightMilestones: true,
  };
  localStorage.setItem("notificationSettings", JSON.stringify(settings));
}

export function getReminderSettings() {
  const stored = localStorage.getItem("notificationSettings");
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    dailyReminder: false,
    reminderTime: "20:00",
    weeklySummary: false,
    insightMilestones: true,
  };
}
