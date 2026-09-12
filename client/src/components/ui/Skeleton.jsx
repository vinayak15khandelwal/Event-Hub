const Skeleton = ({ className = "" }) => (
  <div
    className={`animate-shimmer rounded-md bg-slate-200 bg-[length:200%_100%] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:bg-slate-800 dark:from-slate-800 dark:via-slate-700/60 dark:to-slate-800 ${className}`}
    aria-hidden="true"
  />
);

export const SkeletonCard = () => (
  <div className="surface-card space-y-3 p-5">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-4 w-14" />
    </div>
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="flex items-center justify-between pt-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
);

export default Skeleton;
