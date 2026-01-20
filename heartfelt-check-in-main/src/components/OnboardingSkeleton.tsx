const OnboardingSkeleton = () => {
  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4 text-center">
          <div className="h-10 w-48 mx-auto bg-muted/30 rounded-lg animate-pulse" />
          <div className="h-5 w-64 mx-auto bg-muted/20 rounded animate-pulse" />
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => (
            <div 
              key={i} 
              className="h-16 bg-muted/20 rounded-2xl animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
        
        <div className="pt-4">
          <div className="h-14 w-full bg-primary/30 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default OnboardingSkeleton;
