import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

// Mock data - replace with MongoDB data
const salesData = [
  { month: "Jan", sales: 65000, purchase: 45000 },
  { month: "Feb", sales: 59000, purchase: 52000 },
  { month: "Mar", sales: 80000, purchase: 48000 },
  { month: "Apr", sales: 81000, purchase: 61000 },
  { month: "May", sales: 56000, purchase: 55000 },
  { month: "Jun", sales: 75000, purchase: 40000 },
];

const inventoryData = [
  { month: "Jan", value: 120000 },
  { month: "Feb", value: 115000 },
  { month: "Mar", value: 130000 },
  { month: "Apr", value: 125000 },
  { month: "May", value: 140000 },
  { month: "Jun", value: 135000 },
];

const lowStockItems = [
  { name: "Product A", current: 5, minimum: 20, status: "critical" },
  { name: "Product B", current: 12, minimum: 25, status: "low" },
  { name: "Product C", current: 8, minimum: 15, status: "critical" },
  { name: "Product D", current: 18, minimum: 30, status: "low" },
];

const recentTransactions = [
  {
    id: "TXN001",
    type: "Sale",
    amount: 2500,
    customer: "ABC Corp",
    date: "2024-01-15",
    status: "completed",
  },
  {
    id: "TXN002",
    type: "Purchase",
    amount: 1800,
    supplier: "XYZ Supplies",
    date: "2024-01-14",
    status: "pending",
  },
  {
    id: "TXN003",
    type: "Sale",
    amount: 3200,
    customer: "Tech Solutions",
    date: "2024-01-13",
    status: "completed",
  },
  {
    id: "TXN004",
    type: "Purchase",
    amount: 950,
    supplier: "Global Parts",
    date: "2024-01-12",
    status: "completed",
  },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$416,000</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,254</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8.2%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inventory Value
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$135,000</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">+5.1%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Customers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15 new</span> this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales vs Purchase</CardTitle>
            <CardDescription>
              Monthly comparison of sales and purchases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#3b82f6" name="Sales" />
                <Bar dataKey="purchase" fill="#ef4444" name="Purchase" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Value Trend</CardTitle>
            <CardDescription>Monthly inventory value over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>Items that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {item.current} | Minimum: {item.minimum}
                    </p>
                    <Progress
                      value={(item.current / item.minimum) * 100}
                      className="mt-2 h-2"
                    />
                  </div>
                  <Badge
                    variant={
                      item.status === "critical" ? "destructive" : "outline"
                    }>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Latest sales and purchase activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        transaction.type === "Sale"
                          ? "bg-green-100"
                          : "bg-blue-100"
                      }`}>
                      {transaction.type === "Sale" ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <Package className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.type === "Sale"
                          ? transaction.customer
                          : transaction.supplier}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ${transaction.amount.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1">
                      {transaction.status === "completed" ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <Clock className="h-3 w-3 text-yellow-500" />
                      )}
                      <Badge
                        variant={
                          transaction.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
