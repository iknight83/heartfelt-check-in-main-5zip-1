import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const MOOD_LEVELS = [
  { 
    level: 0, 
    label: "Awful", 
    color: "hsl(0, 70%, 55%)", 
    bgColor: "hsl(0, 70%, 45%)",
    emotions: ["Frustrated", "Overwhelmed", "Drained", "Hopeless", "Angry", "Broken", "Devastated", "Miserable"] 
  },
  { 
    level: 1, 
    label: "Low", 
    color: "hsl(330, 60%, 55%)", 
    bgColor: "hsl(330, 60%, 45%)",
    emotions: ["Irritated", "Worried", "Embarrassed", "Down", "Anxious", "Sad", "Lonely", "Stressed"] 
  },
  { 
    level: 2, 
    label: "Meh", 
    color: "hsl(270, 55%, 55%)", 
    bgColor: "hsl(270, 55%, 45%)",
    emotions: ["Uninspired", "Restless", "Indifferent", "Tired", "Bored", "Distracted", "Unfocused", "Flat"] 
  },
  { 
    level: 3, 
    label: "Okay", 
    color: "hsl(210, 70%, 55%)", 
    bgColor: "hsl(210, 70%, 45%)",
    emotions: ["Steady", "Balanced", "Peaceful", "Easygoing", "Calm", "Neutral", "Stable", "Fine"] 
  },
  { 
    level: 4, 
    label: "Nice", 
    color: "hsl(190, 80%, 50%)", 
    bgColor: "hsl(190, 80%, 40%)",
    emotions: ["Relaxed", "Comfortable", "Hopeful", "Lively", "Content", "Pleasant", "Optimistic", "Cheerful"] 
  },
  { 
    level: 5, 
    label: "Great", 
    color: "hsl(140, 60%, 50%)", 
    bgColor: "hsl(140, 60%, 40%)",
    emotions: ["Joyful", "Satisfied", "Motivated", "Grateful", "Energetic", "Confident", "Fulfilled", "Happy"] 
  },
  { 
    level: 6, 
    label: "Amazing", 
    color: "hsl(45, 90%, 50%)", 
    bgColor: "hsl(45, 90%, 40%)",
    emotions: ["Thrilled", "Radiant", "Inspired", "Alive", "Ecstatic", "Blissful", "Euphoric", "Empowered"] 
  },
];

const MoodAdjust = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const initialMood = searchParams.get("mood") || "Uninspired";
  const time = searchParams.get("time") || "";
  const triggers = searchParams.get("triggers") || "";
  const isNew = searchParams.get("new") || "";
  const dateParam = searchParams.get("date") || "";
  const entryId = searchParams.get("id") || "";
  
  // Find initial level based on mood
  const findInitialLevel = () => {
    for (const moodLevel of MOOD_LEVELS) {
      if (moodLevel.emotions.includes(initialMood) || moodLevel.label === initialMood) {
        return moodLevel.level;
      }
    }
    return 2; // Default to "Meh"
  };
  
  const [currentLevel, setCurrentLevel] = useState(findInitialLevel());
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(initialMood);
  
  const currentMood = MOOD_LEVELS[currentLevel];
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLevel = parseInt(e.target.value);
    setCurrentLevel(newLevel);
    setSelectedEmotion(null); // Reset emotion when level changes
  };
  
  const handleSave = () => {
    const moodToSave = selectedEmotion || currentMood.label;
    const params = new URLSearchParams({
      mood: moodToSave,
      time,
      triggers,
      new: isNew,
    });
    if (dateParam) params.set("date", dateParam);
    if (entryId) params.set("id", entryId);
    navigate(`/mood?${params.toString()}`);
  };
  
  const handleCancel = () => {
    navigate(-1);
  };
  
  // Generate organic blob path
  const blobPath = useMemo(() => {
    const points = 8;
    const angleStep = (Math.PI * 2) / points;
    const radius = 45;
    const variation = 8 + currentLevel * 2;
    
    let path = "";
    const controlPoints: { x: number; y: number }[] = [];
    
    for (let i = 0; i < points; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const r = radius + Math.sin(i * 2.5 + currentLevel) * variation;
      controlPoints.push({
        x: 50 + Math.cos(angle) * r,
        y: 50 + Math.sin(angle) * r,
      });
    }
    
    path = `M ${controlPoints[0].x} ${controlPoints[0].y}`;
    for (let i = 0; i < points; i++) {
      const curr = controlPoints[i];
      const next = controlPoints[(i + 1) % points];
      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;
      path += ` Q ${curr.x} ${curr.y} ${midX} ${midY}`;
    }
    path += " Z";
    
    return path;
  }, [currentLevel]);

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <button
          onClick={handleCancel}
          className="text-muted-foreground hover:text-foreground transition-colors text-base"
        >
          Cancel
        </button>
        <div className="w-10 h-1 bg-muted/30 rounded-full" />
        <div className="w-14" />
      </div>
      
      {/* Mood Orb */}
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        <div className="relative w-48 h-48 mb-8">
          {/* Outer glow layers */}
          {[...Array(4)].map((_, i) => (
            <svg
              key={i}
              className="absolute inset-0 w-full h-full transition-all duration-500"
              viewBox="0 0 100 100"
              style={{ 
                opacity: 0.15 - i * 0.03,
                transform: `scale(${1.15 + i * 0.15})`,
              }}
            >
              <path
                d={blobPath}
                fill={currentMood.color}
                className="transition-all duration-500"
              />
            </svg>
          ))}
          
          {/* Main orb */}
          <svg
            className="absolute inset-0 w-full h-full transition-all duration-500"
            viewBox="0 0 100 100"
          >
            <defs>
              <radialGradient id="orbGradient" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor={currentMood.color} />
                <stop offset="100%" stopColor={currentMood.bgColor} />
              </radialGradient>
            </defs>
            <path
              d={blobPath}
              fill="url(#orbGradient)"
              className="transition-all duration-500"
            />
          </svg>
          
          {/* Center dot */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/90 shadow-lg"
          />
        </div>
        
        {/* Feeling Text */}
        <p className="text-foreground/70 text-lg mb-2">Right now I'm</p>
        <h1 
          className="text-4xl font-bold mb-10 transition-colors duration-300"
          style={{ color: currentMood.color }}
        >
          {selectedEmotion || currentMood.label}
        </h1>
        
        {/* Custom Slider */}
        <div className="w-full max-w-sm mb-10">
          <div 
            className="relative h-14 rounded-full overflow-hidden transition-colors duration-300"
            style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}
          >
            {/* Filled track */}
            <div 
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
              style={{ 
                width: `${(currentLevel / 6) * 100}%`,
                backgroundColor: currentMood.color,
              }}
            />
            
            {/* Step indicators */}
            <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
              {MOOD_LEVELS.map((_, i) => (
                <div 
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
                  style={{ 
                    backgroundColor: i <= currentLevel ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'
                  }}
                />
              ))}
            </div>
            
            {/* Thumb */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg transition-all duration-300 pointer-events-none"
              style={{ left: `calc(${(currentLevel / 6) * 100}% - ${currentLevel === 0 ? '8px' : currentLevel === 6 ? '40px' : '24px'})` }}
            />
            
            {/* Hidden range input */}
            <input
              type="range"
              min="0"
              max="6"
              value={currentLevel}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
        
        {/* Emotion Pills */}
        <div className="flex flex-wrap gap-2 justify-center max-w-sm">
          {currentMood.emotions.map((emotion) => (
            <button
              key={emotion}
              onClick={() => setSelectedEmotion(emotion)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedEmotion === emotion
                  ? 'bg-accent/30 text-accent border border-accent/50'
                  : 'bg-card/40 text-foreground/80 border border-border/30 hover:bg-card/60'
              }`}
            >
              {emotion}
            </button>
          ))}
        </div>
      </div>
      
      {/* Save Button */}
      <div className="px-5 pb-8 pt-4">
        <button
          onClick={handleSave}
          className="w-full py-4 bg-white text-background font-semibold rounded-2xl hover:bg-white/90 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default MoodAdjust;
