import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, DollarSign, AlertTriangle, BarChart3 } from "lucide-react";

export default function AnalyticsDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/analytics/stats"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/stats");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Value",
      value: `$${(stats?.totalValue || 0).toLocaleString()}`,
      icon: DollarSign,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Low Stock",
      value: stats?.lowStockCount || 0,
      icon: AlertTriangle,
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      title: "Categories",
      value: stats?.categoriesCount || 0,
      icon: BarChart3,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Chart visualization coming soon</p>
                <p className="text-sm text-gray-400">
                  Will show product distribution by category
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Chart visualization coming soon</p>
                <p className="text-sm text-gray-400">
                  Will show inventory changes over time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Stock Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">In Stock</span>
                <span className="text-sm font-medium text-green-600">
                  {(stats?.totalProducts || 0) - (stats?.lowStockCount || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Low Stock</span>
                <span className="text-sm font-medium text-yellow-600">
                  {stats?.lowStockCount || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Out of Stock</span>
                <span className="text-sm font-medium text-red-600">0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Electronics</span>
                <span className="text-sm font-medium">35%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Clothing</span>
                <span className="text-sm font-medium">25%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Food & Beverage</span>
                <span className="text-sm font-medium">20%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Other</span>
                <span className="text-sm font-medium">20%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <p className="font-medium">Product Added</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">Receipt Generated</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">Inventory Updated</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
