import { ChevronRight, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { MoodEntry } from "@/hooks/useMoodState";

// Color mapping for moods
const MOOD_COLORS: Record<string, string> = {
  // Amazing level (yellow)
  "Amazing": "hsl(45, 90%, 50%)", "Thrilled": "hsl(45, 90%, 50%)", "Radiant": "hsl(45, 90%, 50%)", 
  "Inspired": "hsl(45, 90%, 50%)", "Alive": "hsl(45, 90%, 50%)", "Ecstatic": "hsl(45, 90%, 50%)", 
  "Blissful": "hsl(45, 90%, 50%)", "Euphoric": "hsl(45, 90%, 50%)", "Empowered": "hsl(45, 90%, 50%)",
  // Great level (green)
  "Great": "hsl(140, 60%, 50%)", "Joyful": "hsl(140, 60%, 50%)", "Satisfied": "hsl(140, 60%, 50%)", 
  "Motivated": "hsl(140, 60%, 50%)", "Grateful": "hsl(140, 60%, 50%)", "Energetic": "hsl(140, 60%, 50%)", 
  "Confident": "hsl(140, 60%, 50%)", "Fulfilled": "hsl(140, 60%, 50%)", "Happy": "hsl(140, 60%, 50%)",
  // Nice level (cyan)
  "Nice": "hsl(190, 80%, 50%)", "Relaxed": "hsl(190, 80%, 50%)", "Comfortable": "hsl(190, 80%, 50%)", 
  "Hopeful": "hsl(190, 80%, 50%)", "Lively": "hsl(190, 80%, 50%)", "Content": "hsl(190, 80%, 50%)", 
  "Pleasant": "hsl(190, 80%, 50%)", "Optimistic": "hsl(190, 80%, 50%)", "Cheerful": "hsl(190, 80%, 50%)",
  // Okay level (blue)
  "Okay": "hsl(210, 70%, 55%)", "Steady": "hsl(210, 70%, 55%)", "Balanced": "hsl(210, 70%, 55%)", 
  "Peaceful": "hsl(210, 70%, 55%)", "Easygoing": "hsl(210, 70%, 55%)", "Calm": "hsl(210, 70%, 55%)", 
  "Neutral": "hsl(210, 70%, 55%)", "Stable": "hsl(210, 70%, 55%)", "Fine": "hsl(210, 70%, 55%)",
  // Meh level (purple)
  "Meh": "hsl(270, 55%, 55%)", "Uninspired": "hsl(270, 55%, 55%)", "Restless": "hsl(270, 55%, 55%)", 
  "Indifferent": "hsl(270, 55%, 55%)", "Tired": "hsl(270, 55%, 55%)", "Bored": "hsl(270, 55%, 55%)", 
  "Distracted": "hsl(270, 55%, 55%)", "Unfocused": "hsl(270, 55%, 55%)", "Flat": "hsl(270, 55%, 55%)",
  // Low level (pink)
  "Low": "hsl(330, 60%, 55%)", "Irritated": "hsl(330, 60%, 55%)", "Worried": "hsl(330, 60%, 55%)", 
  "Embarrassed": "hsl(330, 60%, 55%)", "Down": "hsl(330, 60%, 55%)", "Anxious": "hsl(330, 60%, 55%)", 
  "Sad": "hsl(330, 60%, 55%)", "Lonely": "hsl(330, 60%, 55%)", "Stressed": "hsl(330, 60%, 55%)",
  // Awful level (red)
  "Awful": "hsl(0, 70%, 55%)", "Frustrated": "hsl(0, 70%, 55%)", "Overwhelmed": "hsl(0, 70%, 55%)", 
  "Drained": "hsl(0, 70%, 55%)", "Hopeless": "hsl(0, 70%, 55%)", "Angry": "hsl(0, 70%, 55%)", 
  "Broken": "hsl(0, 70%, 55%)", "Devastated": "hsl(0, 70%, 55%)", "Miserable": "hsl(0, 70%, 55%)",
};

interface LatestMoodsProps {
  moods: MoodEntry[];
  onDelete?: (id: string) => void;
  selectedDate: Date;
}

const LatestMoods = ({ moods, onDelete, selectedDate }: LatestMoodsProps) => {
  const navigate = useNavigate();

  const handleMoodClick = (entry: MoodEntry) => {
    const triggers = entry.triggers?.join(",") || "";
    const dateParam = format(selectedDate, "yyyy-MM-dd");
    navigate(`/mood?mood=${encodeURIComponent(entry.mood)}&time=${encodeURIComponent(entry.time)}&triggers=${encodeURIComponent(triggers)}&date=${dateParam}&id=${entry.id}`);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDelete?.(id);
  };

  const handleAddNew = () => {
    const dateParam = format(selectedDate, "yyyy-MM-dd");
    navigate(`/mood?new=true&date=${dateParam}`);
  };

  const getMoodColor = (mood: string) => {
    return MOOD_COLORS[mood] || "hsl(var(--primary))";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">Daily check in</h3>
      <div className="space-y-2">
        {moods.length === 0 ? (
          <button
            onClick={handleAddNew}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-dashed border-border/50 hover:bg-card/70 hover:border-accent/50 transition-all duration-200 text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-5 h-5" />
            <span>Add your first check in</span>
          </button>
        ) : (
          <>
            {moods.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-2"
              >
                <button
                  onClick={() => handleMoodClick(entry)}
                  className="flex-1 flex items-center justify-between p-5 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 hover:bg-card/70 transition-all duration-200 group"
                >
                  <div className="flex flex-col items-start gap-1">
                    <span 
                      className="text-xl font-bold"
                      style={{ color: getMoodColor(entry.mood) }}
                    >
                      {entry.mood}
                    </span>
                    {entry.triggers && entry.triggers.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {entry.triggers.join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm">{entry.time}</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </button>
                <button
                  onClick={(e) => handleDelete(e, entry.id)}
                  className="p-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {/* Add another check-in button */}
            <button
              onClick={handleAddNew}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-card/30 backdrop-blur-sm border border-dashed border-border/30 hover:bg-card/50 hover:border-accent/50 transition-all duration-200 text-muted-foreground/70 hover:text-foreground text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add another check in</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LatestMoods;
