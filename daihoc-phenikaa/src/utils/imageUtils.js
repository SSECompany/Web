export const compressImageToWebP = (base64Str, quality = 0.6) => {
    return new Promise((resolve) => {
        if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith("data:image/") || base64Str.startsWith("data:image/webp")) {
            resolve(base64Str);
            return;
        }

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            // Maintain aspect ratio, maybe max width/height?
            let width = img.width;
            let height = img.height;
            
            // Optionally scale down if too large
            const MAX_WIDTH = 500;
            const MAX_HEIGHT = 500;
            if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                width = width * ratio;
                height = height * ratio;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/webp", quality));
        };
        img.onerror = () => {
            resolve(base64Str);
        };
        img.src = base64Str;
    });
};

export const processMenuItemsImages = async (items) => {
    const BATCH_SIZE = 10;
    const result = [];
    
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const processedBatch = await Promise.all(
            batch.map(async (item) => {
                if (item.image) {
                    return { ...item, image: await compressImageToWebP(item.image, 0.6) };
                }
                return item;
            })
        );
        result.push(...processedBatch);
    }
    
    return result;
};
