const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export function validateProfilePhoto(file) {
  if (!file || !TYPES.has(file.type)) throw new Error("Choose a JPG, PNG, WebP or GIF image.");
  if (!file.size || file.size > MAX_BYTES) throw new Error("Choose an image smaller than 5 MB.");
}

// Normalize a decodable image to a small square before storing it offline.
export async function prepareProfilePhoto(file) {
  validateProfilePhoto(file);
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    try {
      await image.decode();
    } catch {
      throw new Error("This image could not be opened. Please choose another photo.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image processing is unavailable in this browser.");
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    ctx.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 512, 512);
    return await new Promise((resolve, reject) => canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Could not prepare this photo. Please try another image.")),
      "image/png",
    ));
  } finally {
    URL.revokeObjectURL(source);
  }
}
