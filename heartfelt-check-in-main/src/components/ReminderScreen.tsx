import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, Bell, Settings } from "lucide-react";
import { Button } from "./ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "@/hooks/use-toast";

interface ReminderScreenProps {
  onEnable: (time: string) => void;
  onSkip: () => void;
  onBack: () => void;
}

const hours = Array.from({ length: 12 }, (_, i) => i + 1);
const minutes = ["00", "15", "30", "45"];
const periods = ["AM", "PM"];

const ReminderScreen = ({ onEnable, onSkip, onBack }: ReminderScreenProps) => {
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState("PM");
  const [isRequesting, setIsRequesting] = useState(false);

  const { 
    permissionDenied, 
    requestPermission, 
    scheduleDailyReminder,
    openNotificationSettings 
  } = useNotifications();

  const handleEnable = async () => {
    setIsRequesting(true);
    
    try {
      // Request permission first
      const granted = await requestPermission();
      
      if (!granted) {
        // Don't show error, just show calm helper text (handled by UI)
        setIsRequesting(false);
        return;
      }

      // Schedule the notification
      const time = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
      const scheduled = await scheduleDailyReminder(time);
      
      if (scheduled) {
        toast({
          title: "Reminder set",
          description: `You'll get a gentle nudge at ${time}`,
        });
        onEnable(time);
      }
    } catch (error) {
      console.error("Error setting reminder:", error);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header with back button */}
      <div className="h-14 sm:h-16 flex items-center px-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-foreground/70 hover:text-foreground transition-colors rounded-lg hover:bg-secondary/30"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col justify-center px-4 sm:px-6 pb-8 max-w-lg mx-auto w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6 opacity-0 animate-fade-in" style={{ animationDelay: "0ms", animationFillMode: "forwards" }}>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h1 
          className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-3 opacity-0 animate-fade-in"
          style={{ animationDelay: "100ms", animationFillMode: "forwards" }}
        >
          Don't forget to check in
        </h1>

        {/* Subtitle */}
        <p 
          className="text-soft text-center mb-10 opacity-0 animate-fade-in"
          style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
        >
          A short daily check-in can help you notice patterns over time.
        </p>

        {/* Permission denied message */}
        {permissionDenied && (
          <div 
            className="mb-6 p-4 bg-muted/50 rounded-xl opacity-0 animate-fade-in"
            style={{ animationDelay: "250ms", animationFillMode: "forwards" }}
          >
            <p className="text-sm text-muted-foreground text-center mb-3">
              Notifications are currently off. You can enable them in your phone settings.
            </p>
            <button
              onClick={openNotificationSettings}
              className="flex items-center justify-center gap-2 w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Open notification settings
            </button>
          </div>
        )}

        {/* Time Picker */}
        <div 
          className="opacity-0 animate-fade-in mb-10"
          style={{ animationDelay: "300ms", animationFillMode: "forwards" }}
        >
          <div className="flex justify-center items-center gap-2">
            {/* Hour Wheel */}
            <div className="relative h-40 w-16 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background via-transparent to-background z-10" />
              <div className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 bg-secondary/50 rounded-lg pointer-events-none" />
              <div className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory py-14">
                {hours.map((hour) => (
                  <button
                    key={hour}
                    onClick={() => setSelectedHour(hour)}
                    className={cn(
                      "w-full h-12 flex items-center justify-center text-xl font-medium snap-center transition-all",
                      selectedHour === hour
                        ? "text-foreground scale-110"
                        : "text-foreground/40"
                    )}
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-2xl font-medium text-foreground">:</span>

            {/* Minute Wheel */}
            <div className="relative h-40 w-16 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background via-transparent to-background z-10" />
              <div className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 bg-secondary/50 rounded-lg pointer-events-none" />
              <div className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory py-14">
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    onClick={() => setSelectedMinute(minute)}
                    className={cn(
                      "w-full h-12 flex items-center justify-center text-xl font-medium snap-center transition-all",
                      selectedMinute === minute
                        ? "text-foreground scale-110"
                        : "text-foreground/40"
                    )}
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM Wheel */}
            <div className="relative h-40 w-16 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background via-transparent to-background z-10" />
              <div className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 bg-secondary/50 rounded-lg pointer-events-none" />
              <div className="h-full overflow-y-auto scrollbar-hide snap-y snap-mandatory py-14">
                {periods.map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={cn(
                      "w-full h-12 flex items-center justify-center text-xl font-medium snap-center transition-all",
                      selectedPeriod === period
                        ? "text-foreground scale-110"
                        : "text-foreground/40"
                    )}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div 
          className="space-y-3 opacity-0 animate-fade-in"
          style={{ animationDelay: "400ms", animationFillMode: "forwards" }}
        >
          <Button
            onClick={handleEnable}
            disabled={isRequesting}
            className="w-full h-14 text-lg font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isRequesting ? "Setting up..." : "Enable reminder"}
          </Button>

          <button
            onClick={onSkip}
            className="w-full py-3 text-soft hover:text-foreground transition-colors text-base"
          >
            Skip for now
          </button>
        </div>
      </main>
    </div>
  );
};

export default ReminderScreen;
