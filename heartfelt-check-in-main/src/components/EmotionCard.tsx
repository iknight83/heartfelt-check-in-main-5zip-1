import { cn } from "@/lib/utils";

interface EmotionCardProps {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  delay?: number;
}

const EmotionCard = ({ emoji, label, selected, onClick, delay = 0 }: EmotionCardProps) => {
  return (
    <button
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        "opacity-0 animate-fade-in",
        "group relative flex flex-col items-center justify-center gap-2 p-5 rounded-2xl",
        "bg-card border border-border/50 transition-all duration-300 ease-out",
        "hover:bg-card-hover hover:border-border hover:scale-[1.02]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "cursor-pointer select-none",
        selected && "bg-card-selected border-accent/40 glow-selected scale-[1.02]"
      )}
    >
      <span className={cn(
        "text-3xl sm:text-4xl transition-transform duration-300",
        selected && "scale-110",
        "group-hover:scale-110"
      )}>
        {emoji}
      </span>
      <span className={cn(
        "text-sm sm:text-base font-medium transition-colors duration-300",
        selected ? "text-foreground" : "text-soft",
        "group-hover:text-foreground"
      )}>
        {label}
      </span>
      
      {/* Selection indicator */}
      <div className={cn(
        "absolute top-2 right-2 w-2 h-2 rounded-full transition-all duration-300",
        selected ? "bg-accent scale-100 opacity-100" : "bg-transparent scale-0 opacity-0"
      )} />
    </button>
  );
};

export default EmotionCard;
