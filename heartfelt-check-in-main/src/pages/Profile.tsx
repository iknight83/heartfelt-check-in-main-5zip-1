import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, User, Crown, Clock, Settings, Bell, Shield, Sparkles, Database, BarChart3, ChevronRight, HelpCircle, FileText, Scale, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfileSummary } from "@/hooks/useProfileSummary";
import { useMoodData } from "@/hooks/useMoodData";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import BottomNav from "@/components/home/BottomNav";

type PlanType = "lifetime" | "annual" | "monthly";

interface Plan {
  id: PlanType;
  name: string;
  price: string;
  period: string;
  subtext: string;
  badge?: string;
  isRecommended?: boolean;
}

const plans: Plan[] = [
  {
    id: "lifetime",
    name: "Lifetime Access",
    price: "R999",
    period: "once-off",
    subtext: "For long-term self-understanding.",
    badge: "Best value",
    isRecommended: true,
  },
  {
    id: "annual",
    name: "Annual Access",
    price: "R349",
    period: "/ year",
    subtext: "Just R29 per month",
  },
  {
    id: "monthly",
    name: "Monthly Access",
    price: "R49",
    period: "/ month",
    subtext: "Cancel anytime",
  },
];

const features = [
  "See emotional patterns you can't notice day-to-day",
  "Understand what situations may affect your mood",
  "Track how your emotional baseline changes over time",
  "Get gentle guidance on what to pay attention to",
];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Get color based on mood average (1-5 scale)
const getMoodColor = (average: number, hasData: boolean): string => {
  if (!hasData) return "bg-muted/30";
  if (average >= 4.2) return "bg-emerald-400/80";
  if (average >= 3.5) return "bg-teal-400/70";
  if (average >= 2.8) return "bg-sky-400/60";
  if (average >= 2.2) return "bg-slate-400/50";
  return "bg-slate-500/40";
};

const Profile = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("lifetime");
  const { isSubscribed, isTrialActive, trialDaysUsed, subscribe } = useSubscription();
  const profileSummary = useProfileSummary();
  const { moodEntries } = useMoodData();
  const { signOut, user } = useAuth();

  const handleSubscribe = () => {
    subscribe();
    navigate("/insights");
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Something went wrong. Please try again.");
    } else {
      navigate("/", { replace: true });
    }
  };

  const phaseLabels = {
    exploring: { label: "Exploring", description: "Building your emotional foundation" },
    refining: { label: "Refining", description: "Patterns are beginning to emerge" },
    strengthening: { label: "Strengthening", description: "Your insights are becoming clearer" },
  };

  const currentPhase = phaseLabels[profileSummary.progressPhase];

  // Derive "How You Use the App" stats
  const appUsageStats = useMemo(() => {
    if (moodEntries.length < 3) return null;

    // Most common check-in time
    const timeDistribution: Record<string, number> = {};
    moodEntries.forEach(entry => {
      const hour = entry.timestamp.getHours();
      let period = "morning";
      if (hour >= 12 && hour < 17) period = "afternoon";
      else if (hour >= 17 && hour < 21) period = "evening";
      else if (hour >= 21 || hour < 5) period = "night";
      timeDistribution[period] = (timeDistribution[period] || 0) + 1;
    });
    
    const sortedTimes = Object.entries(timeDistribution).sort((a, b) => b[1] - a[1]);
    const preferredTime = sortedTimes[0]?.[0] || "evening";

    // Most common mood
    const moodCounts: Record<string, number> = {};
    moodEntries.forEach(entry => {
      moodCounts[entry.label] = (moodCounts[entry.label] || 0) + 1;
    });
    const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
    const mostCommonMood = sortedMoods[0]?.[0] || "Neutral";

    // Emotional range (variance indicator)
    const moodLevels = moodEntries.map(e => e.level);
    const avgMood = moodLevels.reduce((a, b) => a + b, 0) / moodLevels.length;
    const variance = moodLevels.reduce((sum, level) => sum + Math.pow(level - avgMood, 2), 0) / moodLevels.length;
    const emotionalRange = variance > 300 ? "Variable" : variance > 150 ? "Moderate" : "Stable";

    return {
      preferredTime,
      mostCommonMood,
      emotionalRange,
    };
  }, [moodEntries]);

  return (
    <div className="min-h-screen gradient-bg pb-24">
      {/* Header */}
      <header className="px-5 py-4 flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">You</h1>
      </header>

      <div className="px-5 space-y-6">
        {/* User Section */}
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
                <User className="w-7 h-7 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-foreground font-medium">Your Account</p>
                {isSubscribed ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-400 text-sm">Pro Member</span>
                  </div>
                ) : isTrialActive ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    <span className="text-accent text-sm">{trialDaysUsed}/7 days checked in</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Free tier</span>
                )}
                <p className="text-muted-foreground text-xs mt-2">
                  Your data is stored locally on this device.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emotional Style */}
        {profileSummary.uniqueDaysLogged >= 3 && (
          <Card className="bg-card/50 border-border/30">
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Your Emotional Style</p>
              <p className="text-foreground font-semibold text-lg">
                {appUsageStats?.emotionalRange === "Stable" ? "Balanced Observer" : 
                 appUsageStats?.emotionalRange === "Variable" ? "Emotional Explorer" : "Adaptive Responder"}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {appUsageStats?.emotionalRange === "Stable" 
                  ? "You navigate emotions with awareness and adaptability." 
                  : appUsageStats?.emotionalRange === "Variable"
                  ? "You experience a wide range of emotions with openness."
                  : "You respond to life with flexibility and awareness."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Your Journey Summary */}
        <div className="space-y-3">
          <h2 className="text-foreground font-semibold text-lg">Your Journey</h2>
          <Card className="bg-card/50 border-border/30">
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-foreground">{profileSummary.uniqueDaysLogged}</p>
                  <p className="text-muted-foreground text-sm">Days logged</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-semibold text-foreground">{profileSummary.currentStreak}</p>
                  <p className="text-muted-foreground text-sm">Day streak</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm border-t border-border/30 pt-3">
                You've taken time to reflect on your emotions.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Insight Progress Indicator */}
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-foreground font-medium text-sm">{currentPhase.label}</span>
            </div>
            <div className="flex gap-1.5 mb-2">
              <div className={`h-1.5 flex-1 rounded-full ${profileSummary.progressPhase === "exploring" || profileSummary.progressPhase === "refining" || profileSummary.progressPhase === "strengthening" ? "bg-primary" : "bg-border/30"}`} />
              <div className={`h-1.5 flex-1 rounded-full ${profileSummary.progressPhase === "refining" || profileSummary.progressPhase === "strengthening" ? "bg-primary" : "bg-border/30"}`} />
              <div className={`h-1.5 flex-1 rounded-full ${profileSummary.progressPhase === "strengthening" ? "bg-primary" : "bg-border/30"}`} />
            </div>
            <p className="text-muted-foreground text-xs">{currentPhase.description}</p>
          </CardContent>
        </Card>

        {/* Your Emotional Year */}
        <div className="space-y-3">
          <div>
            <h2 className="text-foreground font-semibold text-lg">Your Emotional Year</h2>
            <p className="text-muted-foreground text-sm">A high-level view of how your emotions have shifted.</p>
          </div>
          <Card className="bg-card/50 border-border/30">
            <CardContent className="p-4">
              {/* Show placeholder if less than 2 months of data */}
              {profileSummary.monthlyAverages.filter(m => m.hasData).length < 2 ? (
                <div className="h-24 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm text-center">
                    Your emotional year will take shape over time.
                  </p>
                </div>
              ) : (
                <div className="flex items-end gap-1 h-24">
                  {profileSummary.monthlyAverages.map((month, index) => {
                    // Show muted placeholder for months with < 3 entries
                    const height = month.hasData 
                      ? `${Math.max(20, (month.average / 5) * 100)}%`
                      : "15%";
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className={`w-full rounded-t-sm transition-all ${getMoodColor(month.average, month.hasData)}`}
                          style={{ height }}
                        />
                        <span className="text-[10px] text-muted-foreground">{MONTH_LABELS[index]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* What You're Learning */}
        <div className="space-y-3">
          <h2 className="text-foreground font-semibold text-lg">What You're Learning</h2>
          <Card className="bg-card/50 border-border/30">
            <CardContent className="p-4 space-y-3">
              {profileSummary.reflections.length > 0 ? (
                profileSummary.reflections.map((reflection, index) => (
                  <p key={index} className="text-foreground/80 text-sm">
                    {reflection}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  Your patterns are beginning to emerge. Keep logging to see what you discover.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* How You Use the App */}
        {appUsageStats && (
          <div className="space-y-3">
            <h2 className="text-foreground font-semibold text-lg">How You Use the App</h2>
            <Card className="bg-card/50 border-border/30">
              <CardContent className="p-4 space-y-3">
                <p className="text-foreground/80 text-sm">
                  You check in mostly in the <span className="text-foreground font-medium">{appUsageStats.preferredTime}s</span>.
                </p>
                <p className="text-foreground/80 text-sm">
                  Your most common mood is <span className="text-foreground font-medium">{appUsageStats.mostCommonMood}</span>.
                </p>
                <p className="text-foreground/80 text-sm">
                  Your emotional range appears <span className="text-foreground font-medium">{appUsageStats.emotionalRange.toLowerCase()}</span>.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Retention Reassurance */}
        <p className="text-muted-foreground text-sm text-center py-2">
          Patterns become clearer with time. There's no rush.
        </p>

        {/* Settings */}
        <div className="space-y-3">
          <h2 className="text-foreground font-semibold text-lg">Settings</h2>
          <Card className="bg-card/50 border-border/30">
            <CardContent className="p-0">
              <button 
                onClick={() => navigate("/settings/account")}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-border/20"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground text-sm">Account & Data</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button 
                onClick={() => navigate("/settings/tracked-factors")}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-border/20"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground text-sm">Tracking Preferences</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button 
                onClick={() => navigate("/settings/insights")}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-border/20"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground text-sm">Insights & Analysis</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button 
                onClick={() => navigate("/settings/notifications")}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-border/20"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground text-sm">Notifications</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button 
                onClick={() => navigate("/settings/privacy")}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-border/20"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground text-sm">Privacy</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button 
                onClick={() => navigate("/help-feedback")}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-border/20"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground text-sm">Help & Feedback</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button 
                onClick={() => navigate("/privacy-policy")}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors border-b border-border/20"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground text-sm">Privacy Policy</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button 
                onClick={() => navigate("/terms-of-use")}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Scale className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground text-sm">Terms of Use</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Section - Always Last */}
        {!isSubscribed && (
          <div className="space-y-4 pt-4 border-t border-border/20">
            <div className="space-y-2">
              <h2 className="text-foreground font-semibold text-lg">Continue with Pro</h2>
              <p className="text-muted-foreground text-sm">
                Access deeper insights as your patterns grow over time.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-2.5">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground/80 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Pricing Cards */}
            <div className="space-y-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 text-left relative ${
                    selectedPlan === plan.id
                      ? "border-primary bg-primary/10"
                      : "border-border/30 bg-card/50 hover:border-border/50"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {plan.badge}
                    </span>
                  )}
                  
                  <div className="flex items-center justify-between pl-8">
                    <div>
                      <span className="text-foreground font-medium">{plan.name}</span>
                      <p className="text-muted-foreground text-sm mt-0.5">{plan.subtext}</p>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-foreground font-semibold text-lg">{plan.price}</span>
                        {plan.period !== "once-off" && (
                          <span className="text-muted-foreground text-sm">{plan.period}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selection indicator */}
                  <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedPlan === plan.id
                      ? "border-primary bg-primary"
                      : "border-border/50"
                  }`}>
                    {selectedPlan === plan.id && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Subscribe Button */}
            <Button
              onClick={handleSubscribe}
              className="w-full py-6 text-base font-medium rounded-xl"
            >
              Subscribe Now
            </Button>
            
            <p className="text-center text-muted-foreground text-sm">
              One-click cancellation. No hidden fees.
            </p>
          </div>
        )}

        {/* Already Subscribed */}
        {isSubscribed && (
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <CardContent className="p-5 text-center">
              <Crown className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <h3 className="text-foreground font-semibold text-lg mb-1">You're a Pro Member</h3>
              <p className="text-muted-foreground text-sm">
                You have full access to all Deeper Insights features.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Sign out</span>
        </button>
      </div>

      <BottomNav activeTab="you" onTabChange={() => {}} />
    </div>
  );
};

export default Profile;
