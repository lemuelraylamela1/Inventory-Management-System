// "use client";

// import React, { useState, useEffect } from "react";

// import { useRouter } from "next/navigation";

// import Image from "next/image";

// import { Eye } from "lucide-react";
// import ImageUploader from "./ImageUploader";

// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../../ui/select";
// import { Input } from "../../ui/input";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
// import { Button } from "../../ui/button";
// import { Textarea } from "../../ui/textarea";
// import { Label } from "../../ui/label";

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "../../ui/dialog";
// import { Card, CardContent } from "../../ui/card";

// export default function AddNew({
//   isOpen,
//   onOpenChange,
//   onSuccess,
// }: {
//   isOpen: boolean;
//   onOpenChange: (open: boolean) => void;
//   onSuccess?: () => void;
// }) {
//   const router = useRouter();
//   const [item_code, setItemCode] = useState("");
//   const [item_name, setItemName] = useState("");
//   const [item_description, setItemDescription] = useState("");
//   const [purchasePrice, setPurchasePrice] = useState("");
//   const [salesPrice, setSalesPrice] = useState("");
//   const [item_category, setItemCategory] = useState("");
//   const [item_status, setItemStatus] = useState("ACTIVE");
//   const [weight, setWeight] = useState("");
//   const [length, setLength] = useState("");
//   const [width, setWidth] = useState("");
//   const [height, setHeight] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
//   const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
//   const [error, setError] = useState("");
//   const [isFormOpen, setIsFormOpen] = useState(false);

//   useEffect(() => {
//     return () => {
//       resetFormState();
//     };
//   }, []);

//   const resetFormState = () => {
//     setItemCode("");
//     setItemName("");
//     setItemDescription("");
//     setItemCategory("");
//     setItemStatus("");
//     setLength("");
//     setWidth("");
//     setHeight("");
//     setWeight("");
//     setPurchasePrice("");
//     setSalesPrice("");
//     setSelectedFile(null);
//     setUploadedFiles([]);
//     setError("");
//     setFieldErrors({});
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     const validateFields = (): Record<string, string> => {
//       const errors: Record<string, string> = {};

//       if (!item_code.trim()) {
//         errors.item_code = "Item code is required.";
//       } else {
//         // Check for duplicate code (note: replace this client-side stub with a server-side/actual check)
//         const items: Array<{ itemCode?: string }> = [];
//         const duplicateCode = items.find(
//           (item) => item.itemCode?.toLowerCase() === item_code.toLowerCase()
//         );

//         if (duplicateCode) {
//           errors.item_code = "Item Code already exists";
//         }
//       }

//       if (!item_name.trim()) {
//         errors.item_name = "Item name is required.";
//       } else {
//         // Check for duplicate name (note: replace this client-side stub with a server-side/actual check)
//         const items: Array<{ itemName?: string }> = [];
//         const duplicateName = items.find(
//           (item) => item.itemName?.toLowerCase() === item_name.toLowerCase()
//         );

//         if (duplicateName) {
//           errors.item_name = "Item Name already exists";
//         }
//       }

//       if (!item_description.trim())
//         errors.item_description = "Description is required.";

//       if (!purchasePrice || parseFloat(purchasePrice) <= 0)
//         errors.purchasePrice = "Purchase price must be greater than 0.";

//       if (!salesPrice || parseFloat(salesPrice) <= 0)
//         errors.salesPrice = "Selling price must be greater than 0.";

//       if (!item_status) errors.item_status = "Status is required.";
//       if (!item_category) errors.item_category = "Category is required.";

//       if (!length.trim()) {
//         errors.length = "Length is required.";
//       } else if (!/^\d*\.?\d*$/.test(length)) {
//         errors.length = "Only numeric values allowed.";
//       }

//       if (!width.trim()) {
//         errors.width = "Width is required.";
//       } else if (!/^\d*\.?\d*$/.test(width)) {
//         errors.width = "Only numeric values allowed.";
//       }

//       if (!height.trim()) {
//         errors.height = "Height is required.";
//       } else if (!/^\d*\.?\d*$/.test(height)) {
//         errors.height = "Only numeric values allowed.";
//       }

//       if (!weight.trim()) {
//         errors.weight = "Weight is required.";
//       } else if (!/^\d*\.?\d*$/.test(weight)) {
//         errors.weight = "Only numeric values allowed.";
//       }

//       return errors;
//     };

//     e.preventDefault();
//     setIsSubmitting(true);
//     setError(""); // Clear previous error

//     const errors = validateFields();
//     if (Object.keys(errors).length > 0) {
//       setFieldErrors(errors); // ✅ no type mismatch
//       setError("Please fill out all required fields correctly.");
//       setIsSubmitting(false);
//       return;
//     }

//     setFieldErrors({});

//     let imageUrl = "";

//     if (selectedFile) {
//       const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
//       const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
//       if (!cloudName || !uploadPreset) {
//         throw new Error("Missing Cloudinary env variables");
//       }

//       const formData = new FormData();
//       formData.append("file", selectedFile);
//       formData.append("upload_preset", uploadPreset);

//       const res = await fetch(
//         `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
//         {
//           method: "POST",
//           body: formData,
//         }
//       );

//       const data = await res.json();
//       if (data.secure_url) {
//         imageUrl = data.secure_url;
//       }
//     }

//     const payload = {
//       createdDT: new Date().toISOString(),
//       item_code,
//       item_name,
//       item_description,
//       purchasePrice: purchasePrice
//         ? parseFloat(parseFloat(purchasePrice).toFixed(2))
//         : 0.0,
//       salesPrice: salesPrice
//         ? parseFloat(parseFloat(salesPrice).toFixed(2))
//         : 0.0,
//       item_category,
//       item_status,
//       imageUrl,
//       length: length ? parseFloat(length) : 0,
//       width: width ? parseFloat(width) : 0,
//       height: height ? parseFloat(height) : 0,
//       weight: weight ? parseFloat(weight) : 0,
//     };

//     console.log("Creating item:", payload);

//     try {
//       const res = await fetch("http://localhost:3000/api/items", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       if (res.ok) {
//         if (typeof onSuccess === "function") {
//           onSuccess();
//         }

//         setTimeout(() => {
//           router.push("/");
//         }, 300);

//         // ✅ Reset form fields
//         setItemCode("");
//         setItemName("");
//         setItemDescription("");
//         setItemCategory("");
//         setItemStatus("");
//         setLength("");
//         setWidth("");
//         setHeight("");
//         setWeight("");
//         setPurchasePrice("");
//         setSalesPrice("");
//         setSelectedFile(null);
//         setUploadedFiles([]);
//       } else {
//         throw new Error("Failed to create item");
//       }
//     } catch (error) {
//       console.error("Error submitting item:", error);
//       setError("Submission failed. Please try again.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const formatFileSize = (bytes: number) => {
//     if (bytes === 0) return "0 Bytes";
//     const k = 1024;
//     const sizes = ["Bytes", "KB", "MB", "GB"];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             Add Items
//           </DialogTitle>
//         </DialogHeader>

//         <Tabs defaultValue="upload" className="w-full">
//           <TabsList className="grid w-full grid-cols-3">
//             <TabsTrigger value="upload" className="flex items-center gap-2">
//               Item Details
//             </TabsTrigger>
//             <TabsTrigger value="settings" className="flex items-center gap-2">
//               Unit of Measure
//             </TabsTrigger>
//             <TabsTrigger value="preview" className="flex items-center gap-2">
//               Accounting Details
//             </TabsTrigger>
//           </TabsList>
//           {error && (
//             <div
//               className="flex items-start gap-2 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-md shadow-sm"
//               role="alert">
//               <svg
//                 className="w-5 h-5 mt-0.5 text-red-500 shrink-0"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor">
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M12 9v2m0 4h.01M4.93 4.93a10 10 0 0114.14 0M4.93 19.07a10 10 0 010-14.14"
//                 />
//               </svg>
//               <span className="text-sm leading-relaxed">{error}</span>
//             </div>
//           )}
//           <form onSubmit={handleSubmit} className="mt-6" noValidate>
//             <TabsContent value="upload" className="space-y-6 mt-0">
//               {/* Image Upload Area */}
//               <div className="space-y-2">
//                 <ImageUploader onSelect={(file) => setSelectedFile(file)} />
//               </div>

//               {/* Form Fields */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div
//                   className={`w-full ${
//                     !item_code.trim() ? "border-red-500" : ""
//                   }`}>
//                   <Label htmlFor="item-code">
//                     Item Code<span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     id="item-code"
//                     value={item_code}
//                     onChange={(e) => setItemCode(e.target.value)}
//                     placeholder="Enter item code"
//                     className={`w-full ${
//                       fieldErrors.item_code ? "border-red-500 ring-red-500" : ""
//                     }`}
//                   />
//                   {fieldErrors.item_code && (
//                     <p className="text-sm text-red-500 mt-1">
//                       Item code is required.
//                     </p>
//                   )}
//                 </div>

//                 <div
//                   className={`w-full ${
//                     !item_name.trim() ? "border-red-500" : ""
//                   }`}>
//                   <Label htmlFor="item-name">
//                     Item Name<span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     id="item-name"
//                     value={item_name}
//                     onChange={(e) => setItemName(e.target.value)}
//                     placeholder="Enter item name"
//                     className={`w-full ${
//                       fieldErrors.item_name ? "border-red-500 ring-red-500" : ""
//                     }`}
//                   />
//                   {fieldErrors.item_name && (
//                     <p className="text-sm text-red-500 mt-1">
//                       Item name is required.
//                     </p>
//                   )}
//                 </div>
//                 <div
//                   className={`w-full ${
//                     !purchasePrice.trim() ? "border-red-500" : ""
//                   }`}>
//                   <Label htmlFor="item-price">
//                     Purchase Price<span className="text-red-500">*</span>
//                   </Label>
//                   <div className="flex items-center space-x-2">
//                     <span className="text-lg">₱</span>
//                     <Input
//                       id="item-purchase-price"
//                       type="number"
//                       step="0.01"
//                       value={purchasePrice}
//                       onChange={(e) => setPurchasePrice(e.target.value)}
//                       placeholder="0.00"
//                       className={`w-full ${
//                         fieldErrors.purchasePrice
//                           ? "border-red-500 ring-red-500"
//                           : ""
//                       }`}
//                     />
//                   </div>
//                   {fieldErrors.purchasePrice && (
//                     <p className="text-sm text-red-500 mt-1">
//                       Purchase price is required.
//                     </p>
//                   )}
//                 </div>
//                 <div
//                   className={`w-full ${
//                     !salesPrice.trim() ? "border-red-500" : ""
//                   }`}>
//                   <Label htmlFor="item-price">
//                     Sales Price<span className="text-red-500">*</span>
//                   </Label>
//                   <div className="flex items-center space-x-2">
//                     <span className="text-lg">₱</span>
//                     <Input
//                       id="item-sales-price"
//                       type="number"
//                       step="0.01"
//                       value={salesPrice}
//                       onChange={(e) => setSalesPrice(e.target.value)}
//                       placeholder="0.00"
//                       className={`w-full ${
//                         fieldErrors.salesPrice
//                           ? "border-red-500 ring-red-500"
//                           : ""
//                       }`}
//                     />
//                   </div>
//                   {fieldErrors.salesPrice && (
//                     <p className="text-sm text-red-500 mt-1">
//                       Selling price is required.
//                     </p>
//                   )}
//                 </div>
//               </div>

//               <div
//                 className={`w-full ${
//                   !item_description.trim() ? "border-red-500" : ""
//                 }`}>
//                 <Label htmlFor="item-description">
//                   Item Description<span className="text-red-500">*</span>
//                 </Label>
//                 <Textarea
//                   id="item-description"
//                   value={item_description}
//                   onChange={(e) => setItemDescription(e.target.value)}
//                   placeholder="Enter item description"
//                   className={`w-full ${
//                     fieldErrors.item_description
//                       ? "border-red-500 ring-red-500"
//                       : ""
//                   }`}
//                 />
//                 {fieldErrors.item_description && (
//                   <p className="text-sm text-red-500 mt-1">
//                     Description is required.
//                   </p>
//                 )}
//               </div>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div
//                   className={`w-full ${
//                     !item_category.trim() ? "border-red-500" : ""
//                   }`}>
//                   <Label htmlFor="item-category">
//                     Category<span className="text-red-500">*</span>
//                   </Label>
//                   <Select value={item_category} onValueChange={setItemCategory}>
//                     <SelectTrigger
//                       id="item-category"
//                       className={`w-full ${
//                         fieldErrors.item_category
//                           ? "border-red-500 ring-red-500"
//                           : ""
//                       }`}>
//                       <SelectValue placeholder="Select category" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="JELLY">Jelly</SelectItem>
//                       <SelectItem value="CHOCOLATE">Chocolate</SelectItem>
//                       <SelectItem value="IMPORTED CANDIES">
//                         Imported Candies
//                       </SelectItem>
//                     </SelectContent>
//                   </Select>
//                   {fieldErrors.item_category && (
//                     <p className="text-sm text-red-500 mt-1">
//                       Category is required.
//                     </p>
//                   )}
//                 </div>

//                 <div
//                   className={`w-full ${
//                     !item_status.trim() ? "border-red-500" : ""
//                   }`}>
//                   <Label htmlFor="item-status">
//                     Status<span className="text-red-500">*</span>
//                   </Label>
//                   <Select value={item_status} onValueChange={setItemStatus}>
//                     <SelectTrigger
//                       id="item-status"
//                       className={`w-full ${
//                         fieldErrors.item_status
//                           ? "border-red-500 ring-red-500"
//                           : ""
//                       }`}>
//                       <SelectValue placeholder="Select status" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem
//                         value="ACTIVE"
//                         className="flex items-center gap-2 text-green-700">
//                         <span className="w-2 h-2 rounded-full bg-green-500" />
//                         Active
//                       </SelectItem>
//                       <SelectItem
//                         value="INACTIVE"
//                         className="flex items-center gap-2 text-red-700">
//                         <span className="w-2 h-2 rounded-full bg-red-500" />
//                         Inactive
//                       </SelectItem>
//                     </SelectContent>
//                   </Select>
//                   {fieldErrors.item_status && (
//                     <p className="text-sm text-red-500 mt-1">
//                       Status is required.
//                     </p>
//                   )}
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div
//                   className={`w-full ${
//                     !length.trim() ? "border-red-500" : ""
//                   }`}>
//                   <Label htmlFor="length">
//                     Length<span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     id="length"
//                     value={length}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       if (/^\d*\.?\d*$/.test(value)) {
//                         setLength(value);
//                         setFieldErrors((prev) => ({
//                           ...prev,
//                           length: !value.trim() ? "Length is required." : "",
//                         }));
//                       } else {
//                         setFieldErrors((prev) => ({
//                           ...prev,
//                           length: "Only numeric values are allowed.",
//                         }));
//                       }
//                     }}
//                     placeholder="Enter length"
//                     className={`w-full ${
//                       fieldErrors.length ? "border-red-500 ring-red-500" : ""
//                     }`}
//                   />
//                   {fieldErrors.length && (
//                     <p className="text-sm text-red-500 mt-1">
//                       {fieldErrors.length}
//                     </p>
//                   )}
//                 </div>

//                 <div
//                   className={`w-full ${!width.trim() ? "border-red-500" : ""}`}>
//                   <Label htmlFor="width">
//                     Width<span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     id="width"
//                     value={width}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       if (/^\d*\.?\d*$/.test(value)) {
//                         setWidth(value);
//                         setFieldErrors((prev) => ({
//                           ...prev,
//                           width: !value.trim() ? "Width is required." : "",
//                         }));
//                       } else {
//                         setFieldErrors((prev) => ({
//                           ...prev,
//                           width: "Only numeric values are allowed.",
//                         }));
//                       }
//                     }}
//                     placeholder="Enter width"
//                     className={`w-full ${
//                       fieldErrors.width ? "border-red-500 ring-red-500" : ""
//                     }`}
//                   />
//                   {fieldErrors.width && (
//                     <p className="text-sm text-red-500 mt-1">
//                       {fieldErrors.width}
//                     </p>
//                   )}
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div
//                   className={`w-full ${
//                     !height.trim() ? "border-red-500" : ""
//                   }`}>
//                   <Label htmlFor="height">
//                     Height<span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     id="height"
//                     value={height}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       if (/^\d*\.?\d*$/.test(value)) {
//                         setHeight(value);
//                         setFieldErrors((prev) => ({
//                           ...prev,
//                           height: !value.trim() ? "Height is required." : "",
//                         }));
//                       } else {
//                         setFieldErrors((prev) => ({
//                           ...prev,
//                           height: "Only numeric values are allowed.",
//                         }));
//                       }
//                     }}
//                     placeholder="Enter height"
//                     className={`w-full ${
//                       fieldErrors.height ? "border-red-500 ring-red-500" : ""
//                     }`}
//                   />
//                   {fieldErrors.height && (
//                     <p className="text-sm text-red-500 mt-1">
//                       {fieldErrors.height}
//                     </p>
//                   )}
//                 </div>

//                 <div
//                   className={`w-full ${
//                     !weight.trim() ? "border-red-500" : ""
//                   }`}>
//                   <Label htmlFor="item-weight">
//                     Weight<span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     id="item-weight"
//                     value={weight}
//                     onChange={(e) => {
//                       const value = e.target.value;
//                       if (/^\d*\.?\d*$/.test(value)) {
//                         setWeight(value);
//                         setFieldErrors((prev) => ({
//                           ...prev,
//                           weight: !value.trim() ? "Weight is required." : "",
//                         }));
//                       } else {
//                         setFieldErrors((prev) => ({
//                           ...prev,
//                           weight: "Only numeric values are allowed.",
//                         }));
//                       }
//                     }}
//                     placeholder="Enter weight"
//                     className={`w-full ${
//                       fieldErrors.weight ? "border-red-500 ring-red-500" : ""
//                     }`}
//                   />
//                   {fieldErrors.weight && (
//                     <p className="text-sm text-red-500 mt-1">
//                       {fieldErrors.weight}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </TabsContent>

//             <TabsContent value="settings" className="space-y-6 mt-0">
//               <div className="space-y-6">
//                 <div className="space-y-4">
//                   <h3>Upload Settings</h3>

//                   <div className="space-y-2">
//                     <Label>Default visibility</Label>
//                     <Select defaultValue="private">
//                       <SelectTrigger>
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="private">Private</SelectItem>
//                         <SelectItem value="public">Public</SelectItem>
//                         <SelectItem value="unlisted">Unlisted</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>

//                   <div className="flex items-center justify-between">
//                     <div className="space-y-1">
//                       <Label>Enable notifications</Label>
//                       <p className="text-sm text-muted-foreground">
//                         Get notified when upload processing is complete
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </TabsContent>

//             <TabsContent value="preview" className="space-y-6 mt-0">
//               <div className="space-y-4">
//                 <h3>Content Preview</h3>

//                 {uploadedFiles.length > 0 ? (
//                   <div className="space-y-4">
//                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//                       {uploadedFiles.slice(0, 6).map((file, index) => (
//                         <Card key={index} className="p-2">
//                           <CardContent className="p-0">
//                             <div className="aspect-square bg-muted rounded-md flex items-center justify-center mb-2">
//                               <Image
//                                 className="h-8 w-8 text-muted-foreground"
//                                 src={file.name}
//                                 alt={file.name}
//                                 width={300}
//                                 height={300}
//                               />
//                             </div>
//                             <p className="text-xs truncate">{file.name}</p>
//                             <p className="text-xs text-muted-foreground">
//                               {formatFileSize(file.size)}
//                             </p>
//                           </CardContent>
//                         </Card>
//                       ))}
//                     </div>
//                     {uploadedFiles.length > 6 && (
//                       <p className="text-sm text-muted-foreground text-center">
//                         +{uploadedFiles.length - 6} more files
//                       </p>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="text-center py-12 border-2 border-dashed rounded-lg">
//                     <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
//                       <Eye className="h-6 w-6 text-muted-foreground" />
//                     </div>
//                     <h4 className="mb-2">No files to preview</h4>
//                     <p className="text-muted-foreground">
//                       Upload files in the Upload tab to see them here
//                     </p>
//                   </div>
//                 )}

//                 <div className="border rounded-lg p-4">
//                   <h4 className="mb-3">Content Summary</h4>
//                   <div className="grid grid-cols-2 gap-4 text-sm">
//                     <div>
//                       <span className="text-muted-foreground">Files:</span>
//                       <span className="ml-2">{uploadedFiles.length}</span>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">Total size:</span>
//                       <span className="ml-2">
//                         {formatFileSize(
//                           uploadedFiles.reduce(
//                             (total, file) => total + file.size,
//                             0
//                           )
//                         )}
//                       </span>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">Status:</span>
//                       <span className="ml-2 text-green-600">
//                         Ready to upload
//                       </span>
//                     </div>
//                     <div>
//                       <span className="text-muted-foreground">Est. time:</span>
//                       <span className="ml-2">~2 minutes</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </TabsContent>

//             {/* Action Buttons */}
//             <div className="flex justify-end gap-3 pt-6 border-t mt-6">
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={() => onOpenChange(false)}>
//                 Cancel
//               </Button>
//               <Button
//                 type="submit"
//                 disabled={isSubmitting}
//                 className="min-w-[100px]">
//                 {isSubmitting ? "Submitting..." : "Submit"}
//               </Button>
//             </div>
//           </form>
//         </Tabs>
//       </DialogContent>
//     </Dialog>
//   );
// }
