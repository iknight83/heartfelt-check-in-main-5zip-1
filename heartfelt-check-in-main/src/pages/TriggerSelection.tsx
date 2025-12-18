import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const triggerGroups = [
  {
    label: "People",
    items: ["Myself", "Partner", "Family", "Friends", "Colleagues"],
  },
  {
    label: "Activities",
    items: ["Work", "Training", "Hobby", "Resting", "Studying", "Music", "TV"],
  },
  {
    label: "Places",
    items: ["Home", "Office", "School", "University"],
  },
  {
    label: "External",
    items: ["News", "Economy", "Social Media", "Weather"],
  },
];

const TriggerSelection = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const mood = searchParams.get("mood") || "Uninspired";
  const time = searchParams.get("time") || "";
  const isNew = searchParams.get("new") || "";
  const dateParam = searchParams.get("date") || "";
  const entryId = searchParams.get("id") || "";
  const existingTriggers = searchParams.get("triggers")?.split(",").filter(Boolean) || [];
  
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>(existingTriggers);

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger)
        ? prev.filter((t) => t !== trigger)
        : [...prev, trigger]
    );
  };

  const handleSave = () => {
    const triggersParam = selectedTriggers.join(",");
    const params = new URLSearchParams({
      mood,
      time,
      triggers: triggersParam,
      new: isNew,
    });
    if (dateParam) params.set("date", dateParam);
    if (entryId) params.set("id", entryId);
    navigate(`/mood?${params.toString()}`);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen gradient-bg pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-12 pb-6">
        <button
          onClick={handleCancel}
          className="p-2 -ml-2 rounded-full bg-muted/20 text-foreground hover:bg-muted/30 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-muted-foreground text-sm">Cancel</span>
      </div>

      <div className="max-w-md mx-auto px-5 space-y-6">
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            What influenced feeling{" "}
            <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
              {mood}
            </span>
            ?
          </h1>
          <p className="text-muted-foreground text-sm">
            Select all that apply
          </p>
        </div>

        {/* Trigger Groups */}
        <div className="space-y-6">
          {triggerGroups.map((group) => (
            <div key={group.label} className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((trigger) => {
                  const isSelected = selectedTriggers.includes(trigger);
                  return (
                    <button
                      key={trigger}
                      onClick={() => toggleTrigger(trigger)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? "bg-accent text-accent-foreground shadow-lg shadow-accent/25"
                          : "bg-card/40 text-muted-foreground border border-border/30 hover:bg-card/60 hover:text-foreground"
                      }`}
                    >
                      {trigger}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-xl bg-accent text-accent-foreground font-semibold text-lg shadow-lg shadow-accent/25 hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default TriggerSelection;
