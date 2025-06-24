import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Receipt, FileText, Save, Download, Printer, Plus, Minus, X } from "lucide-react";
import { type Product } from "@shared/sqlite-schema";
import { z } from "zod";

const receiptFormSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  receiptNumber: z.string().min(1, "Receipt number is required"),
  customerName: z.string().optional(),
  receiptDate: z.string().min(1, "Date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  taxRate: z.number().min(0).max(1),
  discountRate: z.number().min(0).max(1),
});

type ReceiptFormData = z.infer<typeof receiptFormSchema>;

interface SelectedProduct extends Product {
  quantity: number;
  total: number;
}

export default function ReceiptGenerator() {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const receiptRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ReceiptFormData>({
    resolver: zodResolver(receiptFormSchema),
    defaultValues: {
      businessName: "ProductCode Pro Store",
      receiptNumber: `RCP-${Date.now().toString().slice(-6)}`,
      customerName: "",
      receiptDate: new Date().toISOString().split('T')[0],
      paymentMethod: "cash",
      taxRate: 0.0825,
      discountRate: 0,
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json() as Product[];
    },
  });

  const createReceiptMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/receipts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/receipts"] });
      toast({
        title: "Success",
        description: "Receipt created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create receipt.",
        variant: "destructive",
      });
    },
  });

  const handleProductSelect = (product: Product, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [
        ...prev,
        { ...product, quantity: 1, total: Number(product.price) }
      ]);
    } else {
      setSelectedProducts(prev => prev.filter(p => p.id !== product.id));
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? { ...p, quantity, total: Number(p.price) * quantity }
          : p
      )
    );
  };

  const removeProduct = (productId: number) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = selectedProducts.reduce((sum, p) => sum + p.total, 0);
    const taxRate = form.watch("taxRate") || 0;
    const discountRate = form.watch("discountRate") || 0;
    const discountAmount = subtotal * discountRate;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * taxRate;
    const total = taxableAmount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
    };
  };

  const totals = calculateTotals();

  const handlePrint = () => {
    window.print();
  };

  const generatePDF = () => {
    // This would integrate with a PDF generation library
    toast({
      title: "Feature Coming Soon",
      description: "PDF generation will be available in the next update.",
    });
  };

  const onSubmit = (data: ReceiptFormData) => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one product.",
        variant: "destructive",
      });
      return;
    }

    const receiptData = {
      receipt: {
        receiptNumber: data.receiptNumber,
        customerName: data.customerName,
        businessName: data.businessName,
        businessAddress: "123 Business Street, City, State 12345",
        businessPhone: "(555) 123-4567",
        subtotal: totals.subtotal.toString(),
        taxRate: data.taxRate.toString(),
        taxAmount: totals.taxAmount.toString(),
        discountRate: data.discountRate.toString(),
        discountAmount: totals.discountAmount.toString(),
        total: totals.total.toString(),
        paymentMethod: data.paymentMethod,
      },
      items: selectedProducts.map(product => ({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: product.quantity,
        unitPrice: product.price.toString(),
        totalPrice: product.total.toString(),
      })),
    };

    createReceiptMutation.mutate(receiptData);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Receipt Generator */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Receipt className="w-5 h-5 mr-2 text-primary" />
              Generate Receipt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Business Information */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receiptNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Receipt Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Customer Information */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter customer name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="receiptDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Product Selection */}
                <div>
                  <FormLabel className="mb-3 block">Select Products</FormLabel>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                    {products.map((product) => {
                      const isSelected = selectedProducts.some(p => p.id === product.id);
                      const selectedProduct = selectedProducts.find(p => p.id === product.id);
                      
                      return (
                        <div key={product.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handleProductSelect(product, checked as boolean)}
                            />
                            <div>
                              <span className="text-sm font-medium">{product.name}</span>
                              <span className="text-xs text-gray-500 ml-2">{product.sku}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">${Number(product.price).toFixed(2)}</span>
                            {isSelected && (
                              <div className="flex items-center space-x-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(product.id, Math.max(1, (selectedProduct?.quantity || 1) - 1))}
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center text-sm">
                                  {selectedProduct?.quantity || 1}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateQuantity(product.id, (selectedProduct?.quantity || 1) + 1)}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Products Summary */}
                {selectedProducts.length > 0 && (
                  <div className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h3 className="font-semibold">Selected Products</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {selectedProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div className="flex items-center space-x-3">
                            {product.imageUrl && (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.sku}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm">Qty: {product.quantity}</span>
                            <span className="text-sm font-medium w-20 text-right">
                              ${product.total.toFixed(2)}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProduct(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Credit Card</SelectItem>
                            <SelectItem value="digital">Digital Payment</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="taxRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="discountRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Totals */}
                {selectedProducts.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Discount:</span>
                      <span>${totals.discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax:</span>
                      <span>${totals.taxAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setSelectedProducts([]);
                    }}
                    className="flex-1"
                  >
                    Clear All
                  </Button>
                  <Button
                    type="submit"
                    disabled={selectedProducts.length === 0 || createReceiptMutation.isPending}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {createReceiptMutation.isPending ? "Generating..." : "Generate Receipt"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Receipt Preview */}
      <div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Receipt Preview</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={generatePDF}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Receipt Content */}
            <div ref={receiptRef} className="receipt-print border border-gray-200 rounded-lg p-4 bg-white font-mono text-sm">
              <div className="text-center border-b border-gray-200 pb-3 mb-3">
                <h4 className="font-bold text-lg">{form.watch("businessName")}</h4>
                <p className="text-gray-600 text-xs">
                  123 Business Street, City, State 12345<br />
                  Tel: (555) 123-4567
                </p>
              </div>

              <div className="space-y-1 border-b border-gray-200 pb-3 mb-3">
                <div className="flex justify-between">
                  <span>Receipt #:</span>
                  <span>{form.watch("receiptNumber")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{new Date(form.watch("receiptDate")).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{form.watch("customerName") || "Walk-in"}</span>
                </div>
              </div>

              <div className="border-b border-gray-200 pb-3 mb-3">
                <div className="font-medium mb-2">Items:</div>
                <div className="grid grid-cols-4 gap-1 mb-2 text-xs font-bold">
                  <span>Item</span>
                  <span>SKU</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Amount</span>
                </div>
                {selectedProducts.map((item) => (
                  <div key={item.id} className="grid grid-cols-4 gap-1 mb-1 text-xs">
                    <span className="truncate">{item.name}</span>
                    <span className="truncate">{item.sku}</span>
                    <span className="text-right">{item.quantity}</span>
                    <span className="text-right">${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>${totals.discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax ({((form.watch("taxRate") || 0) * 100).toFixed(2)}%):</span>
                  <span>${totals.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>Total:</span>
                  <span>${totals.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-500 mt-4 pt-3 border-t border-gray-200">
                <p>Thank you for your business!</p>
                <p>Generated with ProductCode Pro</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Button 
                onClick={() => form.handleSubmit(onSubmit)()} 
                className="w-full"
                disabled={selectedProducts.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Receipt
              </Button>
              <Button variant="outline" onClick={generatePDF} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
