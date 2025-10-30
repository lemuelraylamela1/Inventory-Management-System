"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "./ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Users,
  Building2,
  UserCheck,
  Shapes,
  FileText,
  Banknote,
  DollarSign,
  UserCircle,
  Truck,
  Receipt,
  Ruler,
  Warehouse,
  LogOut,
  Factory,
  X,
  ClipboardList,
  FileEdit,
  Boxes,
  Undo2,
  CheckCircle,
} from "lucide-react";

interface SidebarProps {
  userRole: "admin" | "user";
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({
  userRole,
  activeSection,
  onSectionChange,
  onLogout,
  isOpen,
  onToggle,
}: SidebarProps) {
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([]);

  const toggleSubMenu = (menu: string) => {
    setOpenSubMenus((prev) => (prev.includes(menu) ? [] : [menu]));
  };

  const mainMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    // { id: "sales", label: "Sales", icon: ShoppingCart },
    // { id: "purchase", label: "Purchase", icon: Package },
    // { id: "inventory", label: "Inventory", icon: Package2 },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "users", label: "User Management", icon: Users, adminOnly: true },
  ];

  const inventory = [
    { id: "inventory-summary", label: "Inventory Summary", icon: Boxes },
    {
      id: "inventory-tracker",
      label: "Inventory Tracker",
      icon: ClipboardList,
    },
    {
      id: "inventory-adjustment",
      label: "Inventory Adjustment",
      icon: FileEdit,
    },
  ];

  const purchase = [
    { id: "purchase-order", label: "Purchase Order", icon: ShoppingCart },
    { id: "purchase-receipt", label: "Purchase Receipt", icon: Receipt },
    { id: "purchase-return", label: "Purchase Return", icon: Undo2 },
  ];

  const sales = [
    { id: "sales-order", label: "Sales Order", icon: ShoppingCart },
    { id: "sales-invoice", label: "Sales Invoice", icon: FileText },
  ];

  const stockTransfer = [
    { id: "transfer-request", label: "Transfer Request", icon: Truck },
    { id: "transfer-approved", label: "Transfer Approved", icon: CheckCircle },
  ];

  const maintenanceItems = [
    { id: "account-class", label: "Account Class", icon: Banknote },
    { id: "bank", label: "Bank", icon: Building2 },
    { id: "customer", label: "Customer", icon: Users },
    { id: "customer-type", label: "Customer Type", icon: UserCheck },
    { id: "item-class", label: "Item Class", icon: Shapes },
    { id: "item-master", label: "Item Master", icon: Package },
    { id: "price-list", label: "Price List", icon: DollarSign },
    { id: "production", label: "Production", icon: Factory },
    { id: "sales-person", label: "Sales Person", icon: UserCircle },
    { id: "supplier", label: "Supplier", icon: Truck },
    { id: "tax", label: "Tax", icon: Receipt },
    { id: "unit-measure", label: "Unit of Measure", icon: Ruler },
    { id: "warehouse", label: "Warehouse", icon: Warehouse },
  ];

  const filteredMainMenuItems = mainMenuItems.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed left-0 top-0 z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        lg:static lg:z-auto
      `}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">IMS</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="lg:hidden">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-4">
            <nav className="space-y-2">
              {filteredMainMenuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeSection === item.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    onSectionChange(item.id);
                    if (window.innerWidth < 1024) onToggle();
                  }}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              ))}

              <Collapsible
                open={openSubMenus.includes("sales")}
                onOpenChange={() => toggleSubMenu("sales")}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Sales
                    {openSubMenus.includes("sales") ? (
                      <ChevronDown
                        className={`ml-auto h-4 w-4 transform transition-transform duration-300 ${
                          openSubMenus.includes("sales")
                            ? "rotate-180"
                            : "rotate-0"
                        }`}
                      />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <AnimatePresence initial={false}>
                  {openSubMenus.includes("sales") && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="space-y-1 ml-4 mt-1 overflow-hidden">
                      {sales.map((item) => (
                        <Button
                          key={item.id}
                          variant={
                            activeSection === item.id ? "default" : "ghost"
                          }
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            onSectionChange(item.id);
                            if (window.innerWidth < 1024) onToggle();
                          }}>
                          <item.icon className="mr-2 h-3 w-3" />
                          {item.label}
                        </Button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Collapsible>

              <Collapsible
                open={openSubMenus.includes("purchase")}
                onOpenChange={() => toggleSubMenu("purchase")}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <Package className="mr-2 h-4 w-4" />
                    Purchase
                    {openSubMenus.includes("purchase") ? (
                      <ChevronDown
                        className={`ml-auto h-4 w-4 transform transition-transform duration-300 ${
                          openSubMenus.includes("purchase")
                            ? "rotate-180"
                            : "rotate-0"
                        }`}
                      />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <AnimatePresence initial={false}>
                  {openSubMenus.includes("purchase") && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="space-y-1 ml-4 mt-1 overflow-hidden">
                      {purchase.map((item) => (
                        <Button
                          key={item.id}
                          variant={
                            activeSection === item.id ? "default" : "ghost"
                          }
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            onSectionChange(item.id);
                            if (window.innerWidth < 1024) onToggle();
                          }}>
                          <item.icon className="mr-2 h-3 w-3" />
                          {item.label}
                        </Button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Collapsible>

              <Collapsible
                open={openSubMenus.includes("inventory")}
                onOpenChange={() => toggleSubMenu("inventory")}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <Package className="mr-2 h-4 w-4" />
                    Inventory
                    {openSubMenus.includes("inventory") ? (
                      <ChevronDown
                        className={`ml-auto h-4 w-4 transform transition-transform duration-300 ${
                          openSubMenus.includes("inventory")
                            ? "rotate-180"
                            : "rotate-0"
                        }`}
                      />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <AnimatePresence initial={false}>
                  {openSubMenus.includes("inventory") && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="space-y-1 ml-4 mt-1 overflow-hidden">
                      {inventory.map((item) => (
                        <Button
                          key={item.id}
                          variant={
                            activeSection === item.id ? "default" : "ghost"
                          }
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            onSectionChange(item.id);
                            if (window.innerWidth < 1024) onToggle();
                          }}>
                          <item.icon className="mr-2 h-3 w-3" />
                          {item.label}
                        </Button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Collapsible>

              <Collapsible
                open={openSubMenus.includes("stock-transfer")}
                onOpenChange={() => toggleSubMenu("stock-transfer")}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <Package className="mr-2 h-4 w-4" />
                    Stock Transfer
                    {openSubMenus.includes("stock-transfer") ? (
                      <ChevronDown
                        className={`ml-auto h-4 w-4 transform transition-transform duration-300 ${
                          openSubMenus.includes("stock-transfer")
                            ? "rotate-180"
                            : "rotate-0"
                        }`}
                      />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <AnimatePresence initial={false}>
                  {openSubMenus.includes("stock-transfer") && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="space-y-1 ml-4 mt-1 overflow-hidden">
                      {stockTransfer.map((item) => (
                        <Button
                          key={item.id}
                          variant={
                            activeSection === item.id ? "default" : "ghost"
                          }
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            onSectionChange(item.id);
                            if (window.innerWidth < 1024) onToggle();
                          }}>
                          <item.icon className="mr-2 h-3 w-3" />
                          {item.label}
                        </Button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Collapsible>

              <Collapsible
                open={openSubMenus.includes("maintenance")}
                onOpenChange={() => toggleSubMenu("maintenance")}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Maintenance
                    {openSubMenus.includes("maintenance") ? (
                      <ChevronDown
                        className={`ml-auto h-4 w-4 transform transition-transform duration-300 ${
                          openSubMenus.includes("maintenance")
                            ? "rotate-180"
                            : "rotate-0"
                        }`}
                      />
                    ) : (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <AnimatePresence initial={false}>
                  {openSubMenus.includes("maintenance") && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="space-y-1 ml-4 mt-1 overflow-hidden">
                      {maintenanceItems.map((item) => (
                        <Button
                          key={item.id}
                          variant={
                            activeSection === item.id ? "default" : "ghost"
                          }
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => {
                            onSectionChange(item.id);
                            if (window.innerWidth < 1024) onToggle();
                          }}>
                          <item.icon className="mr-2 h-3 w-3" />
                          {item.label}
                        </Button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Collapsible>
            </nav>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );
}
