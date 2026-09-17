import { useEffect, useRef, useState } from "react";
import { Camera, Check, RefreshCw, RotateCcw, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "./responsive-modal";

interface CameraModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
}

export function CameraModal({ open, onOpenChange, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Stop camera tracks cleanly
  const stopTracks = (mediaStream?: MediaStream | null) => {
    const s = mediaStream ?? stream;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
    }
  };

  // Start video stream
  useEffect(() => {
    if (!open) {
      stopTracks();
      setStream(null);
      setCapturedUrl(null);
      setCapturedBlob(null);
      setError(null);
      return;
    }

    if (capturedUrl) return;

    let active = true;
    setIsStarting(true);
    setError(null);

    const startCamera = async () => {
      stopTracks();
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Direct camera access is not supported in this browser.");
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!active) {
          newStream.getTracks().forEach((t) => t.stop());
          return;
        }

        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          await videoRef.current.play();
        }
      } catch (err: unknown) {
        if (!active) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Camera permission denied or camera not found.";
        setError(msg);
      } finally {
        if (active) setIsStarting(false);
      }
    };

    void startCamera();

    return () => {
      active = false;
      stopTracks();
    };
  }, [open, facingMode]);

  // Flip front/back camera
  const toggleFacing = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  // Snap photo from video frame
  const takeSnapshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Flip horizontally if front camera for natural mirror look
    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const previewUrl = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedUrl(previewUrl);
        stopTracks();
      },
      "image/jpeg",
      0.92,
    );
  };

  // Retake photo
  const retake = () => {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
    }
    setCapturedUrl(null);
    setCapturedBlob(null);
  };

  // Confirm photo and pass to chat draft
  const confirmPhoto = () => {
    if (!capturedBlob) return;
    const fileName = `camera_${Date.now()}.jpg`;
    const file = new File([capturedBlob], fileName, { type: "image/jpeg" });
    onCapture(file);
    onOpenChange(false);
  };

  // Handle native fallback file input
  const handleNativeInput = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file) {
      onCapture(file);
      onOpenChange(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          stopTracks();
          retake();
        }
        onOpenChange(v);
      }}
      title="Camera"
      className="sm:max-w-md p-0 overflow-hidden bg-black text-white"
    >
      <div className="relative flex flex-col items-center justify-between min-h-[440px] bg-black p-4">
        {/* Hidden Canvas & Native Device Camera Input */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => handleNativeInput(e.target.files)}
        />

        {/* Viewfinder Area */}
        <div className="relative w-full aspect-3/4 max-h-[500px] overflow-hidden rounded-2xl bg-zinc-900 flex items-center justify-center">
          {capturedUrl ? (
            <img
              src={capturedUrl}
              alt="Captured snapshot"
              className="h-full w-full object-cover rounded-2xl"
            />
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
              <Camera className="h-12 w-12 text-zinc-500" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Camera Unavailable</p>
                <p className="text-xs text-zinc-400">
                  {error.includes("permission")
                    ? "Camera permission was denied. Please allow access or use your device camera."
                    : "No direct camera feed found."}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
              >
                Use Device Camera / Gallery
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${
                  facingMode === "user" ? "-scale-x-100" : ""
                }`}
              />
              {isStarting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                  <div className="flex items-center gap-2 text-xs text-white">
                    <Video className="h-4 w-4 animate-pulse" />
                    <span>Starting camera…</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Quick Flip Camera Button in Viewfinder */}
          {!capturedUrl && !error && (
            <button
              type="button"
              onClick={toggleFacing}
              aria-label="Flip camera"
              className="absolute top-3 right-3 rounded-full bg-black/50 p-2 text-white backdrop-blur hover:bg-black/70 active:scale-95 transition-transform"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Bottom Camera Controls */}
        <div className="w-full flex items-center justify-around pt-4">
          {capturedUrl ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={retake}
                className="flex items-center gap-1.5 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-full px-4"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Retake</span>
              </Button>
              <Button
                type="button"
                onClick={confirmPhoto}
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 shadow-lg"
              >
                <Check className="h-4 w-4" />
                <span>Use Photo</span>
              </Button>
            </>
          ) : !error ? (
            <>
              {/* Native device fallback button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
                title="Use native device camera"
              >
                System Camera
              </button>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={takeSnapshot}
                disabled={isStarting}
                aria-label="Take photo"
                className="relative flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/90 bg-transparent transition-transform hover:scale-105 active:scale-90"
              >
                <span className="h-12 w-12 rounded-full bg-white shadow-md" />
              </button>

              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full text-zinc-400 border-zinc-700"
            >
              Close
            </Button>
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
}
