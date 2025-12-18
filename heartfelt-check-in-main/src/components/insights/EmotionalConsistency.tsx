import { Card, CardContent } from "@/components/ui/card";

interface EmotionalConsistencyProps {
  stability: { score: number; description: string };
}

export const EmotionalConsistency = ({ stability }: EmotionalConsistencyProps) => {
  const score = Math.round(stability.score);
  
  // Generate waveform bars for visual effect
  const waveformBars = Array.from({ length: 24 }, (_, i) => {
    const variance = Math.sin(i * 0.5) * 20 + Math.random() * 15;
    const height = Math.max(20, Math.min(100, score + variance - 30));
    const isHighlighted = i < (score / 100) * 24;
    return { height, isHighlighted };
  });

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-foreground font-bold">Emotional Consistency</h2>
          <div className="flex items-center gap-1.5">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{
                background: score > 60 
                  ? 'linear-gradient(135deg, hsl(var(--accent) / 0.2), hsl(var(--accent) / 0.1))'
                  : 'linear-gradient(135deg, hsl(45 90% 50% / 0.2), hsl(45 90% 50% / 0.1))',
                color: score > 60 ? 'hsl(var(--accent))' : 'hsl(45 90% 50%)'
              }}
            >
              {score}
            </div>
          </div>
        </div>

        {/* Waveform visualization */}
        <div className="flex items-end justify-between gap-0.5 h-12 mb-4">
          {waveformBars.map((bar, idx) => (
            <div
              key={idx}
              className="flex-1 rounded-sm transition-all duration-500"
              style={{
                height: `${bar.height}%`,
                backgroundColor: bar.isHighlighted 
                  ? 'hsl(var(--accent))' 
                  : 'hsl(var(--border) / 0.4)',
                opacity: bar.isHighlighted ? 0.7 + (idx / 48) : 0.3
              }}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="relative h-2 rounded-full bg-border/30 overflow-hidden mb-3">
          <div 
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ 
              width: `${score}%`,
              background: 'linear-gradient(90deg, hsl(var(--accent) / 0.6), hsl(var(--accent)))'
            }}
          />
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed mb-2">
          {stability.description}
        </p>
        <p className="text-muted-foreground/60 text-xs">
          Higher consistency means fewer sudden mood shifts throughout the month.
        </p>
      </CardContent>
    </Card>
  );
};
