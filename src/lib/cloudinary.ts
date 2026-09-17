const env = import.meta.env as Record<string, string | undefined>;

export const CLOUD_NAME = env["VITE_CLOUDINARY_CLOUD_NAME"] ?? "e8mmudhk";
export const UPLOAD_PRESET = env["VITE_CLOUDINARY_UPLOAD_PRESET"] ?? "Friend";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export interface UploadResult {
  url: string;
  publicId: string;
  resourceType: "image" | "video";
  width?: number;
  height?: number;
  duration?: number;
}

export function validateFile(file: File): string | null {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
  if (!isImage && !isVideo) return "Only JPG, PNG, WebP images or MP4/WebM/MOV videos are supported.";
  if (isImage && file.size > MAX_IMAGE_BYTES) return "Images must be smaller than 10 MB.";
  if (isVideo && file.size > MAX_VIDEO_BYTES) return "Videos must be smaller than 100 MB.";
  return null;
}

/** Unsigned upload straight to Cloudinary with real progress events. */
export function uploadToCloudinary(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  const invalid = validateFile(file);
  if (invalid) return Promise.reject(new Error(invalid));

  const resourceType = ALLOWED_VIDEO_TYPES.includes(file.type) ? "video" : "image";

  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error("Upload was rejected. Please try a different file."));
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText);
        const res: UploadResult = {
          url: data.secure_url,
          publicId: data.public_id,
          resourceType: data.resource_type === "video" ? "video" : "image",
        };
        if (typeof data.width === "number") res.width = data.width;
        if (typeof data.height === "number") res.height = data.height;
        if (typeof data.duration === "number") res.duration = data.duration;
        resolve(res);
      } catch {
        reject(new Error("Upload response could not be read."));
      }
    };
    xhr.send(form);
  });
}

/** Insert Cloudinary transformations into a delivery URL. */
export function cld(url: string | null | undefined, transform: string): string {
  if (!url) return "";
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

export const img = {
  thumb: (url?: string | null) => cld(url, "c_fill,g_auto,w_400,h_400,f_auto,q_auto"),
  feed: (url?: string | null) => cld(url, "c_limit,w_1080,f_auto,q_auto"),
  avatar: (url?: string | null, size = 96) =>
    cld(url, `c_fill,g_face,w_${size},h_${size},f_auto,q_auto`),
  poster: (url?: string | null) => cld(url, "so_0,c_limit,w_800,f_jpg,q_auto").replace(/\.(mp4|webm|mov)$/i, ".jpg"),
  video: (url?: string | null) => cld(url, "f_auto,q_auto,vc_auto"),
};
