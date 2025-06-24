import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, Settings, LogOut, Key } from "lucide-react";
import ChangePasswordDialog from "@/components/change-password-dialog";

interface HomePageProps {
  user: { username: string; role: string };
  onNavigate: (page: 'admin' | 'catalog') => void;
  onLogout: () => void;
}

export default function HomePage({ user, onNavigate, onLogout }: HomePageProps) {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, {user.username}!
            </h1>
            <p className="text-gray-600">Choose your destination</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowPasswordDialog(true)} variant="outline" className="gap-2">
              <Key className="h-4 w-4" />
              Change Password
            </Button>
            <Button onClick={onLogout} variant="outline" className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {user.role === 'admin' && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('admin')}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <Settings className="h-8 w-8 text-indigo-600" />
                </div>
                <CardTitle className="text-xl">Admin Panel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center mb-4">
                  Manage products, inventory, generate receipts, and view analytics
                </p>
                <ul className="text-sm text-gray-500 space-y-1">
                  <li>• Add and manage products</li>
                  <li>• Generate barcodes and SKUs</li>
                  <li>• Create receipts</li>
                  <li>• View sales analytics</li>
                  <li>• Manage categories</li>
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate('catalog')}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-xl">Product Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center mb-4">
                Browse and explore our complete product catalog
              </p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Browse all products</li>
                <li>• Advanced search and filters</li>
                <li>• Product reviews and ratings</li>
                <li>• Wishlist functionality</li>
                <li>• Category navigation</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <ChangePasswordDialog
          open={showPasswordDialog}
          onOpenChange={setShowPasswordDialog}
        />
      </div>
    </div>
  );
}