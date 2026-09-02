import appClient from "@/lib/appClient";

export const uploadCoverPhoto = async (
    file: File,
    uniqueId: string,
    main_folder_name?: string
): Promise<string> => {

    // 1️⃣ Get signed upload params
    const sigRes = await appClient.post("/api/signature/admin-assets", {
        uniqueId,
        main_folder_name
    });
    const {
        timestamp,
        folder,
        signature,
        cloudName,
        public_id,
        apiKey,
    } = sigRes.data;

    // 2️⃣ Prepare upload form
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", apiKey);
    form.append("timestamp", timestamp.toString());
    form.append("signature", signature);
    form.append("folder", folder);
    form.append("public_id", public_id);
    form.append("overwrite", "true");
    form.append("invalidate", "true");

    // 3️⃣ Upload to Cloudinary
    const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
            method: "POST",
            body: form,
        }
    );

    const data = await uploadResponse.json();

    if (!uploadResponse.ok) {
        throw new Error(data?.error?.message || "Brand Logo upload failed");
    }

    // 4️⃣ Return image URL
    return data.secure_url;
};
