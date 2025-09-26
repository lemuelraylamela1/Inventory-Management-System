"use client";

import React, { useState } from "react";
import { LoginForm } from "./components/LoginForm";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { Dashboard } from "./components/sections/Dashboard";
import { Sales } from "./components/sections/Sales";
import { UserManagement } from "./components/sections/UserManagement";
import { GenericSection } from "./components/sections/GenericSection";
import { Toaster } from "./components/ui/sonner";
import ItemMaster from "./components/sections/ItemMaster";
import SalesPerson from "./components/sections/SalesPerson";
import CustomerType from "./components/sections/CustomerType";
import ItemClass from "./components/sections/ItemClass";
import PriceList from "./components/sections/PriceList";
import Supplier from "./components/sections/Supplier";
import Tax from "./components/sections/Tax";
import Warehouse from "./components/sections/Warehouse";
import Bank from "./components/sections/Bank";
import Customer from "./components/sections/Customer";
import UnitOFMeasure from "./components/sections/UnitOfMeasurement";
import Production from "./components/sections/Production";
import PurchaseOrder from "./components/sections/PurchaseOrder";
import PurchaseReceipt from "./components/sections/PurchaseReceipt";
import PurchaseReturn from "./components/sections/PurchaseReturn";
import InventoryAdjustment from "./components/sections/InventoryAdjustment";
import InventorySummary from "./components/sections/InventorySummary";
import InventoryTracker from "./components/sections/InventoryTracker";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<"admin" | "user">("user");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = (email: string, role: "admin" | "user") => {
    setIsAuthenticated(true);
    setUserEmail(email);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail("");
    setUserRole("user");
    setActiveSection("dashboard");
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <Dashboard />;
      case "sales":
        return <Sales />;
      case "purchase":
        return (
          <GenericSection
            title="Purchase Management"
            description="Manage supplier orders and purchase transactions"
            showImportExport={true}
          />
        );
      case "inventory":
        return (
          <GenericSection
            title="Inventory Management"
            description="Track stock levels, movements, and warehouse operations"
            showImportExport={true}
          />
        );
      case "reports":
        return (
          <GenericSection
            title="Reports & Analytics"
            description="Generate comprehensive business reports and analytics"
            showAddButton={false}
            showImportExport={true}
          />
        );
      case "bank":
        return <Bank />;
      case "customer":
        return <Customer />;
      case "customer-type":
        return <CustomerType />;
      case "inventory-adjustment":
        return <InventoryAdjustment />;
      case "inventory-summary":
        return <InventorySummary />;
      case "inventory-tracker":
        return <InventoryTracker />;
      case "item-class":
        return <ItemClass />;
      case "item-master":
        return <ItemMaster />;
      case "price-list":
        return <PriceList />;
      case "production":
        return <Production />;
      case "purchase-order":
        return <PurchaseOrder />;
      case "purchase-receipt":
        return <PurchaseReceipt />;
      case "purchase-return":
        return <PurchaseReturn />;
      case "sales-person":
        return <SalesPerson />;
      case "supplier":
        return <Supplier />;
      case "tax":
        return <Tax />;
      case "unit-measure":
        return <UnitOFMeasure />;
      case "warehouse":
        return <Warehouse />;
      default:
        return <UserManagement />;
    }
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          userRole={userRole}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <Header
            userEmail={userEmail}
            userRole={userRole}
            activeSection={activeSection}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="flex-1 overflow-y-auto p-6">
            {renderActiveSection()}
          </main>
        </div>
      </div>
      <Toaster />
    </>
  );
}
