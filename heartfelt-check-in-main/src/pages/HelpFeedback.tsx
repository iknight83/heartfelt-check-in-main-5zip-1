import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const HelpFeedback = () => {
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
        <h1 className="text-lg font-semibold text-foreground">Help & Feedback</h1>
      </header>

      <div className="px-5 py-6 space-y-6">
        <p className="text-foreground/90 text-sm leading-relaxed">
          This app is designed to be calm, private, and self-guided.
        </p>

        <p className="text-foreground/80 text-sm leading-relaxed">
          If something feels unclear, broken, or you'd like to share feedback, you're welcome to reach out.
        </p>

        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Email</p>
                <a 
                  href="mailto:knightleeron1@gmail.com" 
                  className="text-foreground font-medium hover:text-primary transition-colors"
                >
                  knightleeron1@gmail.com
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-muted-foreground text-sm">
          We read every message and use feedback to improve the app thoughtfully.
        </p>
      </div>
    </div>
  );
};

export default HelpFeedback;
