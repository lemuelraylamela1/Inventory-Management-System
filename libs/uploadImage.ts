// lib/uploadImage.ts
export async function uploadImage(file: File) {
  const CLOUD_NAME = "dxvjap2zg"; // ✅ Your actual Cloudinary cloud name
  const UPLOAD_PRESET = "item_images"; // ✅ Your unsigned preset name

  const formData = new FormData();
  formData.append("file", file); // ✅ This should be the actual File object
  formData.append("upload_preset", UPLOAD_PRESET); // ✅ Use your preset variable

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) throw new Error("Upload failed");
  return await res.json(); // returns { secure_url, public_id, ... }
}
