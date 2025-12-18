import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

interface SupportCheckScreenProps {
  onSelect: (hasSupport: boolean) => void;
  onBack: () => void;
}

const SupportCheckScreen = ({ onSelect, onBack }: SupportCheckScreenProps) => {
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
        {/* Header */}
        <div className="text-center mb-12 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 leading-tight">
            Do you have someone you can talk to about this?
          </h1>
          <p className="text-soft text-base sm:text-lg leading-relaxed">
            It could be a friend, family member, or anyone you trust.
          </p>
        </div>

        {/* Choice buttons */}
        <div 
          className="flex flex-col gap-4 opacity-0 animate-fade-in"
          style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
        >
          <button
            onClick={() => onSelect(true)}
            className={cn(
              "w-full py-5 px-6 text-base sm:text-lg font-medium rounded-xl transition-all duration-300",
              "bg-card border border-border/50 text-foreground",
              "hover:border-primary/40 hover:bg-secondary/30 hover:scale-[1.01]",
              "active:scale-[0.99]"
            )}
          >
            Yes, I do
          </button>
          
          <button
            onClick={() => onSelect(false)}
            className={cn(
              "w-full py-5 px-6 text-base sm:text-lg font-medium rounded-xl transition-all duration-300",
              "bg-card border border-border/50 text-foreground",
              "hover:border-primary/40 hover:bg-secondary/30 hover:scale-[1.01]",
              "active:scale-[0.99]"
            )}
          >
            Not really
          </button>
        </div>
      </main>
    </div>
  );
};

export default SupportCheckScreen;
