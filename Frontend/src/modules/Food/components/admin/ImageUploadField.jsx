import React, { useState, useRef } from "react";
import ImageCropper from "./ImageCropper";
import { toast } from "sonner";
import { ImagePlus, X, UploadCloud } from "lucide-react";

export default function ImageUploadField({
  value,
  onChange,
  onClear,
  aspectRatio = 1,
  className = "",
  label = "Upload Image",
  helpText = "PNG, JPG, WEBP up to 10MB",
}) {
  const fileInputRef = useRef(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      toast.error("Invalid file type. Please upload a JPG, PNG, or WEBP.");
      e.target.value = "";
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image is too large. Please upload an image under 10MB.");
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFileUrl(objectUrl);
    setIsCropperOpen(true);
    
    // Reset input so the same file can be selected again if canceled
    e.target.value = "";
  };

  const handleCropComplete = (croppedFile) => {
    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
    }
    setSelectedFileUrl(null);
    onChange(croppedFile);
  };

  const handleCropCancel = () => {
    if (selectedFileUrl) {
      URL.revokeObjectURL(selectedFileUrl);
    }
    setSelectedFileUrl(null);
    setIsCropperOpen(false);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex flex-col gap-1.5">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        
        <div className="flex items-start gap-4">
          {/* Image Preview Area */}
          <div className="relative w-32 h-32 shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 overflow-hidden group">
            {value ? (
              <>
                <img
                  src={typeof value === 'string' ? value : URL.createObjectURL(value)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm transition-colors"
                    title="Change Image"
                  >
                    <ImagePlus className="w-4 h-4" />
                  </button>
                  {onClear && (
                    <button
                      type="button"
                      onClick={onClear}
                      className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-colors"
                      title="Remove Image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
              >
                <UploadCloud className="w-8 h-8 mb-2" />
                <span className="text-xs font-medium">Click to upload</span>
              </button>
            )}
          </div>

          <div className="flex-1 pt-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {helpText}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            {value && typeof value !== 'string' && (
              <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Ready for upload ({(value.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>
      </div>

      {isCropperOpen && selectedFileUrl && (
        <ImageCropper
          open={isCropperOpen}
          onClose={handleCropCancel}
          imageSrc={selectedFileUrl}
          onCropCompleteAction={handleCropComplete}
          initialAspectRatio={aspectRatio}
        />
      )}
    </div>
  );
}
