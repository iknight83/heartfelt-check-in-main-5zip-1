import { ArrowLeft, Cloud, Download, RefreshCw, Trash2 } from "lucide-react";
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

const SettingsAccount = () => {
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = {
        moodHistory: JSON.parse(localStorage.getItem("moodHistory") || "[]"),
        trackedFactors: JSON.parse(localStorage.getItem("trackedFactors") || "[]"),
        factorCounts: JSON.parse(localStorage.getItem("factorCounts") || "{}"),
        notificationSettings: JSON.parse(localStorage.getItem("notificationSettings") || "{}"),
        insightSettings: JSON.parse(localStorage.getItem("insightSettings") || "{}"),
        exportedAt: new Date().toISOString(),
      };

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

  const handleResetInsights = () => {
    // Clear insight-related data but keep mood entries
    localStorage.removeItem("insightSettings");
    toast({ 
      title: "Insights reset",
      description: "Your learning phase has been reset to Exploring."
    });
  };

  const handleDeleteAllData = () => {
    localStorage.removeItem("moodHistory");
    localStorage.removeItem("trackedFactors");
    localStorage.removeItem("factorCounts");
    localStorage.removeItem("notificationSettings");
    localStorage.removeItem("insightSettings");
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
          <h1 className="text-xl font-semibold">Account & Data</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Sync & Backup */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Sync & Backup
          </h2>
          
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Cloud className="w-5 h-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-medium">Local-only storage</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your data is stored on this device. Export regularly to keep a backup.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Actions */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Your Data
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
                  Download all entries as JSON
                </p>
              </div>
            </button>

            {/* Reset Insights */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full flex items-center gap-4 bg-card rounded-xl p-4 border border-border/50 hover:bg-muted/50 transition-colors text-left">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Reset insights</p>
                    <p className="text-sm text-muted-foreground">
                      Start fresh without deleting entries
                    </p>
                  </div>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset insights?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset your learning phase to "Exploring" while keeping all your mood entries. Patterns will rebuild over time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetInsights}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete All */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full flex items-center gap-4 bg-card rounded-xl p-4 border border-border/50 hover:bg-destructive/5 transition-colors text-left">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-destructive">Delete all data</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently remove everything
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
                    onClick={handleDeleteAllData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsAccount;
