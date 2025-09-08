import React from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Menu, Bell } from "lucide-react";

interface HeaderProps {
  userEmail: string;
  userRole: "admin" | "user";
  activeSection: string;
  onToggleSidebar: () => void;
}

export function Header({
  userEmail,
  userRole,
  activeSection,
  onToggleSidebar,
}: HeaderProps) {
  const getSectionTitle = (section: string) => {
    const titles: Record<string, string> = {
      dashboard: "Dashboard",
      sales: "Sales ",
      purchase: "Purchase",
      inventory: "Inventory",
      reports: "Reports & Analytics",
      bank: "Bank",
      customer: "Customer",
      "customer-type": "Customer Type",
      "item-class": "Item Class",
      "item-master": "Item Master",
      "price-list": "Price List",
      "sales-person": "Sales Person",
      supplier: "Supplier",
      tax: "Tax",
      "unit-measure": "Unit of Measure",
      users: "User",
      warehouse: "Warehouse",
    };
    return titles[section] || "Inventory Management System";
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {getSectionTitle(activeSection)}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              3
            </span>
          </Button>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{userEmail}</p>
              <Badge
                variant={userRole === "admin" ? "default" : "secondary"}
                className="text-xs">
                {userRole.toUpperCase()}
              </Badge>
            </div>
            <Avatar>
              <AvatarFallback className="bg-blue-500 text-white">
                {userEmail.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
