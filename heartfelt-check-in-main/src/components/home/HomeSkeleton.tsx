const HomeSkeleton = () => {
  return (
    <div className="min-h-screen gradient-bg pb-24">
      <div className="max-w-md mx-auto px-5 pt-12 space-y-8">
        <div className="flex items-center justify-center gap-4">
          <div className="w-6 h-6 bg-muted/30 rounded animate-pulse" />
          <div className="h-8 w-40 bg-muted/30 rounded animate-pulse" />
          <div className="w-6 h-6 bg-muted/30 rounded animate-pulse" />
        </div>

        <div className="space-y-4">
          <div className="h-7 w-32 bg-muted/30 rounded animate-pulse" />
          <div className="w-full h-36 rounded-3xl bg-muted/20 border border-muted/30 animate-pulse" />
        </div>

        <div className="space-y-4">
          <div className="h-7 w-24 bg-muted/30 rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-14 rounded-2xl bg-muted/20 animate-pulse" />
            <div className="h-14 rounded-2xl bg-muted/20 animate-pulse" />
          </div>
          <div className="h-10 rounded-2xl bg-muted/15 animate-pulse" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border/30">
        <div className="max-w-md mx-auto flex items-center justify-around py-3 px-6">
          <div className="w-12 h-12 bg-muted/20 rounded-full animate-pulse" />
          <div className="w-14 h-14 bg-primary/20 rounded-full animate-pulse" />
          <div className="w-12 h-12 bg-muted/20 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default HomeSkeleton;
