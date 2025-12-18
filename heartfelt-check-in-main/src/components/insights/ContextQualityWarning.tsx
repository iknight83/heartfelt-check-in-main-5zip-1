import { AlertCircle, Plus, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ContextQuality } from "@/hooks/useTriggerInsights";
import { useNavigate } from "react-router-dom";

interface ContextQualityWarningProps {
  contextQuality: ContextQuality;
  daysTracked: number;
  daysWithTriggerData: number;
}

export const ContextQualityWarning = ({
  contextQuality,
  daysTracked,
  daysWithTriggerData,
}: ContextQualityWarningProps) => {
  const navigate = useNavigate();
  
  // Don't show if good coverage and enough days
  if (contextQuality.hasGoodCoverage && daysTracked >= 7) {
    return null;
  }
  
  const hasAnyMoods = contextQuality.totalMoods > 0;
  const hasSomeTriggers = contextQuality.moodsWithContext > 0;
  
  // Determine warning severity
  const isHighPriority = !hasSomeTriggers && hasAnyMoods;
  const isMediumPriority = hasSomeTriggers && !contextQuality.hasGoodCoverage;
  
  return (
    <Card className={`backdrop-blur-sm border-border/40 overflow-hidden ${
      isHighPriority 
        ? "bg-amber-500/10 border-amber-500/30" 
        : "bg-card/60"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isHighPriority 
              ? "bg-amber-500/20" 
              : "bg-accent/10"
          }`}>
            {isHighPriority ? (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            ) : isMediumPriority ? (
              <TrendingUp className="w-4 h-4 text-accent" />
            ) : (
              <Plus className="w-4 h-4 text-accent" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {!hasAnyMoods ? (
              <>
                <p className="text-foreground/80 text-xs font-medium mb-1">
                  Start Your Journey
                </p>
                <p className="text-muted-foreground/70 text-[11px] leading-relaxed">
                  Log your first mood with context to begin understanding what influences how you feel.
                </p>
              </>
            ) : isHighPriority ? (
              <>
                <p className="text-foreground/80 text-xs font-medium mb-1">
                  {contextQuality.moodsWithoutContext} moods logged without context
                </p>
                <p className="text-muted-foreground/70 text-[11px] leading-relaxed">
                  Patterns become clearer when we know what influenced your mood. 
                  Adding triggers helps us understand what matters to you.
                </p>
              </>
            ) : isMediumPriority ? (
              <>
                <p className="text-foreground/80 text-xs font-medium mb-1">
                  {contextQuality.contextPercentage}% of moods have context
                </p>
                <p className="text-muted-foreground/70 text-[11px] leading-relaxed mb-2">
                  {contextQuality.moodsWithoutContext} entries are missing triggers. 
                  Add context to more entries for reliable correlations.
                </p>
                
                {/* Progress bar */}
                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent transition-all duration-500"
                    style={{ width: `${contextQuality.contextPercentage}%` }}
                  />
                </div>
                <p className="text-muted-foreground/50 text-[10px] mt-1">
                  Goal: 70%+ for reliable patterns
                </p>
              </>
            ) : (
              <>
                <p className="text-foreground/80 text-xs font-medium mb-1">
                  {daysWithTriggerData < 7 
                    ? `${7 - daysWithTriggerData} more days needed`
                    : daysWithTriggerData < 14
                    ? `${14 - daysWithTriggerData} more days for correlations`
                    : "Building pattern confidence"}
                </p>
                <p className="text-muted-foreground/70 text-[11px] leading-relaxed">
                  Keep logging with context — patterns become clearer over time.
                </p>
              </>
            )}
            
            {/* CTA button */}
            {(isHighPriority || !hasAnyMoods) && (
              <button
                onClick={() => navigate("/mood-detail")}
                className="mt-3 px-3 py-1.5 rounded-lg bg-accent/20 border border-accent/30 text-accent text-[11px] font-medium hover:bg-accent/30 transition-all duration-200"
              >
                Log mood with context
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
