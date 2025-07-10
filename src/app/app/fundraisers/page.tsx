"use client";

export default function FundraisersPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-card border border-border rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Fundraisers</h1>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
            Create Fundraiser
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder fundraiser cards */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-muted/50 border border-border rounded-lg overflow-hidden"
            >
              <div className="h-48 bg-muted animate-pulse" />
              <div className="p-4">
                <div className="space-y-2 mb-4">
                  <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded w-full animate-pulse" />
                  <div className="h-2 bg-muted rounded w-4/5 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
