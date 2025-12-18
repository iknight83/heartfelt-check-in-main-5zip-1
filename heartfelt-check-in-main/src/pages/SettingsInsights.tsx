import { ArrowLeft, Eye, Sparkles, MessageSquare, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

interface InsightSettings {
  showEarlyInsights: boolean;
  showConfidenceLabels: boolean;
  allowSpeculativeLanguage: boolean;
  showFewerInsights: boolean;
}

const DEFAULT_SETTINGS: InsightSettings = {
  showEarlyInsights: true,
  showConfidenceLabels: true,
  allowSpeculativeLanguage: true,
  showFewerInsights: false,
};

const SettingsInsights = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<InsightSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const stored = localStorage.getItem("insightSettings");
    if (stored) {
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
    }
  }, []);

  const updateSetting = (key: keyof InsightSettings, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem("insightSettings", JSON.stringify(updated));
    toast({ title: "Setting updated" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border/50 z-10">
        <div className="flex items-center gap-3 p-4">
          <button 
            onClick={() => navigate("/you")}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Insights & Analysis</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Explanation */}
        <div className="bg-muted/30 rounded-xl p-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Control how insights appear. These settings help the app feel right for you.
          </p>
        </div>

        {/* Insight Behavior */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Insight Behavior
          </h2>
          
          <div className="bg-card rounded-xl border border-border/50 overflow-hidden divide-y divide-border/30">
            {/* Early Insights */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">Show exploratory insights</p>
                  <p className="text-sm text-muted-foreground">
                    See emerging patterns earlier
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.showEarlyInsights}
                onCheckedChange={(checked) => updateSetting("showEarlyInsights", checked)}
              />
            </div>

            {/* Confidence Labels */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Eye className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">Confidence labels</p>
                  <p className="text-sm text-muted-foreground">
                    Show how certain insights are
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.showConfidenceLabels}
                onCheckedChange={(checked) => updateSetting("showConfidenceLabels", checked)}
              />
            </div>

            {/* Speculative Language */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">Gentle language</p>
                  <p className="text-sm text-muted-foreground">
                    Use "may", "appears", "suggests"
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.allowSpeculativeLanguage}
                onCheckedChange={(checked) => updateSetting("allowSpeculativeLanguage", checked)}
              />
            </div>

            {/* Show Fewer Insights */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Minus className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">Show fewer insights</p>
                  <p className="text-sm text-muted-foreground">
                    For a more minimal experience
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.showFewerInsights}
                onCheckedChange={(checked) => updateSetting("showFewerInsights", checked)}
              />
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-muted/20 rounded-xl p-4 border border-dashed border-border/50">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Insights are never judgments — they're observations to help you understand yourself.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsInsights;
