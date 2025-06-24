import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Wand2, Save, RotateCcw, Barcode } from "lucide-react";
import { generateBarcode } from "@/lib/barcode";

interface BarcodeGeneratorProps {
  sku: string;
  onBarcodeTypeChange: (type: string) => void;
  onSave: () => void;
  isLoading?: boolean;
}

export default function BarcodeGenerator({ 
  sku, 
  onBarcodeTypeChange, 
  onSave, 
  isLoading 
}: BarcodeGeneratorProps) {
  const [barcodeType, setBarcodeType] = useState("code128");
  const [barcodeImage, setBarcodeImage] = useState<string | null>(null);

  useEffect(() => {
    if (sku) {
      generateBarcodeImage();
    }
  }, [sku, barcodeType]);

  const generateBarcodeImage = async () => {
    if (!sku) return;

    try {
      const imageData = await generateBarcode(sku, barcodeType);
      setBarcodeImage(imageData);
    } catch (error) {
      console.error("Failed to generate barcode:", error);
      setBarcodeImage(null);
    }
  };

  const handleBarcodeTypeChange = (type: string) => {
    setBarcodeType(type);
    onBarcodeTypeChange(type);
  };

  const regenerateSku = () => {
    // This would trigger SKU regeneration in the parent component
    setBarcodeImage(null);
  };

  const handleSave = () => {
    onSave();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Barcode className="w-5 h-5 mr-2 text-primary" />
          Barcode & SKU Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-generated SKU */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Auto-Generated SKU
          </Label>
          <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 flex items-center justify-between">
            <span className="font-mono text-lg">
              {sku || "Generate SKU by selecting category"}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={regenerateSku}
              disabled={!sku}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Format: [CATEGORY]-[SEQUENCE]-[YEAR]
          </p>
        </div>

        {/* Barcode Type Selection */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Barcode Type
          </Label>
          <RadioGroup 
            value={barcodeType} 
            onValueChange={handleBarcodeTypeChange}
            className="grid grid-cols-2 gap-3"
          >
            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="code128" id="code128" />
              <Label htmlFor="code128" className="text-sm cursor-pointer">Code 128</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="code39" id="code39" />
              <Label htmlFor="code39" className="text-sm cursor-pointer">Code 39</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="ean13" id="ean13" />
              <Label htmlFor="ean13" className="text-sm cursor-pointer">EAN-13</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
              <RadioGroupItem value="qr" id="qr" />
              <Label htmlFor="qr" className="text-sm cursor-pointer">QR Code</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Barcode Preview */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Barcode Preview
          </Label>
          <div className="bg-white border border-gray-200 rounded-lg p-4 text-center min-h-[120px] flex flex-col items-center justify-center">
            {barcodeImage ? (
              <div>
                <img 
                  src={barcodeImage} 
                  alt="Generated barcode" 
                  className="max-w-full h-auto mb-2"
                />
                <p className="text-sm text-gray-600 font-mono">{sku}</p>
              </div>
            ) : (
              <div className="text-gray-500">
                <div className="bg-gray-100 h-16 flex items-center justify-center rounded mb-2">
                  <span className="text-sm">Barcode will appear here</span>
                </div>
                <p className="text-sm font-mono">{sku || "No SKU generated"}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            onClick={generateBarcodeImage}
            disabled={!sku}
            className="w-full"
            variant="outline"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Generate Barcode
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!sku || isLoading}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Product"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}