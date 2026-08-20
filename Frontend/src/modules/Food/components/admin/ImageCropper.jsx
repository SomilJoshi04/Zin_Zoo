import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@food/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@food/components/ui/select";
import { ZoomIn, ZoomOut, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

export async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return null;

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) return null;

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      0.98
    );
  });
}

export default function ImageCropper({
  open,
  onClose,
  imageSrc,
  onCropCompleteAction,
  initialAspectRatio = 1,
  title = "Crop Image"
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(initialAspectRatio);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], "cropped.webp", {
        type: "image/webp",
        lastModified: Date.now(),
      });
      onCropCompleteAction(croppedFile);
      onClose();
    } catch (error) {
      console.error("Error cropping image:", error);
      toast.error("Failed to crop image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl w-[90vw] p-0 overflow-hidden dark:bg-slate-900 shadow-2xl border-slate-200 dark:border-slate-800">
        <DialogHeader className="px-5 py-4 border-b border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </DialogTitle>
          <div className="flex items-center gap-3 mt-0">
            <Select
              value={aspect.toString()}
              onValueChange={(val) => setAspect(Number(val))}
            >
              <SelectTrigger className="w-[150px] h-9 text-sm bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium">
                <SelectValue placeholder="Aspect Ratio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Square (1:1)</SelectItem>
                <SelectItem value="1.3333333333333333">Landscape (4:3)</SelectItem>
                <SelectItem value="1.7777777777777777">Widescreen (16:9)</SelectItem>
                <SelectItem value="0.75">Portrait (3:4)</SelectItem>
                <SelectItem value="0">Free Crop</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <div className="relative w-full h-[50vh] min-h-[350px] bg-slate-950">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect === 0 ? undefined : aspect}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              objectFit={aspect === 0 ? "contain" : "horizontal-cover"}
              showGrid={true}
              zoomSpeed={0.2}
            />
          ) : null}
        </div>

        <div className="px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 w-full sm:w-1/2 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <ZoomOut className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.05}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:bg-slate-700"
              />
              <ZoomIn className="w-4 h-4 text-slate-500 shrink-0" />
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700 shadow-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Crop"
              )}
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
