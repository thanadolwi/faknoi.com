export default function DashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Hero skeleton */}
      <div className="rounded-3xl h-36 bg-gradient-to-br from-brand-navy/20 to-brand-blue/10" />

      {/* Cards skeleton */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="card p-4 space-y-3">
          <div className="h-4 bg-gray-100 rounded-full w-1/3" />
          <div className="h-3 bg-gray-100 rounded-full w-2/3" />
          <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        </div>
      ))}
    </div>
  );
}
