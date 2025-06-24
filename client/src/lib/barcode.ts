import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

export async function generateBarcode(data: string, format: string): Promise<string> {
  const canvas = document.createElement('canvas');
  
  try {
    if (format === 'qr') {
      // Generate QR code
      return await QRCode.toDataURL(data, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } else {
      // Generate barcode using JsBarcode
      const formatMap: Record<string, string> = {
        'code128': 'CODE128',
        'code39': 'CODE39',
        'ean13': 'EAN13',
      };
      
      const barcodeFormat = formatMap[format] || 'CODE128';
      
      // Special handling for EAN13 - needs exactly 12 digits
      let barcodeData = data;
      if (format === 'ean13') {
        // Convert SKU to numeric format for EAN13
        const numericData = data.replace(/[^0-9]/g, '');
        barcodeData = numericData.padEnd(12, '0').substring(0, 12);
      }
      
      JsBarcode(canvas, barcodeData, {
        format: barcodeFormat,
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 14,
        margin: 10,
        background: '#FFFFFF',
        lineColor: '#000000'
      });
      
      return canvas.toDataURL();
    }
  } catch (error) {
    console.error('Barcode generation error:', error);
    throw new Error(`Failed to generate ${format} barcode: ${error}`);
  }
}

// In a real implementation, you would install and use JsBarcode:
/*
import JsBarcode from 'jsbarcode';

export function generateBarcode(data: string, format: string): string {
  const canvas = document.createElement('canvas');
  
  const formatMap: Record<string, string> = {
    'code128': 'CODE128',
    'code39': 'CODE39',
    'ean13': 'EAN13',
    'qr': 'QR', // This would require a QR code library
  };
  
  JsBarcode(canvas, data, {
    format: formatMap[format] || 'CODE128',
    width: 2,
    height: 50,
    displayValue: true,
  });
  
  return canvas.toDataURL();
}
*/
