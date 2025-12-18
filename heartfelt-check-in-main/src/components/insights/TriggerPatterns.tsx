import { Activity, Users, Zap, Briefcase, MapPin, Globe, Layers, Heart, Plus, Calendar, Clock, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TriggerPattern, TriggerType, ConfidenceLevel, UnattributedPattern } from "@/hooks/useTriggerInsights";
import { useNavigate } from "react-router-dom";

interface TriggerPatternsProps {
  patterns: TriggerPattern[];
  hasEnoughTriggerData: boolean;
  hasEnoughMoodData: boolean;
  daysWithTriggerData: number;
  unattributedPatterns: UnattributedPattern[];
  daysTracked: number;
  phaseDescription: string;
}

const getPatternIcon = (types: TriggerType[], impact: "positive" | "negative" | "internal") => {
  if (impact === "internal") return Heart;
  if (types.includes("people")) return Users;
  if (types.includes("activity")) return impact === "positive" ? Activity : Briefcase;
  if (types.includes("place")) return MapPin;
  if (types.includes("external")) return Globe;
  return impact === "positive" ? Zap : Layers;
};

const getPatternColor = (impact: "positive" | "negative" | "internal", confidence: ConfidenceLevel) => {
  const saturationMultiplier = confidence === "Strong" ? 1 : confidence === "Moderate" ? 0.8 : 0.6;
  
  if (impact === "internal") return `hsla(280, ${70 * saturationMultiplier}%, 50%, 1)`;
  if (impact === "positive") return `hsla(145, ${80 * saturationMultiplier}%, 50%, 1)`;
  return `hsla(38, ${92 * saturationMultiplier}%, 50%, 1)`;
};

const getConfidenceBadgeClass = (confidence: ConfidenceLevel) => {
  switch (confidence) {
    case "Strong": return "bg-emerald-500/15 text-emerald-400";
    case "Moderate": return "bg-accent/15 text-accent";
    case "Emerging": return "bg-amber-500/15 text-amber-400";
    case "Exploratory": return "bg-purple-500/15 text-purple-400";
    default: return "bg-muted/30 text-muted-foreground";
  }
};

const getUnattributedIcon = (type: UnattributedPattern["type"]) => {
  switch (type) {
    case "day_of_week": return Calendar;
    case "time_of_day": return Clock;
    case "baseline_drift": return TrendingDown;
    default: return Heart;
  }
};

export const TriggerPatterns = ({
  patterns,
  hasEnoughTriggerData,
  hasEnoughMoodData,
  daysWithTriggerData,
  unattributedPatterns,
  daysTracked,
  phaseDescription,
}: TriggerPatternsProps) => {
  const navigate = useNavigate();

  // Phase indicator component
  const PhaseIndicator = () => (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-muted-foreground/60 text-[10px]">
        Day {daysTracked} • {phaseDescription}
      </span>
    </div>
  );

  // Not enough data
  if (daysTracked < 2) {
    return (
      <div className="space-y-3">
        <h2 className="text-foreground font-bold px-1">Patterns You Might Miss</h2>
        
        <Card className="bg-card/40 backdrop-blur-sm border-border/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0">
                <Layers className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-foreground/70 text-xs font-medium mb-1">Getting started</p>
                <p className="text-muted-foreground/60 text-[10px] leading-relaxed">
                  Log your first mood to begin discovering what influences how you feel.
                </p>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 h-7 text-[10px] px-3 bg-accent/10 text-accent hover:bg-accent/20"
                  onClick={() => navigate("/")}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Log your first mood
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main view
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-foreground font-bold">Patterns You Might Miss</h2>
      </div>
      
      <PhaseIndicator />
      
      {patterns.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {patterns.slice(0, 4).map((pattern, index) => {
            const Icon = getPatternIcon(pattern.triggerTypes, pattern.impact);
            const color = getPatternColor(pattern.impact, pattern.confidence);
            const badgeClass = getConfidenceBadgeClass(pattern.confidence);
            
            return (
              <Card 
                key={index}
                className="bg-card/40 backdrop-blur-sm border-border/30 overflow-hidden hover:bg-card/60 transition-all duration-300 cursor-pointer group"
              >
                <CardContent className="p-4">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <p className="text-foreground text-xs font-medium mb-1 leading-tight">
                    {pattern.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${badgeClass}`}>
                      {pattern.confidence}
                    </span>
                    <span className="text-muted-foreground/50 text-[9px]">
                      {pattern.occurrences}×
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-card/40 backdrop-blur-sm border-border/30">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs">
              Patterns may emerge as you continue logging. There's no rush.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Internal patterns */}
      {unattributedPatterns.length > 0 && (
        <UnattributedSection patterns={unattributedPatterns} />
      )}
      
      <p className="text-muted-foreground/40 text-[9px] px-1 italic">
        Patterns reflect correlations, not causes. Confidence grows naturally with more data.
      </p>
    </div>
  );
};

const UnattributedSection = ({ patterns }: { patterns: UnattributedPattern[] }) => (
  <div className="space-y-2 pt-2">
    <p className="text-xs text-purple-400/80 font-medium px-1 flex items-center gap-1.5">
      <Heart className="w-3 h-3" />
      Internal emotional states
    </p>
    {patterns.map((pattern, index) => {
      const Icon = getUnattributedIcon(pattern.type);
      return (
        <Card key={index} className="bg-purple-500/5 backdrop-blur-sm border-purple-500/20">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Icon className="w-3.5 h-3.5 text-purple-400/70 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-foreground/70 text-xs font-medium mb-1">{pattern.description}</p>
                <p className="text-muted-foreground/60 text-[10px] leading-relaxed">
                  {pattern.explanation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
);
