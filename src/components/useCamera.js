import { useEffect, useRef, useState } from "react";

// Camera hook: start/stop a camera stream into a <video ref={videoRef}> element.
// facing: "user" (front camera) or "environment" (back camera). torch: turn on the flash if supported.
export default function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");

  async function start(facing = "user", { torch = false } = {}) {
    setError("");
    stop();
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't use the camera. Use the upload option instead.");
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      if (torch) {
        const [track] = stream.getVideoTracks();
        track?.applyConstraints?.({ advanced: [{ torch: true }] }).catch(() => {});
      }
      setActive(true);
      return stream;
    } catch (e) {
      const msg =
        e.name === "NotAllowedError" ? "Camera permission was denied. Allow camera access for this site and try again."
        : e.name === "NotFoundError" ? "No camera was found on this device."
        : `Camera error: ${e.message}`;
      setError(msg);
      return null;
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  return { videoRef, active, error, start, stop };
}

// Grab the current video frame as a JPEG blob (longest side maxSize px)
export function captureFrame(video, maxSize = 640, quality = 0.8) {
  const scale = Math.min(1, maxSize / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

// Shrink an uploaded image file to a JPEG blob
export async function resizeImageFile(file, maxSize = 640, quality = 0.8) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}
