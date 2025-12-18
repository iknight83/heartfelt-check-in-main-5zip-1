import { ArrowLeft, Bell, Clock, Calendar, Sparkles, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useNotifications, getReminderSettings } from "@/hooks/useNotifications";

interface NotificationSettings {
  dailyReminder: boolean;
  reminderTime: string;
  weeklySummary: boolean;
  insightMilestones: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyReminder: false,
  reminderTime: "20:00",
  weeklySummary: false,
  insightMilestones: true,
};

const SettingsNotifications = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const { 
    permissionGranted, 
    permissionDenied, 
    requestPermission, 
    scheduleDailyReminder, 
    cancelDailyReminder,
    openNotificationSettings 
  } = useNotifications();

  useEffect(() => {
    const stored = getReminderSettings();
    setSettings({ ...DEFAULT_SETTINGS, ...stored });
  }, []);

  const saveSettings = (updated: NotificationSettings) => {
    setSettings(updated);
    localStorage.setItem("notificationSettings", JSON.stringify(updated));
  };

  const handleDailyToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermission();
      if (!granted) {
        return;
      }
      
      // Convert 24h time to 12h format for scheduling
      const [hours, mins] = settings.reminderTime.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const time = `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
      
      const scheduled = await scheduleDailyReminder(time);
      if (scheduled) {
        saveSettings({ ...settings, dailyReminder: true });
        toast({ title: "Reminder enabled" });
      }
    } else {
      await cancelDailyReminder();
      saveSettings({ ...settings, dailyReminder: false });
      toast({ title: "Reminder disabled" });
    }
  };

  const handleTimeChange = async (time: string) => {
    saveSettings({ ...settings, reminderTime: time });
    
    // If reminder is already enabled, reschedule with new time
    if (settings.dailyReminder) {
      const [hours, mins] = time.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const formattedTime = `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
      await scheduleDailyReminder(formattedTime);
      toast({ title: "Reminder time updated" });
    }
  };

  const handleWeeklySummary = (enabled: boolean) => {
    saveSettings({ ...settings, weeklySummary: enabled });
    toast({ title: enabled ? "Weekly summary enabled" : "Weekly summary disabled" });
  };

  const handleInsightMilestones = (enabled: boolean) => {
    saveSettings({ ...settings, insightMilestones: enabled });
    toast({ title: enabled ? "Milestones enabled" : "Milestones disabled" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-10">
        <div className="flex items-center gap-3 p-4">
          <button 
            onClick={() => navigate("/you")}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Notifications</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Explanation */}
        <div className="bg-muted/30 rounded-xl p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Notifications are meant to support reflection, not pressure.
          </p>
        </div>

        {/* Permission denied helper */}
        {permissionDenied && (
          <div className="bg-muted/50 rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Notifications are currently off. You can enable them in your phone settings.
            </p>
            <button
              onClick={openNotificationSettings}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Open notification settings
            </button>
          </div>
        )}

        {/* Daily Check-in Reminder */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Reflection Reminders
          </h2>
          
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
            {/* Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Daily check-in reminder</p>
                  <p className="text-sm text-muted-foreground">
                    A gentle nudge to reflect
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.dailyReminder}
                onCheckedChange={handleDailyToggle}
                disabled={permissionDenied}
              />
            </div>

            {/* Time Selector */}
            {settings.dailyReminder && (
              <div className="border-t border-border/50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Reminder time</p>
                      <p className="text-sm text-muted-foreground">
                        When to send the reminder
                      </p>
                    </div>
                  </div>
                  <input
                    type="time"
                    value={settings.reminderTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="bg-muted rounded-lg px-3 py-2 text-sm font-medium"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Summaries
          </h2>
          
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden divide-y divide-border/30">
            {/* Weekly Reflection */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Weekly reflection</p>
                  <p className="text-sm text-muted-foreground">
                    A gentle summary each week
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.weeklySummary}
                onCheckedChange={handleWeeklySummary}
              />
            </div>

            {/* Insight Milestones */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Insight milestones</p>
                  <p className="text-sm text-muted-foreground">
                    When new patterns form
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.insightMilestones}
                onCheckedChange={handleInsightMilestones}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsNotifications;
