import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-bg">
      <header className="px-5 py-4 flex items-center gap-3 border-b border-border/20">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Privacy Policy</h1>
      </header>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <div className="px-5 py-6 space-y-6">
          <p className="text-muted-foreground text-sm">Last updated: December 2025</p>

          <p className="text-foreground/90 text-sm leading-relaxed">
            Your privacy matters. This app is designed to help you reflect on your emotions — not to monitor, profile, or sell your data.
          </p>

          <section className="space-y-3">
            <h2 className="text-foreground font-semibold">What data is stored</h2>
            <ul className="text-foreground/80 text-sm space-y-2 list-disc list-inside">
              <li>Mood check-ins and optional notes</li>
              <li>Optional tracked factors you choose to enable</li>
              <li>App usage needed to generate personal insights</li>
            </ul>
            <p className="text-foreground/80 text-sm leading-relaxed">
              All emotional data is stored locally on your device unless you explicitly enable cloud sync in the future.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-semibold">What is NOT collected</h2>
            <ul className="text-foreground/80 text-sm space-y-2 list-disc list-inside">
              <li>No advertising identifiers</li>
              <li>No location tracking</li>
              <li>No contact lists</li>
              <li>No biometric or health records</li>
              <li>No selling or sharing of personal data</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-semibold">How insights work</h2>
            <p className="text-foreground/80 text-sm leading-relaxed">
              Insights are generated only from your own entries. They are not compared to other users and are not used to make predictions or judgments.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-semibold">Data control</h2>
            <p className="text-foreground/80 text-sm leading-relaxed">You can:</p>
            <ul className="text-foreground/80 text-sm space-y-2 list-disc list-inside">
              <li>Export your data at any time</li>
              <li>Reset insights without deleting entries</li>
              <li>Permanently delete all data from within the app</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-semibold">Third parties</h2>
            <p className="text-foreground/80 text-sm leading-relaxed">
              We do not share your emotional data with third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-semibold">Changes</h2>
            <p className="text-foreground/80 text-sm leading-relaxed">
              If this policy changes, the date above will be updated and changes will be communicated clearly.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-border/20">
            <p className="text-foreground/80 text-sm">If you have questions, contact:</p>
            <a 
              href="mailto:knightleeron1@gmail.com" 
              className="text-primary text-sm hover:underline"
            >
              knightleeron1@gmail.com
            </a>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
};

export default PrivacyPolicy;
