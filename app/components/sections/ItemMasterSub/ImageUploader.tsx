// // components/ImageUploader.tsx
// import { useState } from "react";
// import { Label } from "../../ui/label";
// import { Image as LucideImage, X } from "lucide-react";
// import Image from "next/image";

// // interface ImageUploaderProps {
// //   onSelect: (file: File | null) => void;
// //   defaultImageUrl?: string;
// //   initialImageUrl?: string;
// // }

// interface ImageUploaderProps {
//   onSelect: (
//     data: { file: File; url: string; publicId: string } | null
//   ) => void;
//   initialImageUrl?: string;
// }

// export default function ImageUploader({
//   onSelect,
//   initialImageUrl,
// }: ImageUploaderProps) {
//   const [dragActive, setDragActive] = useState(false);
//   const [previewFile, setPreviewFile] = useState<File | null>(null);
//   const [previewUrl, setPreviewUrl] = useState<string | null>(
//     initialImageUrl || null
//   );

//   // const handleFileSelect = (files: FileList | null) => {
//   //   if (!files || !files[0]) return;

//   //   const file = files[0];
//   //   const isImage = file.type.startsWith("image/");
//   //   const isValidSize = file.size <= 10 * 1024 * 1024;

//   //   if (!isImage || !isValidSize) return;

//   //   setPreviewFile(file);
//   //   onSelect(file);
//   // };

//   const handleFileSelect = async (files: FileList | null) => {
//     if (!files || !files[0]) return;

//     const file = files[0];
//     const isImage = file.type.startsWith("image/");
//     const isValidSize = file.size <= 10 * 1024 * 1024;

//     if (!isImage || !isValidSize) return;

//     setPreviewFile(file);

//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("upload_preset", "your_upload_preset");

//     try {
//       const res = await fetch(
//         "https://api.cloudinary.com/v1_1/your_cloud_name/image/upload",
//         {
//           method: "POST",
//           body: formData,
//         }
//       );

//       const data = await res.json();
//       setPreviewUrl(data.secure_url);

//       onSelect({
//         file,
//         url: data.secure_url,
//         publicId: data.public_id,
//       });
//     } catch (err) {
//       console.error("Upload failed", err);
//       onSelect(null);
//     }
//   };

//   const removeFile = () => {
//     setPreviewFile(null);
//     onSelect(null);
//   };

//   return (
//     <div>
//       <Label>Images</Label>
//       <div
//         className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
//           dragActive
//             ? "border-primary bg-primary/5"
//             : "border-border hover:border-primary/50"
//         }`}
//         onDragEnter={(e) => {
//           e.preventDefault();
//           setDragActive(true);
//         }}
//         onDragLeave={(e) => {
//           e.preventDefault();
//           setDragActive(false);
//         }}
//         onDragOver={(e) => e.preventDefault()}
//         onDrop={(e) => {
//           e.preventDefault();
//           setDragActive(false);
//           handleFileSelect(e.dataTransfer.files);
//         }}>
//         {previewUrl ? (
//           <div className="relative w-full h-64 rounded-lg overflow-hidden border shadow-sm">
//             <Image
//               src={previewUrl}
//               alt="Preview"
//               fill
//               className="object-cover"
//               sizes="100vw"
//               priority
//             />
//             <button
//               type="button"
//               onClick={removeFile}
//               className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-100">
//               <X className="h-4 w-4 text-red-600" />
//             </button>
//           </div>
//         ) : (
//           <div className="w-full h-64 flex items-center justify-center rounded-lg border bg-muted text-muted-foreground text-sm">
//             No image available
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
