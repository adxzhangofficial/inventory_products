import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ProductForm from "@/components/product-form";
import InventoryTable from "@/components/inventory-table";
import ReceiptGenerator from "@/components/receipt-generator";
import AnalyticsDashboard from "@/components/analytics-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Barcode,
  Plus,
  Package,
  Receipt,
  BarChart3,
  Search,
  Bell,
} from "lucide-react";

type Tab = "add-product" | "inventory" | "receipts" | "analytics";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("add-product");
  const [searchQuery, setSearchQuery] = useState("");

  const tabs = [
    { id: "add-product" as Tab, label: "Add Product", icon: Plus },
    { id: "inventory" as Tab, label: "Inventory", icon: Package },
    { id: "receipts" as Tab, label: "Receipts", icon: Receipt },
    { id: "analytics" as Tab, label: "Analytics", icon: BarChart3 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "add-product":
        return <ProductForm />;
      case "inventory":
        return <InventoryTable searchQuery={searchQuery} />;
      case "receipts":
        return <ReceiptGenerator />;
      case "analytics":
        return <AnalyticsDashboard />;
      default:
        return <ProductForm />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary flex items-center">
                  <Barcode className="w-6 h-6 mr-2" />
                  AILI Garments SKU Generator
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">JD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2 inline" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
}
