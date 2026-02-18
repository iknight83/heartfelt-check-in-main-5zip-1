import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import BottomNav from "@/components/home/BottomNav";
import { saveMood, getCurrentMood, addMoodToHistory, updateMoodInHistory } from "@/hooks/useMoodState";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type NavTab = "home" | "insights" | "you";

// Mood color mapping
const MOOD_COLORS: Record<string, string> = {
  // Awful level (red)
  "Frustrated": "hsl(0, 70%, 55%)", "Overwhelmed": "hsl(0, 70%, 55%)", "Drained": "hsl(0, 70%, 55%)", 
  "Hopeless": "hsl(0, 70%, 55%)", "Angry": "hsl(0, 70%, 55%)", "Broken": "hsl(0, 70%, 55%)", 
  "Devastated": "hsl(0, 70%, 55%)", "Miserable": "hsl(0, 70%, 55%)", "Awful": "hsl(0, 70%, 55%)",
  // Low level (pink)
  "Irritated": "hsl(330, 60%, 55%)", "Worried": "hsl(330, 60%, 55%)", "Embarrassed": "hsl(330, 60%, 55%)", 
  "Down": "hsl(330, 60%, 55%)", "Anxious": "hsl(330, 60%, 55%)", "Sad": "hsl(330, 60%, 55%)", 
  "Lonely": "hsl(330, 60%, 55%)", "Stressed": "hsl(330, 60%, 55%)", "Low": "hsl(330, 60%, 55%)",
  // Meh level (purple)
  "Uninspired": "hsl(270, 55%, 55%)", "Restless": "hsl(270, 55%, 55%)", "Indifferent": "hsl(270, 55%, 55%)", 
  "Tired": "hsl(270, 55%, 55%)", "Bored": "hsl(270, 55%, 55%)", "Distracted": "hsl(270, 55%, 55%)", 
  "Unfocused": "hsl(270, 55%, 55%)", "Flat": "hsl(270, 55%, 55%)", "Meh": "hsl(270, 55%, 55%)",
  // Okay level (blue)
  "Steady": "hsl(210, 70%, 55%)", "Balanced": "hsl(210, 70%, 55%)", "Peaceful": "hsl(210, 70%, 55%)", 
  "Easygoing": "hsl(210, 70%, 55%)", "Calm": "hsl(210, 70%, 55%)", "Neutral": "hsl(210, 70%, 55%)", 
  "Stable": "hsl(210, 70%, 55%)", "Fine": "hsl(210, 70%, 55%)", "Okay": "hsl(210, 70%, 55%)",
  // Nice level (cyan)
  "Relaxed": "hsl(190, 80%, 50%)", "Comfortable": "hsl(190, 80%, 50%)", "Hopeful": "hsl(190, 80%, 50%)", 
  "Lively": "hsl(190, 80%, 50%)", "Content": "hsl(190, 80%, 50%)", "Pleasant": "hsl(190, 80%, 50%)", 
  "Optimistic": "hsl(190, 80%, 50%)", "Cheerful": "hsl(190, 80%, 50%)", "Nice": "hsl(190, 80%, 50%)",
  // Great level (green)
  "Joyful": "hsl(140, 60%, 50%)", "Satisfied": "hsl(140, 60%, 50%)", "Motivated": "hsl(140, 60%, 50%)", 
  "Grateful": "hsl(140, 60%, 50%)", "Energetic": "hsl(140, 60%, 50%)", "Confident": "hsl(140, 60%, 50%)", 
  "Fulfilled": "hsl(140, 60%, 50%)", "Happy": "hsl(140, 60%, 50%)", "Great": "hsl(140, 60%, 50%)",
  // Amazing level (yellow)
  "Thrilled": "hsl(45, 90%, 50%)", "Radiant": "hsl(45, 90%, 50%)", "Inspired": "hsl(45, 90%, 50%)", 
  "Alive": "hsl(45, 90%, 50%)", "Ecstatic": "hsl(45, 90%, 50%)", "Blissful": "hsl(45, 90%, 50%)", 
  "Euphoric": "hsl(45, 90%, 50%)", "Empowered": "hsl(45, 90%, 50%)", "Amazing": "hsl(45, 90%, 50%)",
};

const MoodDetail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  
  const isNewEntry = searchParams.get("new") === "true";
  const entryId = searchParams.get("id");
  const dateParam = searchParams.get("date");

  // Parse the date from URL or use today
  const selectedDate = useMemo(() => {
    if (dateParam) {
      const parsed = parse(dateParam, "yyyy-MM-dd", new Date());
      if (isValid(parsed)) return parsed;
    }
    return new Date();
  }, [dateParam]);

  // Get values from URL params
  const urlMood = searchParams.get("mood");
  const urlTime = searchParams.get("time");
  const urlTriggers = searchParams.get("triggers");

  // Get initial values from URL params or localStorage
  const storedMood = getCurrentMood();
  const [mood, setMood] = useState(isNewEntry ? "Okay" : (urlMood || storedMood.mood));
  const [time, setTime] = useState(
    isNewEntry 
      ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      : (urlTime || storedMood.time)
  );
  const [triggers, setTriggers] = useState((urlTriggers || (isNewEntry ? "" : storedMood.triggers.join(","))).split(",").filter(Boolean));
  const [note, setNote] = useState(isNewEntry ? "" : storedMood.note);

  // Sync mood with URL when it changes (e.g., coming back from MoodAdjust)
  useEffect(() => {
    if (urlMood) {
      setMood(urlMood);
    }
  }, [urlMood]);

  // Sync triggers with URL when it changes
  useEffect(() => {
    if (urlTriggers !== null) {
      setTriggers(urlTriggers.split(",").filter(Boolean));
    }
  }, [urlTriggers]);

  // Save to localStorage whenever values change (only for non-new entries)
  useEffect(() => {
    if (!isNewEntry && !entryId) {
      saveMood({
        mood,
        triggers,
        time,
      });
    }
  }, [mood, triggers.join(","), time, isNewEntry, entryId]);

  // Auto-save note with debounce (only for non-new entries)
  useEffect(() => {
    if (!isNewEntry && !entryId) {
      const timer = setTimeout(() => {
        saveMood({ note });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [note, isNewEntry, entryId]);

  // Get color based on mood
  const moodColor = useMemo(() => {
    return MOOD_COLORS[mood] || "hsl(210, 70%, 55%)";
  }, [mood]);

  // Format date for display
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const dateStr = `${selectedDate.toLocaleDateString('en-US', options)} · ${time}`;

  const handleSave = () => {
    if (entryId) {
      // Update existing entry
      updateMoodInHistory(entryId, { mood, triggers, note, time });
      toast.success("Mood updated");
    } else {
      // Create new entry with the selected date
      const entryDate = new Date(selectedDate);
      const [hours, minutes] = time.split(':').map(Number);
      entryDate.setHours(hours, minutes, 0, 0);
      addMoodToHistory(mood, triggers, note, entryDate);
      toast.success("Mood saved");
    }
    navigate("/home");
  };

  return (
    <div className="min-h-screen gradient-bg pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-12 pb-8">
        <button
          onClick={() => navigate("/home")}
          className="p-2 -ml-2 rounded-full bg-muted/20 text-foreground hover:bg-muted/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-muted-foreground text-sm">{dateStr}</span>
      </div>

      <div className="max-w-md mx-auto px-5 space-y-8">
        {/* Mood Display - left aligned with dynamic color, clickable */}
        <button 
          onClick={() => navigate(`/mood-adjust?mood=${encodeURIComponent(mood)}&time=${encodeURIComponent(time)}&triggers=${encodeURIComponent(triggers.join(","))}&new=${isNewEntry}&date=${dateParam || format(selectedDate, "yyyy-MM-dd")}${entryId ? `&id=${entryId}` : ""}`)}
          className="text-left space-y-2 py-5 px-5 w-full rounded-2xl bg-card/20 border border-border/20 cursor-pointer transition-all duration-300 hover:bg-card/40 hover:border-accent/30 hover:scale-[1.02] active:scale-[0.99] group animate-mood-pulse"
        >
          <p className="text-muted-foreground text-lg">I'm feeling</p>
          <h1 
            className="text-5xl font-bold transition-all duration-300 group-hover:brightness-125 group-hover:scale-[1.03]"
            style={{ color: moodColor }}
          >
            {mood}
          </h1>
          <p className="text-accent/60 text-xs mt-1">Tap to change mood</p>
        </button>

        {/* Thoughts Section */}
        <div className="space-y-4">
          <p className="text-xl font-bold text-foreground">Note</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything you found interesting"
            className="w-full px-5 py-4 rounded-2xl bg-card/30 border border-border/30 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-accent/40 focus:bg-card/50 transition-all min-h-[80px] text-base"
            rows={2}
          />
        </div>

        {/* Context Tags */}
        <div className="space-y-4">
          <button 
            onClick={() => navigate(`/triggers?mood=${encodeURIComponent(mood)}&time=${encodeURIComponent(time)}&triggers=${encodeURIComponent(triggers.join(","))}&new=${isNewEntry}&date=${dateParam || format(selectedDate, "yyyy-MM-dd")}${entryId ? `&id=${entryId}` : ""}`)}
            className="flex items-center gap-3 cursor-pointer group transition-all duration-200 hover:opacity-90"
          >
            <p className="text-xl font-bold text-foreground group-hover:underline group-hover:underline-offset-4 group-hover:decoration-accent/40">Triggers</p>
            <div className="p-1.5 rounded-full text-accent group-hover:bg-accent/15 group-hover:shadow-[0_0_8px_rgba(100,180,255,0.3)] transition-all duration-200">
              <Plus className="w-6 h-6" />
            </div>
          </button>
          <p className="text-muted-foreground/60 text-xs -mt-2">Add what influenced your mood</p>
          <div className="flex flex-wrap gap-2">
            {triggers.map((trigger) => (
              <span
                key={trigger}
                className="px-4 py-2 rounded-full bg-card/60 text-foreground text-base font-medium border border-border/30"
              >
                {trigger}
              </span>
            ))}
          </div>
        </div>

        {/* Save Button - show for new entries AND when editing existing */}
        {(isNewEntry || entryId) && (
          <Button 
            onClick={handleSave}
            className="w-full py-6 text-base font-medium"
          >
            {entryId ? "Update" : "Save"}
          </Button>
        )}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default MoodDetail;
