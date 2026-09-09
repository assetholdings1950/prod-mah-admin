import appClient from "@/lib/appClient";

type SignedUpload = {
    timestamp: number;
    folder: string;
    signature: string;
    cloudName: string;
    public_id: string;
    apiKey: string;
};

type CloudinaryUploadResponse = {
    secure_url?: string;
    error?: { message?: string };
};

export const uploadAdminDocument = async (
    file: File,
    uniqueId: string,
    onProgress?: (progress: number) => void,
): Promise<string> => {
    const signatureResponse = await appClient.post<SignedUpload>("/api/signature/admin-assets", {
        uniqueId,
        main_folder_name: "bonds",
    });
    const { timestamp, folder, signature, cloudName, public_id, apiKey } = signatureResponse.data;

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);
    form.append("folder", folder);
    form.append("public_id", public_id);
    form.append("overwrite", "true");
    form.append("invalidate", "true");

    return new Promise<string>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`);
        request.upload.onprogress = (event) => {
            if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
        };
        request.onerror = () => reject(new Error("Document upload failed. Check your connection and try again."));
        request.onload = () => {
            let data: CloudinaryUploadResponse = {};
            try {
                data = JSON.parse(request.responseText) as CloudinaryUploadResponse;
            } catch {
                reject(new Error("Cloudinary returned an invalid upload response."));
                return;
            }

            if (request.status < 200 || request.status >= 300 || !data.secure_url) {
                reject(new Error(data.error?.message || "Document upload failed."));
                return;
            }

            onProgress?.(100);
            resolve(data.secure_url);
        };
        request.send(form);
    });
};
