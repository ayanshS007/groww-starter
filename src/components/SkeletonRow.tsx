// Loading placeholder (README 10: skeletons for loading). Still when motion is reduced.
export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden className={`flex items-center gap-3 ${className}`}>
      <div className="h-11 w-11 shrink-0 rounded-full bg-surface2 animate-pulse motion-reduce:animate-none" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded-full bg-surface2 animate-pulse motion-reduce:animate-none" />
        <div className="h-3 w-1/3 rounded-full bg-surface2 animate-pulse motion-reduce:animate-none" />
      </div>
    </div>
  );
}
