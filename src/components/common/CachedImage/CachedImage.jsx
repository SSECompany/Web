import React, { useState, useEffect } from 'react';
import { getCachedImage } from '../../../utils/imageCache';

/**
 * A component that renders an image with automatic caching
 */
const CachedImage = ({ src, alt, style, className, ...props }) => {
  const [displaySrc, setDisplaySrc] = useState(src);

  useEffect(() => {
    let isMounted = true;
    let objectUrl = null;

    const loadImage = async () => {
      if (!src) return;
      
      const url = await getCachedImage(src);
      
      if (isMounted) {
        // If it's an object URL (blob shortcut), we'll need to clean it up
        if (url.startsWith('blob:')) {
          objectUrl = url;
        }
        setDisplaySrc(url);
      } else if (url.startsWith('blob:')) {
        // If unmounted before we could set it, revoke it now
        URL.revokeObjectURL(url);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  return (
    <img 
      src={displaySrc} 
      alt={alt} 
      style={style} 
      className={className} 
      {...props} 
    />
  );
};

export default CachedImage;
