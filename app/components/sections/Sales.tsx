// "use client";

// import React, { useState } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "../ui/card";
// import { Button } from "../ui/button";
// import { Input } from "../ui/input";
// import { Label } from "../ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../ui/table";
// import { Badge } from "../ui/badge";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "../ui/dialog";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
// import { Plus, Search, Eye, Edit, Trash2, Download } from "lucide-react";

// // Mock data - replace with MongoDB data
// const salesOrders = [
//   {
//     id: "SO001",
//     customer: "ABC Corporation",
//     date: "2024-01-15",
//     amount: 15250.0,
//     status: "completed",
//     items: 3,
//   },
//   {
//     id: "SO002",
//     customer: "Tech Solutions Ltd",
//     date: "2024-01-14",
//     amount: 8900.0,
//     status: "pending",
//     items: 2,
//   },
//   {
//     id: "SO003",
//     customer: "Global Industries",
//     date: "2024-01-13",
//     amount: 22450.0,
//     status: "shipped",
//     items: 5,
//   },
//   {
//     id: "SO004",
//     customer: "Quick Mart",
//     date: "2024-01-12",
//     amount: 3200.0,
//     status: "cancelled",
//     items: 1,
//   },
// ];

// const customers = [
//   { id: "C001", name: "ABC Corporation" },
//   { id: "C002", name: "Tech Solutions Ltd" },
//   { id: "C003", name: "Global Industries" },
//   { id: "C004", name: "Quick Mart" },
// ];

// const products = [
//   { id: "P001", name: "Product A", price: 250.0, stock: 150 },
//   { id: "P002", name: "Product B", price: 180.0, stock: 200 },
//   { id: "P003", name: "Product C", price: 320.0, stock: 75 },
//   { id: "P004", name: "Product D", price: 450.0, stock: 100 },
// ];

// export function Sales() {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
//   const [selectedItems, setSelectedItems] = useState<any[]>([]);

//   const filteredOrders = salesOrders.filter((order) => {
//     const matchesSearch =
//       order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       order.id.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesStatus =
//       statusFilter === "all" || order.status === statusFilter;
//     return matchesSearch && matchesStatus;
//   });

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "completed":
//         return "default";
//       case "pending":
//         return "secondary";
//       case "shipped":
//         return "outline";
//       case "cancelled":
//         return "destructive";
//       default:
//         return "secondary";
//     }
//   };

//   const addItemToOrder = (product: any) => {
//     const existingItem = selectedItems.find((item) => item.id === product.id);
//     if (existingItem) {
//       setSelectedItems((prev) =>
//         prev.map((item) =>
//           item.id === product.id
//             ? { ...item, quantity: item.quantity + 1 }
//             : item
//         )
//       );
//     } else {
//       setSelectedItems((prev) => [...prev, { ...product, quantity: 1 }]);
//     }
//   };

//   const removeItemFromOrder = (productId: string) => {
//     setSelectedItems((prev) => prev.filter((item) => item.id !== productId));
//   };

//   const updateQuantity = (productId: string, quantity: number) => {
//     if (quantity <= 0) {
//       removeItemFromOrder(productId);
//       return;
//     }
//     setSelectedItems((prev) =>
//       prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
//     );
//   };

//   const getTotalAmount = () => {
//     return selectedItems.reduce(
//       (total, item) => total + item.price * item.quantity,
//       0
//     );
//   };

//   return (
//     <div className="space-y-6">
//       <Tabs defaultValue="orders" className="w-full">
//         <TabsList>
//           <TabsTrigger value="orders">Sales Orders</TabsTrigger>
//           <TabsTrigger value="invoices">Invoices</TabsTrigger>
//           <TabsTrigger value="reports">Sales Reports</TabsTrigger>
//         </TabsList>

//         <TabsContent value="orders" className="space-y-4">
//           <Card>
//             <CardHeader>
//               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//                 <div>
//                   <CardTitle>Sales Orders</CardTitle>
//                   <CardDescription>
//                     Manage customer orders and sales
//                   </CardDescription>
//                 </div>
//                 <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
//                   <DialogTrigger asChild>
//                     <Button>
//                       <Plus className="mr-2 h-4 w-4" />
//                       New Order
//                     </Button>
//                   </DialogTrigger>
//                   <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
//                     <DialogHeader>
//                       <DialogTitle>Create New Sales Order</DialogTitle>
//                       <DialogDescription>
//                         Add a new sales order for a customer
//                       </DialogDescription>
//                     </DialogHeader>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div className="space-y-4">
//                         <div>
//                           <Label htmlFor="customer">Customer</Label>
//                           <Select>
//                             <SelectTrigger>
//                               <SelectValue placeholder="Select customer" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               {customers.map((customer) => (
//                                 <SelectItem
//                                   key={customer.id}
//                                   value={customer.id}>
//                                   {customer.name}
//                                 </SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                         </div>
//                         <div>
//                           <Label htmlFor="date">Order Date</Label>
//                           <Input type="date" id="date" />
//                         </div>
//                         <div>
//                           <Label>Products</Label>
//                           <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
//                             {products.map((product) => (
//                               <div
//                                 key={product.id}
//                                 className="flex justify-between items-center py-2 border-b last:border-b-0">
//                                 <div>
//                                   <p className="font-medium">{product.name}</p>
//                                   <p className="text-sm text-muted-foreground">
//                                     ${product.price} (Stock: {product.stock})
//                                   </p>
//                                 </div>
//                                 <Button
//                                   size="sm"
//                                   onClick={() => addItemToOrder(product)}>
//                                   Add
//                                 </Button>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </div>
//                       <div className="space-y-4">
//                         <Label>Selected Items</Label>
//                         <div className="border rounded-lg p-4 min-h-60">
//                           {selectedItems.length === 0 ? (
//                             <p className="text-muted-foreground text-center py-8">
//                               No items selected
//                             </p>
//                           ) : (
//                             <div className="space-y-3">
//                               {selectedItems.map((item) => (
//                                 <div
//                                   key={item.id}
//                                   className="flex justify-between items-center p-2 border rounded">
//                                   <div className="flex-1">
//                                     <p className="font-medium">{item.name}</p>
//                                     <p className="text-sm text-muted-foreground">
//                                       ${item.price} each
//                                     </p>
//                                   </div>
//                                   <div className="flex items-center gap-2">
//                                     <Input
//                                       type="number"
//                                       value={item.quantity}
//                                       onChange={(e) =>
//                                         updateQuantity(
//                                           item.id,
//                                           parseInt(e.target.value)
//                                         )
//                                       }
//                                       className="w-16"
//                                       min="1"
//                                     />
//                                     <Button
//                                       size="sm"
//                                       variant="destructive"
//                                       onClick={() =>
//                                         removeItemFromOrder(item.id)
//                                       }>
//                                       <Trash2 className="h-3 w-3" />
//                                     </Button>
//                                   </div>
//                                 </div>
//                               ))}
//                               <div className="border-t pt-3 mt-3">
//                                 <div className="flex justify-between items-center font-semibold">
//                                   <span>Total Amount:</span>
//                                   <span>${getTotalAmount().toFixed(2)}</span>
//                                 </div>
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                         <div className="flex gap-2">
//                           <Button
//                             className="flex-1"
//                             disabled={selectedItems.length === 0}>
//                             Create Order
//                           </Button>
//                           <Button
//                             variant="outline"
//                             onClick={() => setIsNewOrderOpen(false)}>
//                             Cancel
//                           </Button>
//                         </div>
//                       </div>
//                     </div>
//                   </DialogContent>
//                 </Dialog>
//               </div>
//             </CardHeader>
//             <CardContent>
//               <div className="flex flex-col sm:flex-row gap-4 mb-4">
//                 <div className="relative flex-1">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//                   <Input
//                     placeholder="Search orders..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="pl-10"
//                   />
//                 </div>
//                 <Select value={statusFilter} onValueChange={setStatusFilter}>
//                   <SelectTrigger className="w-full sm:w-48">
//                     <SelectValue />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Status</SelectItem>
//                     <SelectItem value="pending">Pending</SelectItem>
//                     <SelectItem value="completed">Completed</SelectItem>
//                     <SelectItem value="shipped">Shipped</SelectItem>
//                     <SelectItem value="cancelled">Cancelled</SelectItem>
//                   </SelectContent>
//                 </Select>
//               </div>

//               <div className="rounded-md border overflow-x-auto">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Order ID</TableHead>
//                       <TableHead>Customer</TableHead>
//                       <TableHead>Date</TableHead>
//                       <TableHead>Items</TableHead>
//                       <TableHead>Amount</TableHead>
//                       <TableHead>Status</TableHead>
//                       <TableHead className="text-right">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredOrders.map((order) => (
//                       <TableRow key={order.id}>
//                         <TableCell className="font-medium">
//                           {order.id}
//                         </TableCell>
//                         <TableCell>{order.customer}</TableCell>
//                         <TableCell>{order.date}</TableCell>
//                         <TableCell>{order.items}</TableCell>
//                         <TableCell>${order.amount.toFixed(2)}</TableCell>
//                         <TableCell>
//                           <Badge variant={getStatusColor(order.status)}>
//                             {order.status}
//                           </Badge>
//                         </TableCell>
//                         <TableCell className="text-right">
//                           <div className="flex justify-end space-x-2">
//                             <Button variant="ghost" size="sm">
//                               <Eye className="h-4 w-4" />
//                             </Button>
//                             <Button variant="ghost" size="sm">
//                               <Edit className="h-4 w-4" />
//                             </Button>
//                             <Button variant="ghost" size="sm">
//                               <Download className="h-4 w-4" />
//                             </Button>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="invoices">
//           <Card>
//             <CardHeader>
//               <CardTitle>Sales Invoices</CardTitle>
//               <CardDescription>
//                 Manage customer invoices and billing
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <p className="text-muted-foreground">
//                 Sales invoices management will be implemented here.
//               </p>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="reports">
//           <Card>
//             <CardHeader>
//               <CardTitle>Sales Reports</CardTitle>
//               <CardDescription>
//                 View sales analytics and reports
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <p className="text-muted-foreground">
//                 Sales reports and analytics will be implemented here.
//               </p>
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>
//     </div>
//   );
// }

export function Sales() {
  return <h1>Sales</h1>;
}
