"use client"

import { Upload, Edit, X, CheckCircle2 } from 'lucide-react'
import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ImageUploaderProps {
    image: File | null;
    imagePreview: string;
    currentBrandLogo?: string;
    setImage: (file: File | null) => void;
    setImagePreview: (preview: string) => void;
}

const ImageUploader = ({
    image,
    currentBrandLogo,
    imagePreview,
    setImage,
    setImagePreview
}: ImageUploaderProps) => {

    const displayImage = imagePreview || currentBrandLogo;

    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;

        // Validate image type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        setImage(file);

        const reader = new FileReader();

        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };

        reader.readAsDataURL(file);
    }

    const handleRemoveImage = (e: React.MouseEvent) => {
        e.stopPropagation();

        setImage(null);
        setImagePreview("");

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const triggerFileInput = (e: React.MouseEvent) => {
        e.stopPropagation();
        fileInputRef.current?.click();
    }

    return (
        <div className="space-y-2">
            {/* Label */}
            <label className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-foreground/50">
                <span>Upload Logo</span>
            </label>

            {/* Upload Area */}
            <div
                className={`
                    border-2 border-dashed rounded-lg transition-all duration-300 bg-background relative group
                    ${!displayImage
                        ? 'border-muted hover:border-primary/60 cursor-pointer p-6 text-center'
                        : 'border-[#bf953f]/40 p-3'
                    }
                `}
                onClick={!displayImage ? triggerFileInput : undefined}
            >
                <AnimatePresence mode="wait">
                    {displayImage ? (
                        <motion.div
                            key="preview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="relative"
                        >
                            {/* Image Preview */}
                            <div className="relative w-full h-48 rounded-md overflow-hidden bg-[#111]">
                                <img
                                    src={displayImage}
                                    alt="Preview"
                                    className="w-full h-full object-contain"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                            </div>

                            {/* File Info & Actions */}
                            <div className="flex items-center justify-between mt-2 px-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#bf953f] shrink-0" />

                                    {image ? (
                                        <>
                                            <span className="text-[#C0C0C0] text-xs truncate max-w-[160px]">
                                                {image.name}
                                            </span>

                                            <span className="text-[#555] text-xs shrink-0">
                                                ({(image.size / 1024).toFixed(0)} KB)
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-[#C0C0C0] text-xs">
                                            Current uploaded image
                                        </span>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.92 }}
                                        onClick={triggerFileInput}
                                        className="flex items-center gap-1 px-2 py-1 bg-[#bf953f]/20 hover:bg-[#bf953f]/30 border border-[#bf953f]/40 rounded-md transition-all text-[#bf953f] text-xs"
                                        title="Change image"
                                    >
                                        <Edit className="w-3 h-3" />
                                        Change
                                    </motion.button>

                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.08 }}
                                        whileTap={{ scale: 0.92 }}
                                        onClick={handleRemoveImage}
                                        className="flex items-center gap-1 px-2 py-1 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 rounded-md transition-all text-red-400 text-xs"
                                        title="Remove image"
                                    >
                                        <X className="w-3 h-3" />
                                        Remove
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-3"
                        >
                            <div className="w-14 h-14 rounded-full bg-[#bf953f]/10 border border-[#bf953f]/20 flex items-center justify-center mx-auto group-hover:bg-[#bf953f]/20 transition-colors duration-300">
                                <Upload className="w-6 h-6 text-[#666] group-hover:text-[#bf953f] transition-colors duration-300" />
                            </div>

                            <div>
                                <p className="text-[#C0C0C0] text-sm">
                                    Click to upload logo
                                </p>

                                <p className="text-[#555] text-xs mt-1">
                                    PNG, JPG, GIF, WEBP — up to 5MB
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
        </div>
    )
}

export default ImageUploader