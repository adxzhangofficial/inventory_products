import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString().slice(-6);
  return `RCP-${timestamp}`;
}

export function calculateStockStatus(stock: number): {
  label: string;
  variant: 'default' | 'secondary' | 'destructive';
} {
  if (stock === 0) {
    return { label: 'Out of Stock', variant: 'destructive' };
  } else if (stock <= 10) {
    return { label: 'Low Stock', variant: 'secondary' };
  } else {
    return { label: 'In Stock', variant: 'default' };
  }
}
