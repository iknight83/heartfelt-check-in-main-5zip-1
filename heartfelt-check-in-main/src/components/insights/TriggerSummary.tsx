import { ArrowUp, ArrowDown, Minus, HelpCircle, AlertCircle, Users, Briefcase, MapPin, Globe, Tag, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TriggerImpact, TriggerType, ContextQuality, ConfidenceLevel, BaselineDrift } from "@/hooks/useTriggerInsights";

interface TriggerSummaryProps {
  triggerImpacts: TriggerImpact[];
  topPositive: TriggerImpact[];
  topNegative: TriggerImpact[];
  hasEnoughData: boolean;
  progressMessage: string;
  contextQuality: ContextQuality;
  baselineDrift: BaselineDrift;
  daysTracked: number;
  phaseDescription: string;
}

const getTriggerTypeIcon = (type: TriggerType) => {
  switch (type) {
    case "people": return Users;
    case "activity": return Briefcase;
    case "place": return MapPin;
    case "external": return Globe;
    default: return Tag;
  }
};

const getImpactIcon = (impact: TriggerImpact["impact"]) => {
  switch (impact) {
    case "positive":
      return <ArrowUp className="w-3 h-3 text-emerald-400" />;
    case "negative":
      return <ArrowDown className="w-3 h-3 text-amber-400" />;
    case "mixed":
      return <HelpCircle className="w-3 h-3 text-purple-400" />;
    default:
      return <Minus className="w-3 h-3 text-muted-foreground" />;
  }
};

const getConfidenceBadge = (confidence: ConfidenceLevel) => {
  switch (confidence) {
    case "Strong":
      return { label: "Strong", class: "bg-emerald-500/15 text-emerald-400" };
    case "Moderate":
      return { label: "Moderate", class: "bg-accent/15 text-accent" };
    case "Emerging":
      return { label: "Emerging", class: "bg-amber-500/15 text-amber-400" };
    case "Exploratory":
      return { label: "Exploratory", class: "bg-purple-500/15 text-purple-400" };
    default:
      return { label: "Building", class: "bg-muted/30 text-muted-foreground" };
  }
};

const getCategoryLabel = (type: TriggerType) => {
  switch (type) {
    case "people": return "People";
    case "activity": return "Activity";
    case "place": return "Place";
    case "external": return "External";
    default: return "Custom";
  }
};

export const TriggerSummary = ({
  triggerImpacts,
  topPositive,
  topNegative,
  hasEnoughData,
  progressMessage,
  contextQuality,
  baselineDrift,
  daysTracked,
  phaseDescription,
}: TriggerSummaryProps) => {

  // Don't show before 3 days
  if (daysTracked < 3) {
    return (
      <Card className="bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-foreground font-bold">What Influenced Your Mood</h2>
          </div>
          
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <p className="text-foreground/70 text-xs mb-1">{phaseDescription}</p>
            <p className="text-muted-foreground/60 text-[10px]">
              Log moods with context to discover what influences how you feel.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/60 backdrop-blur-sm border-border/40 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-foreground font-bold">What Influenced Your Mood</h2>
        </div>

        {/* Baseline drift indicator */}
        {baselineDrift.isDetected && (
          <div className={`flex items-start gap-2 p-3 rounded-lg mb-4 ${
            baselineDrift.direction === "declining" 
              ? "bg-purple-500/10 border border-purple-500/20"
              : "bg-emerald-500/10 border border-emerald-500/20"
          }`}>
            {baselineDrift.direction === "declining" ? (
              <TrendingDown className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            ) : (
              <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-foreground/80 text-xs font-medium">
                {baselineDrift.direction === "declining" 
                  ? "Your emotional baseline may be shifting"
                  : "A positive shift in your baseline"}
              </p>
              <p className="text-muted-foreground/60 text-[10px] mt-0.5">
                {baselineDrift.explanation}
              </p>
            </div>
          </div>
        )}

        {/* Data quality indicator */}
        {contextQuality.moodsWithoutContext > 0 && contextQuality.moodsWithContext > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/10 border border-border/20 mb-4">
            <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-foreground/80 text-xs font-medium">
                {contextQuality.moodsWithoutContext} moods logged as internal states
              </p>
              <p className="text-muted-foreground/60 text-[10px] mt-0.5">
                These are included in your baseline but not pattern analysis.
              </p>
            </div>
          </div>
        )}

        {/* Progress message */}
        {!hasEnoughData && progressMessage && (
          <div className="p-3 rounded-lg bg-muted/10 border border-border/20 mb-4">
            <p className="text-foreground/70 text-xs mb-1">{phaseDescription}</p>
            <p className="text-muted-foreground/60 text-[10px]">{progressMessage}</p>
          </div>
        )}

        {/* Top triggers */}
        {triggerImpacts.length > 0 ? (
          <div className="space-y-4">
            {topPositive.length > 0 && (
              <div>
                <p className="text-xs text-emerald-400/80 font-medium mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  May align with better moods
                </p>
                <div className="space-y-2">
                  {topPositive.map((trigger) => (
                    <TriggerRow key={trigger.trigger} trigger={trigger} />
                  ))}
                </div>
              </div>
            )}

            {topNegative.length > 0 && (
              <div>
                <p className="text-xs text-amber-400/80 font-medium mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  May align with lower moods
                </p>
                <div className="space-y-2">
                  {topNegative.map((trigger) => (
                    <TriggerRow key={trigger.trigger} trigger={trigger} />
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-muted-foreground/50 text-[10px] pt-2 border-t border-border/20">
              Based on {contextQuality.moodsWithContext} moods with context.
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No clear patterns yet. Insights may emerge as you continue.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

const TriggerRow = ({ trigger }: { trigger: TriggerImpact }) => {
  const badge = getConfidenceBadge(trigger.confidence);
  const TypeIcon = getTriggerTypeIcon(trigger.category);
  
  return (
    <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-card/40">
      <div className="flex items-center gap-2 min-w-0">
        <TypeIcon className="w-3.5 h-3.5 text-muted-foreground/60 flex-shrink-0" />
        <div className="min-w-0">
          <span className="text-foreground text-xs font-medium truncate block">
            {trigger.trigger}
          </span>
          <span className="text-muted-foreground/50 text-[10px]">
            {getCategoryLabel(trigger.category)} • {trigger.uniqueDays} days
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {getImpactIcon(trigger.impact)}
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${badge.class}`}>
          {badge.label}
        </span>
      </div>
    </div>
  );
};
