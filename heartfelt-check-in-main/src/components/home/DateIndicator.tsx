import { format, addDays, subDays, isToday, isFuture } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateIndicatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const DateIndicator = ({ selectedDate, onDateChange }: DateIndicatorProps) => {
  const dayName = format(selectedDate, "EEEE");
  const dateStr = format(selectedDate, "d MMMM");
  const isTodaySelected = isToday(selectedDate);
  const isFutureDate = isFuture(selectedDate);

  const goToPreviousDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const goToNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={goToPreviousDay}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <span className="text-foreground font-bold text-lg">{dayName}</span>
          <span className="text-muted-foreground ml-2">{dateStr}</span>
          {isFutureDate && (
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent">
              Future
            </span>
          )}
        </div>
        <button
          onClick={goToNextDay}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
      {!isTodaySelected && (
        <button 
          onClick={goToToday}
          className="text-accent text-base font-semibold hover:text-accent/80 transition-colors"
        >
          Today
        </button>
      )}
    </div>
  );
};

export default DateIndicator;
