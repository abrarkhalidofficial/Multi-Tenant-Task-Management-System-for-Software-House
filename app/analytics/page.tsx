import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import { AnalyticsOverview } from "@/components/analytics/analytics-overview";

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="max-w-7xl mx-auto">
              <AnalyticsOverview />
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
