"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Download, FileCheck2, Loader2, Trash2, UploadCloud } from "lucide-react";
import { uploadAdminDocument } from "@/cloudionary-helpers/adminDocumentUpload";
import { toastError, toastSuccess } from "@/utils/toast-message/taost-message";

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

type Props = {
    label: string;
    value: string;
    documentKey: "offering-document" | "term-sheet";
    bondSlug: string;
    bondId?: string;
    uploading: boolean;
    onUploadingChange: (uploading: boolean) => void;
    onChange: (url: string) => void;
    onUploaded?: (url: string) => Promise<void>;
    onRemove?: () => Promise<void>;
};

const fileNameFromUrl = (url: string) => {
    if (!url) return "";
    try {
        return decodeURIComponent(new URL(url).pathname.split("/").pop() || "Uploaded document");
    } catch {
        return "Uploaded document";
    }
};

export default function BondDocumentUpload({
    label, value, documentKey, bondSlug, bondId, uploading, onUploadingChange, onChange, onUploaded, onRemove,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [progress, setProgress] = useState(0);
    const [localFileName, setLocalFileName] = useState("");
    const [downloading, setDownloading] = useState(false);
    const [removing, setRemoving] = useState(false);

    const chooseFile = () => {
        if (!bondSlug.trim()) {
            toastError("Enter the bond name before uploading documents.");
            return;
        }
        inputRef.current?.click();
    };

    const upload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!ACCEPTED_TYPES.has(file.type)) {
            toastError("Upload a PDF, DOC, or DOCX file.");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toastError("Document size cannot exceed 15 MB.");
            return;
        }

        onUploadingChange(true);
        setProgress(0);
        try {
            const url = await uploadAdminDocument(file, `${bondSlug}-${documentKey}`, setProgress);
            if (onUploaded) await onUploaded(url);
            setLocalFileName(file.name);
            onChange(url);
            toastSuccess(`${label} uploaded successfully.`);
        } catch (error: unknown) {
            toastError(error instanceof Error ? error.message : "Document upload failed.");
        } finally {
            onUploadingChange(false);
        }
    };

    const download = async () => {
        if (!bondId) {
            toastError("Save the bond before downloading its document.");
            return;
        }

        setDownloading(true);
        try {
            const response = await fetch(`/api/bonds/${encodeURIComponent(bondId)}/documents/${documentKey}`);
            if (!response.ok) {
                const body = await response.json().catch(() => null) as { message?: string } | null;
                throw new Error(body?.message || "Document download failed.");
            }
            const blob = await response.blob();
            const requestedName = fileNameFromUrl(value) || `${bondSlug}-${documentKey}`;
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = objectUrl;
            link.download = requestedName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(objectUrl);
            toastSuccess(`${label} downloaded successfully.`);
        } catch (error) {
            toastError(error instanceof Error ? error.message : `${label} download failed. Please try again.`);
        } finally {
            setDownloading(false);
        }
    };

    const remove = async () => {
        if (!onRemove) {
            setLocalFileName("");
            onChange("");
            return;
        }

        setRemoving(true);
        try {
            await onRemove();
            setLocalFileName("");
            toastSuccess(`${label} removed from this bond.`);
        } catch {
            toastError(`Could not remove ${label.toLowerCase()}. Please try again.`);
        } finally {
            setRemoving(false);
        }
    };

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</label>
            <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" onChange={upload} className="hidden" />

            {value ? (
                <div className="min-h-[76px] flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-3">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-white text-emerald-600 flex items-center justify-center border border-emerald-100">
                        <FileCheck2 size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-navy">{localFileName || fileNameFromUrl(value)}</p>
                        <p className="mt-0.5 text-[10px] font-medium text-emerald-600">Uploaded to Cloudinary</p>
                    </div>
                    <button type="button" onClick={() => void download()} disabled={uploading || downloading || !bondId} title={bondId ? "Download document" : "Save the bond before downloading"} className="p-2 text-slate-400 hover:text-navy transition-colors disabled:cursor-not-allowed disabled:opacity-40">
                        {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    </button>
                    <button type="button" onClick={chooseFile} disabled={uploading || removing} className="text-[11px] font-bold text-navy hover:underline disabled:opacity-50">Replace</button>
                    <button type="button" onClick={() => void remove()} disabled={uploading || removing} title="Remove document" className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50">
                        {removing ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                </div>
            ) : (
                <button type="button" onClick={chooseFile} disabled={uploading} className="min-h-[76px] flex items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-navy/30 hover:bg-navy/[0.02] transition-all disabled:cursor-wait">
                    {uploading ? <Loader2 size={18} className="animate-spin text-navy" /> : <UploadCloud size={18} />}
                    <span className="text-left">
                        <span className="block text-xs font-bold text-navy">{uploading ? `Uploading… ${progress}%` : "Choose document"}</span>
                        <span className="block text-[10px] mt-0.5">PDF, DOC or DOCX · up to 15 MB</span>
                    </span>
                </button>
            )}

            {uploading && value && (
                <div className="h-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-navy transition-all" style={{ width: `${progress}%` }} />
                </div>
            )}
        </div>
    );
}
