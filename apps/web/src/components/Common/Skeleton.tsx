import React from "react";

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const IssueSkeleton = () => (
  <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
    <div className="flex justify-between">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
    <Skeleton className="h-5 w-full" />
    <Skeleton className="h-5 w-2/3" />
    <div className="flex gap-2">
      <Skeleton className="h-4 w-8" />
      <Skeleton className="h-4 w-12" />
    </div>
  </div>
);
