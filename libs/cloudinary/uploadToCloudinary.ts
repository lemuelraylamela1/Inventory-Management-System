export async function uploadToCloudinary(file: File): Promise<string | null> {
  const CLOUD_NAME = "dxvjap2zg"; // 🔁 Replace with your actual Cloudinary cloud name
  const UPLOAD_PRESET = "item_images"; // 🔁 Replace with your unsigned preset name

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok || !data.secure_url) {
      console.error("Cloudinary upload failed:", data);
      return null;
    }

    return data.secure_url;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}
