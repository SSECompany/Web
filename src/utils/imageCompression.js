/**
 * Compress image file using canvas and optionally convert to WebP
 * @param {File} file - Original image file
 * @param {Object} options - Compression options
 * @param {number} options.maxWidth - Maximum width in pixels
 * @param {number} options.maxHeight - Maximum height in pixels
 * @param {number} options.quality - Image quality (0-1)
 * @param {number} options.maxSizeMB - Maximum file size in MB
 * @param {string} options.format - Target format ('image/webp', 'image/jpeg', 'image/png')
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,

    maxSizeMB = 2,
    format = "image/webp", // Default to webp as requested
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        const ctx = canvas.getContext("2d");
        
        // Fill white background for JPEGs if needed, but for WebP it's fine
        if (format === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
        }
        
        ctx.drawImage(img, 0, 0, width, height);

        // Get target file type
        const targetType = format;
        const fileName = file.name.replace(/\.[^/.]+$/, "") + (format === "image/webp" ? ".webp" : ".jpg");

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            // Check if compressed size is acceptable
            const sizeMB = blob.size / (1024 * 1024);
            if (sizeMB <= maxSizeMB) {
              // Create new file from blob
              const compressedFile = new File([blob], fileName, {
                type: blob.type || targetType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              // If still too large, reduce quality further
              let currentQuality = quality;
              const reduceQuality = () => {
                currentQuality = Math.max(0.1, currentQuality - 0.1);
                canvas.toBlob(
                  (newBlob) => {
                    if (!newBlob) {
                      reject(new Error("Failed to compress image"));
                      return;
                    }
                    const newSizeMB = newBlob.size / (1024 * 1024);
                    if (newSizeMB <= maxSizeMB || currentQuality <= 0.1) {
                      const compressedFile = new File([newBlob], fileName, {
                        type: newBlob.type || targetType,
                        lastModified: Date.now(),
                      });
                      resolve(compressedFile);
                    } else {
                      reduceQuality();
                    }
                  },
                  targetType,
                  currentQuality
                );
              };
              reduceQuality();
            }
          },
          targetType,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = e.target.result;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
};


