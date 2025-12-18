import { Plus, Minus, Info } from "lucide-react";

interface Factor {
  id: string;
  emoji: string;
  name: string;
  count: number;
  isCustom?: boolean;
}

interface FactorsListProps {
  factors: Factor[];
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onAdd: () => void;
  onInfo?: () => void;
}

const FactorsList = ({ factors, onIncrement, onDecrement, onAdd, onInfo }: FactorsListProps) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-foreground font-bold text-xl">Tracking</h2>
        {onInfo && (
          <button onClick={onInfo} className="text-muted-foreground hover:text-foreground transition-colors">
            <Info className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="space-y-1">
        {factors.map((factor) => (
          <div
            key={factor.id}
            className="w-full flex items-center justify-between py-4 px-2 border-b border-border/20 rounded-lg"
          >
            <button
              onClick={() => onIncrement(factor.id)}
              className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
            >
              <span className="text-xl">{factor.emoji}</span>
              <span className="text-foreground text-base font-medium">{factor.name}</span>
            </button>
            <div className="flex items-center gap-2">
              {factor.count > 0 && (
                <button
                  onClick={() => onDecrement(factor.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
              )}
              <span className={`text-xl font-bold min-w-[24px] text-center transition-colors ${
                factor.count > 0 ? "text-accent" : "text-muted-foreground"
              }`}>
                {factor.count}
              </span>
              <button
                onClick={() => onIncrement(factor.id)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-accent/20 text-accent hover:bg-accent/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        <button
          onClick={onAdd}
          className="w-full flex items-center gap-3 py-4 px-2 text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Add factor</span>
        </button>
      </div>
    </section>
  );
};

export default FactorsList;
