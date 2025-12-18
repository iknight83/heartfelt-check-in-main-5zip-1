import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface MoodCardProps {
  mood: string;
  context?: string[];
  time: string;
}

const MoodCard = ({ mood, context, time }: MoodCardProps) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(() => 
    format(new Date(), "HH:mm")
  );

  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(format(new Date(), "HH:mm"));
    };

    // Update immediately
    updateTime();

    // Set up interval to update every minute
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleTap = () => {
    const triggers = context?.join(",") || "";
    navigate(`/mood?mood=${encodeURIComponent(mood)}&time=${encodeURIComponent(currentTime)}&triggers=${encodeURIComponent(triggers)}`);
  };

  return (
    <section className="space-y-3">
      <h2 className="text-foreground font-semibold text-lg">Latest</h2>
      <button
        onClick={handleTap}
        className="w-full flex items-center justify-between bg-gradient-to-r from-card to-card/70 rounded-2xl p-4 border border-border/30 hover:border-border/50 transition-all group"
      >
        <div className="flex flex-col items-start gap-1">
          <span className="text-accent font-semibold text-xl">{mood}</span>
          {context && context.length > 0 && (
            <span className="text-muted-foreground text-sm">
              {context.join(", ")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{currentTime}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </button>
    </section>
  );
};

export default MoodCard;
