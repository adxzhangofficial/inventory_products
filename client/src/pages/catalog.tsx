import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Filter, 
  Star, 
  Heart, 
  ArrowLeft, 
  Grid3X3, 
  List,
  SortAsc,
  SortDesc 
} from "lucide-react";
import { type Product, type Category } from "@shared/sqlite-schema";

interface CatalogPageProps {
  onBack: () => void;
}

export default function CatalogPage({ onBack }: CatalogPageProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Generate session ID for wishlist
  const [sessionId] = useState(() => 
    localStorage.getItem('catalog_session') || 
    (() => {
      const id = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('catalog_session', id);
      return id;
    })()
  );

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/catalog/categories"],
    queryFn: async () => {
      const response = await fetch("/api/catalog/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json() as (Category & { productCount: number })[];
    },
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/catalog/products", {
      search,
      category: selectedCategory,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      inStock: inStockOnly,
      featured: featuredOnly,
      sortBy,
      sortOrder,
    }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedCategory) params.set('category', selectedCategory);
      if (priceRange[0] > 0) params.set('minPrice', priceRange[0].toString());
      if (priceRange[1] < 1000) params.set('maxPrice', priceRange[1].toString());
      if (inStockOnly) params.set('inStock', 'true');
      if (featuredOnly) params.set('featured', 'true');
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const response = await fetch(`/api/catalog/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json() as Product[];
    },
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ["/api/catalog/wishlist", sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/catalog/wishlist?sessionId=${sessionId}`);
      if (!response.ok) throw new Error("Failed to fetch wishlist");
      return response.json();
    },
  });

  const toggleWishlist = async (productId: number) => {
    const isInWishlist = wishlist.some((item: any) => item.productId === productId);
    
    if (isInWishlist) {
      await fetch(`/api/catalog/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    } else {
      await fetch('/api/catalog/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, productId }),
      });
    }
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setPriceRange([0, 1000]);
    setInStockOnly(false);
    setFeaturedOnly(false);
    setSortBy("name");
    setSortOrder("asc");
  };

  const renderProductCard = (product: Product) => {
    const isInWishlist = wishlist.some((item: any) => item.productId === product.id);
    
    return (
      <Card key={product.id} className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="relative">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-48 object-cover rounded-md"
              />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 bg-white/80 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
            >
              <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            {product.isFeatured && (
              <Badge className="absolute top-2 left-2 bg-yellow-500">Featured</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-lg mb-2">{product.name}</CardTitle>
          <p className="text-sm text-gray-600 mb-2">{product.description}</p>
          
          <div className="flex justify-between items-center mb-2">
            <span className="text-2xl font-bold text-green-600">
              ${product.price.toFixed(2)}
            </span>
            <Badge variant={product.stockQuantity > 0 ? "default" : "destructive"}>
              {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm text-gray-500">(4.5)</span>
          </div>

          <div className="flex gap-2 text-sm text-gray-500">
            <span>SKU: {product.sku}</span>
            {product.brand && <span>• {product.brand}</span>}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Product Catalog</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [sort, order] = value.split('-');
              setSortBy(sort);
              setSortOrder(order);
            }}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="price-asc">Price Low-High</SelectItem>
                <SelectItem value="price-desc">Price High-Low</SelectItem>
                <SelectItem value="created-desc">Newest First</SelectItem>
                <SelectItem value="created-asc">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.code}>
                        {category.name} ({category.productCount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={1000}
                  step={10}
                  className="mt-2"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="in-stock"
                    checked={inStockOnly}
                    onCheckedChange={setInStockOnly}
                  />
                  <label htmlFor="in-stock" className="text-sm">In stock only</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={featuredOnly}
                    onCheckedChange={setFeaturedOnly}
                  />
                  <label htmlFor="featured" className="text-sm">Featured only</label>
                </div>
              </div>

              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            {isLoading ? "Loading..." : `${products.length} products found`}
          </p>
        </div>

        {/* Products Grid/List */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="w-full h-48 bg-gray-200 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
          }>
            {products.map(renderProductCard)}
          </div>
        )}

        {products.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found matching your criteria.</p>
            <Button onClick={clearFilters} className="mt-4">
              Clear filters to see all products
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}