"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
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
  Tags,
  CodeSquare,
  BarChart2,
} from "lucide-react";

interface SidebarProps {
  userRole: "SYSTEM_ADMIN" | "MANAGER" | "USER";
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles?: ("SYSTEM_ADMIN" | "MANAGER" | "USER")[];
  subItems?: MenuItem[];
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

  // Define all menus with roles
  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["SYSTEM_ADMIN", "MANAGER", "USER"],
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      roles: ["SYSTEM_ADMIN", "MANAGER"],
    },
    {
      id: "users",
      label: "User Management",
      icon: Users,
      roles: ["SYSTEM_ADMIN"],
    },

    {
      id: "accounting",
      label: "Accounting",
      icon: Banknote,
      roles: ["SYSTEM_ADMIN", "MANAGER"],
      subItems: [
        {
          id: "accounts-payable",
          label: "Accounts Payable",
          icon: Banknote,
          roles: ["SYSTEM_ADMIN", "MANAGER"],
        },
        {
          id: "accounts-receivable",
          label: "Accounts Receivable",
          icon: FileText,
          roles: ["SYSTEM_ADMIN", "MANAGER"],
        },
      ],
    },

    {
      id: "inventory",
      label: "Inventory",
      icon: Package,
      roles: ["SYSTEM_ADMIN", "MANAGER"],
      subItems: [
        {
          id: "inventory-summary",
          label: "Inventory Summary",
          icon: Boxes,
          roles: ["SYSTEM_ADMIN", "MANAGER"],
        },
        {
          id: "inventory-tracker",
          label: "Inventory Tracker",
          icon: ClipboardList,
          roles: ["SYSTEM_ADMIN", "MANAGER"],
        },
        {
          id: "inventory-adjustment",
          label: "Inventory Adjustment",
          icon: FileEdit,
          roles: ["SYSTEM_ADMIN"],
        },
      ],
    },

    {
      id: "purchase",
      label: "Purchase",
      icon: Package,
      roles: ["SYSTEM_ADMIN", "MANAGER"],
      subItems: [
        {
          id: "purchase-order",
          label: "Purchase Order",
          icon: ShoppingCart,
          roles: ["SYSTEM_ADMIN", "MANAGER"],
        },
        {
          id: "purchase-receipt",
          label: "Purchase Receipt",
          icon: Receipt,
          roles: ["SYSTEM_ADMIN", "MANAGER"],
        },
        {
          id: "purchase-return",
          label: "Purchase Return",
          icon: Undo2,
          roles: ["SYSTEM_ADMIN"],
        },
      ],
    },

    {
      id: "sales",
      label: "Sales",
      icon: ShoppingCart,
      roles: ["SYSTEM_ADMIN", "MANAGER"],
      subItems: [
        {
          id: "sales-order",
          label: "Sales Order",
          icon: ShoppingCart,
          roles: ["SYSTEM_ADMIN", "MANAGER"],
        },
        {
          id: "delivery",
          label: "Delivery",
          icon: Truck,
          roles: ["SYSTEM_ADMIN", "MANAGER"],
        },
        {
          id: "sales-invoice",
          label: "Sales Invoice",
          icon: FileText,
          roles: ["SYSTEM_ADMIN", "MANAGER"],
        },
      ],
    },

    {
      id: "stock-transfer",
      label: "Stock Transfer",
      icon: Package,
      roles: ["SYSTEM_ADMIN", "MANAGER"],
      subItems: [
        {
          id: "transfer-request",
          label: "Transfer Request",
          icon: Truck,
          roles: ["SYSTEM_ADMIN", "MANAGER"],
        },
        {
          id: "transfer-approved",
          label: "Transfer Approved",
          icon: CheckCircle,
          roles: ["SYSTEM_ADMIN", "MANAGER"],
        },
      ],
    },

    {
      id: "maintenance",
      label: "Maintenance",
      icon: Settings,
      roles: ["SYSTEM_ADMIN"],
      subItems: [
        {
          id: "account-class",
          label: "Account Class",
          icon: Banknote,
          roles: ["SYSTEM_ADMIN"],
        },
        {
          id: "account-codes",
          label: "Account Codes",
          icon: Tags,
          roles: ["SYSTEM_ADMIN"],
        },
        {
          id: "atc-codes",
          label: "ATC Codes",
          icon: CodeSquare,
          roles: ["SYSTEM_ADMIN"],
        },
        {
          id: "bank",
          label: "Bank",
          icon: Building2,
          roles: ["SYSTEM_ADMIN"],
        },
        {
          id: "chart-of-account",
          label: "Chart of Account",
          icon: BarChart2,
          roles: ["SYSTEM_ADMIN"],
        },
        {
          id: "customer",
          label: "Customer",
          icon: Users,
          roles: ["SYSTEM_ADMIN"],
        },
        {
          id: "customer-group",
          label: "Customer Group",
          icon: UserCheck,
          roles: ["SYSTEM_ADMIN"],
        },
        {
          id: "item-class",
          label: "Item Class",
          icon: Shapes,
          roles: ["SYSTEM_ADMIN"],
        },
        {
          id: "item-master",
          label: "Item Master",
          icon: Package,
          roles: ["SYSTEM_ADMIN"],
        },
        {
          id: "price-list",
          label: "Price List",
          icon: DollarSign,
          roles: ["SYSTEM_ADMIN"],
        },
        {
          id: "production",
          label: "Production",
          icon: Factory,
          roles: ["SYSTEM_ADMIN"],
        },
        {
          id: "sales-person",
          label: "Sales Person",
          icon: UserCircle,
          roles: ["SYSTEM_ADMIN"],
        },
        {
          id: "supplier",
          label: "Supplier",
          icon: Truck,
          roles: ["SYSTEM_ADMIN"],
        },
        { id: "tax", label: "Tax", icon: Receipt, roles: ["SYSTEM_ADMIN"] },
        {
          id: "unit-measure",
          label: "Unit of Measure",
          icon: Ruler,
          roles: ["SYSTEM_ADMIN"],
        },
        {
          id: "warehouse",
          label: "Warehouse",
          icon: Warehouse,
          roles: ["SYSTEM_ADMIN"],
        },
      ],
    },
  ];

  // Filter items by userRole
  const visibleMenuItems = menuItems.filter((item) => {
    // Only SYSTEM_ADMIN can see "users" (User Management)
    if (item.id === "admin") return userRole === "SYSTEM_ADMIN";
    // All other items are accessible by all roles
    return true;
  });

  const renderMenuItem = (item: MenuItem) => {
    if (item.subItems) {
      const isOpen = openSubMenus.includes(item.id);
      return (
        <Collapsible
          key={item.id}
          open={isOpen}
          onOpenChange={() => toggleSubMenu(item.id)}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-start">
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
              {isOpen ? (
                <ChevronDown className="ml-auto h-4 w-4" />
              ) : (
                <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="space-y-1 ml-4 mt-1 overflow-hidden">
                {item.subItems
                  .filter((sub) => sub.roles?.includes(userRole))
                  .map((sub) => (
                    <Button
                      key={sub.id}
                      variant={activeSection === sub.id ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => onSectionChange(sub.id)}>
                      <sub.icon className="mr-2 h-3 w-3" />
                      {sub.label}
                    </Button>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </Collapsible>
      );
    }

    return (
      <Button
        key={item.id}
        variant={activeSection === item.id ? "default" : "ghost"}
        className="w-full justify-start"
        onClick={() => onSectionChange(item.id)}>
        <item.icon className="mr-2 h-4 w-4" />
        {item.label}
      </Button>
    );
  };

  return (
    <div
      className={`fixed left-0 top-0 z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
        ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:static lg:z-auto`}>
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

      <ScrollArea className="h-[calc(100vh-140px)] p-4">
        <nav className="space-y-2">{visibleMenuItems.map(renderMenuItem)}</nav>
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
  );
}
