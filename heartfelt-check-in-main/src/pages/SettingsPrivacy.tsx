import { ArrowLeft, Shield, Download, Trash2, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

const SettingsPrivacy = () => {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Gather all user data from localStorage
      const data = {
        moodHistory: JSON.parse(localStorage.getItem("moodHistory") || "[]"),
        trackedFactors: JSON.parse(localStorage.getItem("trackedFactors") || "[]"),
        factorCounts: JSON.parse(localStorage.getItem("factorCounts") || "{}"),
        notificationSettings: JSON.parse(localStorage.getItem("notificationSettings") || "{}"),
        exportedAt: new Date().toISOString(),
      };

      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `emotional-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Data exported successfully" });
    } catch (error) {
      toast({ 
        title: "Export failed", 
        description: "Please try again.",
        variant: "destructive" 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = () => {
    // Clear all app-related localStorage
    localStorage.removeItem("moodHistory");
    localStorage.removeItem("trackedFactors");
    localStorage.removeItem("factorCounts");
    localStorage.removeItem("notificationSettings");
    localStorage.removeItem("subscriptionStatus");
    localStorage.removeItem("trialStartDate");
    
    toast({ title: "All data deleted" });
    navigate("/");
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
          <h1 className="text-xl font-semibold">Data & Privacy</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Your Data */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Your Data
          </h2>
          
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-3">
                <p className="font-medium">Private & Secure</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your emotional data is stored locally on your device.
                </p>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">What's never shared:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      Your mood entries and notes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      Tracked factors and triggers
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      Personal patterns and insights
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      Any identifying information
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Control */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Data Control
          </h2>
          
          <div className="space-y-2">
            {/* Export */}
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full flex items-center gap-4 bg-card rounded-xl p-4 border border-border/50 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Download className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Export my data</p>
                <p className="text-sm text-muted-foreground">
                  Download all your entries as a file
                </p>
              </div>
            </button>

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full flex items-center gap-4 bg-card rounded-xl p-4 border border-border/50 hover:bg-destructive/5 transition-colors text-left">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-destructive">Delete my data</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently remove all your entries
                    </p>
                  </div>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your mood entries, tracked factors, and settings. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* How Insights Work */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            How Insights Work
          </h2>
          
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Pattern Recognition</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Insights are generated from patterns in your own entries — not compared to others. Your emotional journey is unique.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Footer */}
        <div className="pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Your data stays yours. Insights are generated only from your own entries.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPrivacy;
