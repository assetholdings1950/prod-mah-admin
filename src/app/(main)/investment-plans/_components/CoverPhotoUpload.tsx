"use client";

import { useRef } from "react";
import { CheckCircle2, Edit2, Upload, X } from "lucide-react";
import { toastError } from "@/utils/toast-message/taost-message";
import { cls } from "./types";

const CoverPhotoUpload = ({
    file,
    preview,
    onFile,
    onRemove,
}: {
    file: File | null;
    preview: string;
    onFile: (f: File) => void;
    onRemove: () => void;
}) => {
    const ref = useRef<HTMLInputElement>(null);
    const hasImage = !!preview;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!f.type.startsWith("image/")) {
            toastError("Please select a valid image file.");
            return;
        }
        if (f.size > 5 * 1024 * 1024) {
            toastError("Image must be under 5MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => onFile(f);
        reader.readAsDataURL(f);
    };

    return (
        <div className="flex flex-col gap-1.5">
            <label className={cls.label}>Cover Photo</label>
            <div
                className={[
                    "relative border-2 border-dashed rounded-xl transition-all duration-200 overflow-hidden",
                    hasImage
                        ? "border-navy/20"
                        : "border-slate-200 hover:border-navy/30 cursor-pointer group",
                ].join(" ")}
                onClick={!hasImage ? () => ref.current?.click() : undefined}
            >
                {hasImage ? (
                    <div>
                        <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden">
                            <img src={preview} alt="Cover" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                        </div>
                        <div className="flex items-center justify-between mt-2.5 px-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                <span className="text-xs text-slate-500 truncate max-w-[120px]">
                                    {file ? file.name : "Uploaded"}
                                </span>
                                {file && (
                                    <span className="text-[11px] text-slate-400 shrink-0">
                                        ({(file.size / 1024).toFixed(0)} KB)
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => ref.current?.click()}
                                    className="flex items-center gap-1 px-2 py-1 bg-navy/[0.06] hover:bg-navy/10 border border-navy/20 rounded-md text-navy text-xs transition-all"
                                >
                                    <Edit2 size={11} /> Change
                                </button>
                                <button
                                    type="button"
                                    onClick={onRemove}
                                    className="flex items-center gap-1 px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md text-red-500 text-xs transition-all"
                                >
                                    <X size={11} /> Remove
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
                        <div className="w-14 h-14 rounded-full bg-slate-100 group-hover:bg-navy/[0.07] border border-slate-200 group-hover:border-navy/25 flex items-center justify-center transition-all duration-200">
                            <Upload size={20} className="text-slate-400 group-hover:text-navy/50 transition-colors" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Click to upload cover photo</p>
                            <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, WEBP — up to 5 MB</p>
                        </div>
                    </div>
                )}
                <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
        </div>
    );
};

export default CoverPhotoUpload;
