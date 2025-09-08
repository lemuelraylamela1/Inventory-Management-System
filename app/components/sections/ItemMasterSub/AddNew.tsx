"use client";

import React, { useState, useCallback } from "react";

import { useRouter } from "next/navigation";

import Image from "next/image";

import { Upload, X, FileText, Settings, Eye } from "lucide-react";
import ImageUploader from "./ImageUploader";
import { uploadToCloudinary } from "../../../../libs/cloudinary/uploadToCloudinary";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Input } from "../../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Button } from "../../ui/button";
import { Textarea } from "../../ui/textarea";
import { Label } from "../../ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { Card, CardContent } from "../../ui/card";

export default function AddNew({
  isOpen,
  onOpenChange,
  onSuccess,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const router = useRouter();

  const [item_code, setItemCode] = useState("");
  const [item_name, setItemName] = useState("");
  const [item_description, setItemDescription] = useState("");
  const [item_category, setItemCategory] = useState("");
  const [item_status, setItemStatus] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    let imageUrl = "";

    if (selectedFile) {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      if (!cloudName || !uploadPreset) {
        throw new Error("Missing Cloudinary env variables");
      }

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", uploadPreset); // ✅ use variable

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, // ✅ use backticks
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data.secure_url) {
        imageUrl = data.secure_url;
      }
    }

    const payload = {
      createdDT: new Date().toISOString(),
      item_code,
      item_name,
      item_description,
      item_category,
      item_status,
      imageUrl,
      length: length ? parseFloat(length) : 0,
      width: width ? parseFloat(width) : 0,
      height: height ? parseFloat(height) : 0,
      weight: weight ? parseFloat(weight) : 0,
    };

    try {
      const res = await fetch("http://localhost:3000/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (typeof onSuccess === "function") {
          onSuccess();
        }
        setTimeout(() => {
          router.push("/");
        }, 300); // ✅ Give time for dialog to close

        // ✅ Reset form fields
        setItemCode("");
        setItemName("");
        setItemDescription("");
        setItemCategory("");
        setItemStatus("");
        setLength("");
        setWidth("");
        setHeight("");
        setWeight("");
        setSelectedFile(null);
        setUploadedFiles([]); // if you're tracking uploaded files separately
      } else {
        throw new Error("Failed to create item");
      }
    } catch (error) {
      console.error("Error submitting item:", error);
      setError("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add Items
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              Item Details
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              Unit of Measure
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              Accounting Details
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="mt-6">
            <TabsContent value="upload" className="space-y-6 mt-0">
              {/* Image Upload Area */}
              <div className="space-y-2">
                {/* <Label>Images</Label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}>
                  {!uploadedFiles.length ? (
                    <>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="text-center">
                        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Image className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <span className="font-medium text-primary">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG, GIF up to 10MB
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="relative w-full h-48 overflow-hidden rounded-lg">
                      <Image
                        src={URL.createObjectURL(uploadedFiles[0])}
                        alt={uploadedFiles[0].name}
                        fill
                        className="object-cover"
                        sizes="100vw"
                        priority
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(0)}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-100">
                        <X className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div> */}
                <ImageUploader onSelect={(file) => setSelectedFile(file)} />
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-code">Item Code</Label>
                  <Input
                    id="item-code"
                    value={item_code}
                    onChange={(e) => setItemCode(e.target.value)}
                    placeholder="Enter item code"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    value={item_name}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="Enter item name"
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-description">Item Description</Label>
                <Textarea
                  id="item-description"
                  value={item_description}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Enter item description"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-category">Category</Label>
                  <Select value={item_category} onValueChange={setItemCategory}>
                    <SelectTrigger id="item-category" className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JELLY">Jelly</SelectItem>
                      <SelectItem value="CHOCOLATE">Chocolate</SelectItem>
                      <SelectItem value="IMPORTED CANDIES">
                        Imported Candies
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-status">Status</Label>
                  <Select value={item_status} onValueChange={setItemStatus}>
                    <SelectTrigger id="item-status" className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="ACTIVE"
                        className="flex items-center gap-2 text-green-700">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Active
                      </SelectItem>
                      <SelectItem
                        value="INACTIVE"
                        className="flex items-center gap-2 text-red-700">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Inactive
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Length</Label>
                  <Input
                    id="length"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    placeholder="Enter length"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="Enter width"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="Enter height"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-weight">Weight</Label>
                  <Input
                    id="item-weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Enter weight"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-0">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3>Upload Settings</h3>

                  <div className="space-y-2">
                    <Label>Default visibility</Label>
                    <Select defaultValue="private">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="unlisted">Unlisted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Enable notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when upload processing is complete
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6 mt-0">
              <div className="space-y-4">
                <h3>Content Preview</h3>

                {uploadedFiles.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {uploadedFiles.slice(0, 6).map((file, index) => (
                        <Card key={index} className="p-2">
                          <CardContent className="p-0">
                            <div className="aspect-square bg-muted rounded-md flex items-center justify-center mb-2">
                              <Image
                                className="h-8 w-8 text-muted-foreground"
                                src={file.name}
                                alt={file.name}
                                width={300}
                                height={300}
                              />
                            </div>
                            <p className="text-xs truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {uploadedFiles.length > 6 && (
                      <p className="text-sm text-muted-foreground text-center">
                        +{uploadedFiles.length - 6} more files
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Eye className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h4 className="mb-2">No files to preview</h4>
                    <p className="text-muted-foreground">
                      Upload files in the Upload tab to see them here
                    </p>
                  </div>
                )}

                <div className="border rounded-lg p-4">
                  <h4 className="mb-3">Content Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Files:</span>
                      <span className="ml-2">{uploadedFiles.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total size:</span>
                      <span className="ml-2">
                        {formatFileSize(
                          uploadedFiles.reduce(
                            (total, file) => total + file.size,
                            0
                          )
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <span className="ml-2 text-green-600">
                        Ready to upload
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Est. time:</span>
                      <span className="ml-2">~2 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="min-w-[100px]">
                {isSubmitting
                  ? "Submitting..."
                  : isUploading
                  ? "Uploading..."
                  : "Submit"}
              </Button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
