import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductSchema } from "@shared/sqlite-schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import BarcodeGenerator from "./barcode-generator";
import { type Category } from "@shared/sqlite-schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CloudUpload, X, Info, Save, RotateCcw, Plus } from "lucide-react";
import { z } from "zod";

type FormData = z.infer<typeof insertProductSchema>;

export default function ProductForm() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [generatedSku, setGeneratedSku] = useState<string>("");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryCode, setNewCategoryCode] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      category: "",
      price: 0,
      stockQuantity: 0,
      description: "",
      details: "",
      brand: "",
      model: "",
      weight: undefined,
      length: undefined,
      width: undefined,
      height: undefined,
      barcodeType: "code128",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Add required fields
      formData.append("name", data.name);
      formData.append("sku", data.sku || generatedSku);
      formData.append("category", data.category);
      formData.append("price", data.price.toString());
      formData.append("stockQuantity", data.stockQuantity.toString());
      formData.append("barcodeType", data.barcodeType);

      // Add optional text fields (only if they have values)
      if (data.description && data.description.trim()) {
        formData.append("description", data.description.trim());
      }
      if (data.details && data.details.trim()) {
        formData.append("details", data.details.trim());
      }
      if (data.brand && data.brand.trim()) {
        formData.append("brand", data.brand.trim());
      }
      if (data.model && data.model.trim()) {
        formData.append("model", data.model.trim());
      }

      // Add optional numeric fields (only if they have values and are greater than 0)
      if (data.weight && data.weight > 0) {
        formData.append("weight", data.weight.toString());
      }
      if (data.length && data.length > 0) {
        formData.append("length", data.length.toString());
      }
      if (data.width && data.width > 0) {
        formData.append("width", data.width.toString());
      }
      if (data.height && data.height > 0) {
        formData.append("height", data.height.toString());
      }

      // Add image if selected
      if (imageFile) {
        formData.append("image", imageFile);
      }
      
      return apiRequest("POST", "/api/products", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product created successfully!",
      });
      form.reset();
      setImagePreview(null);
      setImageFile(null);
      setGeneratedSku("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json() as Category[];
    },
  });

  const generateSkuMutation = useMutation({
    mutationFn: async (category: string) => {
      const response = await apiRequest("POST", "/api/generate-sku", { category });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedSku(data.sku);
      form.setValue("sku", data.sku);
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: { name: string; code: string }) => {
      return apiRequest("POST", "/api/categories", categoryData);
    },
    onSuccess: () => {
      refetchCategories();
      setShowCategoryDialog(false);
      setNewCategoryName("");
      setNewCategoryCode("");
      toast({
        title: "Success",
        description: "Category created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const onSubmit = async (data: FormData) => {
    createProductMutation.mutate(data);
  };

  const handleCategoryChange = (category: string) => {
    form.setValue("category", category);
    if (category) {
      generateSkuMutation.mutate(category);
    }
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim() || !newCategoryCode.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both category name and code",
        variant: "destructive",
      });
      return;
    }

    createCategoryMutation.mutate({
      name: newCategoryName.trim(),
      code: newCategoryCode.trim().toUpperCase(),
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Information Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="w-5 h-5 mr-2 text-primary" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Image Upload */}
                <div>
                  <FormLabel>Product Image</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="mx-auto rounded-lg mb-2 w-32 h-32 object-cover"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeImage}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">
                          Drag & drop an image here, or{" "}
                          <label className="text-primary cursor-pointer">
                            browse
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <div className="flex gap-2">
                        <Select onValueChange={handleCategoryChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.code}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="icon">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create New Category</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Category Name</label>
                                <Input
                                  value={newCategoryName}
                                  onChange={(e) => setNewCategoryName(e.target.value)}
                                  placeholder="Enter category name"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">Category Code</label>
                                <Input
                                  value={newCategoryCode}
                                  onChange={(e) => setNewCategoryCode(e.target.value.toUpperCase())}
                                  placeholder="Enter 3-letter code (e.g., ELC)"
                                  maxLength={3}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  3-letter code used for SKU generation
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  onClick={handleCreateCategory}
                                  disabled={createCategoryMutation.isPending}
                                  className="flex-1"
                                >
                                  {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowCategoryDialog(false)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Price and Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="pl-8"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Brand and Model */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter brand name" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter model" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Enter product description"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Details */}
                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Details</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="Size, color, material, etc."
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dimensions */}
                <div className="grid grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (lbs)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Length (in)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Width (in)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (in)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Barcode Generation */}
        <BarcodeGenerator
          sku={generatedSku}
          onBarcodeTypeChange={(type) => form.setValue("barcodeType", type)}
          onSave={() => {
            const values = form.getValues();
            console.log("Form values:", values); // Debug log
            form.handleSubmit((data) => {
              console.log("Validated data:", data); // Debug log
              onSubmit(data);
            })();
          }}
          isLoading={createProductMutation.isPending}
        />
      </div>
    </div>
  );
}