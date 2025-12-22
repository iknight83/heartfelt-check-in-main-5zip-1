// src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from "react";

export interface NotificationState {
  permissionGranted: boolean;
  permissionDenied: boolean;
  isSupported: boolean;
}

export interface ReminderSettings {
  dailyReminder: boolean;
  reminderTime: string;
  weeklySummary: boolean;
  insightMilestones: boolean;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  dailyReminder: false,
  reminderTime: "20:00",
  weeklySummary: false,
  insightMilestones: true,
};

export function getReminderSettings(): ReminderSettings {
  const stored = localStorage.getItem("notificationSettings");
  if (!stored) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveReminderSettings(settings: ReminderSettings) {
  localStorage.setItem("notificationSettings", JSON.stringify(settings));
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    permissionGranted: false,
    permissionDenied: false,
    isSupported: false,
  });

  useEffect(() => {
    if ("Notification" in window) {
      setState({
        isSupported: true,
        permissionGranted: Notification.permission === "granted",
        permissionDenied: Notification.permission === "denied",
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    const permission = await Notification.requestPermission();
    setState({
      isSupported: true,
      permissionGranted: permission === "granted",
      permissionDenied: permission === "denied",
    });
    return permission === "granted";
  }, []);

  const scheduleDailyReminder = useCallback(
    async (time: string) => {
      const settings = getReminderSettings();
      saveReminderSettings({
        ...settings,
        dailyReminder: true,
        reminderTime: time,
      });
      return true;
    },
    []
  );

  const cancelDailyReminder = useCallback(async () => {
    const settings = getReminderSettings();
    saveReminderSettings({
      ...settings,
      dailyReminder: false,
    });
    return true;
  }, []);

  const openNotificationSettings = useCallback(async () => {
    console.warn("Opening browser notification settings is not supported.");
  }, []);

  return {
    ...state,
    requestPermission,
    scheduleDailyReminder,
    cancelDailyReminder,
    openNotificationSettings,
  };
};
