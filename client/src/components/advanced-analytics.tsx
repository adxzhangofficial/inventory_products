import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line 
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  DollarSign, 
  AlertTriangle,
  ShoppingCart 
} from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdvancedAnalytics() {
  const { data: stats } = useQuery({
    queryKey: ["/api/analytics/products"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/products");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Calculate category distribution
  const categoryStats = categories.map((category: any) => {
    const categoryProducts = products.filter((p: any) => p.category === category.code);
    const totalValue = categoryProducts.reduce((sum: number, p: any) => sum + (p.price * p.stockQuantity), 0);
    return {
      name: category.name,
      count: categoryProducts.length,
      value: totalValue,
    };
  });

  // Calculate low stock items
  const lowStockItems = products.filter((p: any) => p.stockQuantity <= 10);
  
  // Calculate top products by value
  const topProducts = products
    .map((p: any) => ({
      name: p.name,
      value: p.price * p.stockQuantity,
      stock: p.stockQuantity,
    }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 5);

  // Stock status distribution
  const stockStatusData = [
    { name: 'In Stock', value: products.filter((p: any) => p.stockQuantity > 10).length, color: '#00C49F' },
    { name: 'Low Stock', value: products.filter((p: any) => p.stockQuantity > 0 && p.stockQuantity <= 10).length, color: '#FFBB28' },
    { name: 'Out of Stock', value: products.filter((p: any) => p.stockQuantity === 0).length, color: '#FF8042' },
  ];

  if (!stats) {
    return <div>Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Across {stats.categoriesCount} categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              Current stock valuation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Items with ≤10 units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Product Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalProducts > 0 ? (stats.totalValue / stats.totalProducts).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per product in inventory
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stock Status */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stockStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {stockStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Value */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.stock} units in stock
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${product.value.toFixed(2)}</p>
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Value Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Category Value Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryStats} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Value']} />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.slice(0, 6).map((product: any) => (
                <div key={product.id} className="bg-white rounded-lg p-3 border">
                  <h4 className="font-medium text-sm">{product.name}</h4>
                  <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs">
                      <span>Stock Level</span>
                      <span className="font-medium">{product.stockQuantity} units</span>
                    </div>
                    <Progress 
                      value={(product.stockQuantity / 50) * 100} 
                      className="h-2 mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
            {lowStockItems.length > 6 && (
              <p className="text-sm text-yellow-700 mt-4">
                And {lowStockItems.length - 6} more items with low stock...
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}