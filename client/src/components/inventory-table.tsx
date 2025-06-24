import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Package, 
  Filter, 
  Download, 
  Edit, 
  Barcode,
  Trash2
} from "lucide-react";
import { type Product } from "@shared/sqlite-schema";
import { generateBarcode } from "@/lib/barcode";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProductEditDialog from "./product-edit-dialog";

interface InventoryTableProps {
  searchQuery: string;
}

export default function InventoryTable({ searchQuery }: InventoryTableProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showBarcode, setShowBarcode] = useState<string | null>(null);
  const [barcodeImage, setBarcodeImage] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products", searchQuery, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory) params.set('category', selectedCategory);
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json() as Product[];
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

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return { label: "Out of Stock", variant: "destructive" as const };
    } else if (stock <= 10) {
      return { label: "Low Stock", variant: "secondary" as const };
    } else {
      return { label: "In Stock", variant: "default" as const };
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      ELC: "bg-blue-100 text-blue-800",
      CLT: "bg-purple-100 text-purple-800",
      FNB: "bg-green-100 text-green-800",
      HOM: "bg-orange-100 text-orange-800",
      BKS: "bg-indigo-100 text-indigo-800",
      TOY: "bg-pink-100 text-pink-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      ELC: "Electronics",
      CLT: "Clothing",
      FNB: "Food & Beverage",
      HOM: "Home & Garden",
      BKS: "Books",
      TOY: "Toys",
    };
    return names[category] || category;
  };

  const generateProductBarcode = async (sku: string, barcodeType: string) => {
    try {
      const imageData = await generateBarcode(sku, barcodeType);
      setBarcodeImage(imageData);
      setShowBarcode(sku);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate barcode",
        variant: "destructive",
      });
    }
  };

  const downloadBarcode = () => {
    if (barcodeImage) {
      const link = document.createElement('a');
      link.download = `barcode-${showBarcode}.png`;
      link.href = barcodeImage;
      link.click();
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowEditDialog(true);
  };

  const handleDeleteProduct = (productId: number) => {
    deleteProductMutation.mutate(productId);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2 text-primary" />
            Product Inventory
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="flex gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {categories.map((category: any) => (
                <SelectItem key={category.id} value={category.code}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-gray-500">Loading products...</p>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.stockQuantity);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {product.imageUrl ? (
                              <img
                                className="h-10 w-10 rounded-lg object-cover"
                                src={product.imageUrl}
                                alt={product.name}
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{product.sku}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(product.category)}`}>
                          {getCategoryName(product.category)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        ${Number(product.price).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={stockStatus.variant}>
                          {product.stockQuantity} - {stockStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" onClick={() => generateProductBarcode(product.sku, product.barcodeType)}>
                            <Barcode className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {products.length > 0 && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to{" "}
              <span className="font-medium">{products.length}</span> of{" "}
              <span className="font-medium">{products.length}</span> products
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                1
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {showBarcode && (
        <Dialog open={!!showBarcode} onOpenChange={() => setShowBarcode(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Product Barcode</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {barcodeImage && (
                <div className="flex flex-col items-center space-y-4">
                  <img src={barcodeImage} alt={`Barcode for ${showBarcode}`} className="max-w-full" />
                  <Button onClick={downloadBarcode}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Barcode
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ProductEditDialog
        product={editingProduct}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        categories={categories}
      />
    </Card>
  );
}