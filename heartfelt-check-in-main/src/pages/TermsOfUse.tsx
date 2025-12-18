import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const TermsOfUse = () => {
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
        <h1 className="text-lg font-semibold text-foreground">Terms of Use</h1>
      </header>

      <ScrollArea className="h-[calc(100vh-65px)]">
        <div className="px-5 py-6 space-y-6">
          <p className="text-muted-foreground text-sm">Last updated: December 2025</p>

          <p className="text-foreground/90 text-sm leading-relaxed">
            By using this app, you agree to the following terms.
          </p>

          <section className="space-y-3">
            <h2 className="text-foreground font-semibold">Purpose of the app</h2>
            <p className="text-foreground/80 text-sm leading-relaxed">
              This app is intended for personal reflection and emotional awareness. It is not a medical, psychological, or diagnostic tool.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-semibold">No professional advice</h2>
            <p className="text-foreground/80 text-sm leading-relaxed">
              Insights provided by the app are observational only and should not replace professional advice from a qualified mental health provider.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-semibold">Your responsibility</h2>
            <p className="text-foreground/80 text-sm leading-relaxed">
              You are responsible for how you interpret and use the information provided.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-semibold">Data ownership</h2>
            <p className="text-foreground/80 text-sm leading-relaxed">
              Your data belongs to you. You may export or delete it at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-semibold">Subscription</h2>
            <p className="text-foreground/80 text-sm leading-relaxed">
              If you choose to subscribe, payment and renewal are handled through the platform (e.g. App Store). Subscription access does not alter data ownership.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-semibold">Limitation of liability</h2>
            <p className="text-foreground/80 text-sm leading-relaxed">
              We are not liable for decisions made based on app insights.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-foreground font-semibold">Changes</h2>
            <p className="text-foreground/80 text-sm leading-relaxed">
              These terms may be updated. Continued use indicates acceptance of the latest version.
            </p>
          </section>

          <section className="space-y-2 pt-4 border-t border-border/20">
            <p className="text-foreground/80 text-sm">Questions or concerns:</p>
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

export default TermsOfUse;
