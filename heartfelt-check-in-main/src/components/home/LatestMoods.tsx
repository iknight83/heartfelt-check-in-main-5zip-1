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
      
      {moods.length === 0 ? (
        <button
          onClick={handleAddNew}
          className="w-full flex flex-col items-center justify-center gap-4 py-10 px-6 rounded-3xl bg-gradient-to-br from-accent/20 via-accent/10 to-primary/10 border-2 border-accent/40 hover:border-accent/60 hover:from-accent/25 hover:via-accent/15 hover:to-primary/15 transition-all duration-300 shadow-lg shadow-accent/10 hover:shadow-accent/20 active:scale-[0.98]"
        >
          <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent/50 flex items-center justify-center">
            <Plus className="w-10 h-10 text-accent" strokeWidth={2.5} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-semibold text-foreground">How are you feeling?</p>
            <p className="text-sm text-muted-foreground">Tap to check in today</p>
          </div>
        </button>
      ) : (
        <div className="space-y-3">
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
          
          <button
            onClick={handleAddNew}
            className="w-full flex items-center justify-center gap-3 py-4 px-5 rounded-2xl bg-accent/10 border border-accent/30 hover:bg-accent/20 hover:border-accent/50 transition-all duration-200 active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-accent" strokeWidth={2.5} />
            </div>
            <span className="text-accent font-medium">Add another check in</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default LatestMoods;
