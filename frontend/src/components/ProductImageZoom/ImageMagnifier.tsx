import React, { useState, useRef, useEffect, useCallback } from 'react';
import './ProductImageZoom.css';

export interface ImageMagnifierProps {
  src: string;
  alt?: string;
  zoomLevel?: number;
  onClick?: () => void;
  isHoverDisabled?: boolean;
}

export const ImageMagnifier: React.FC<ImageMagnifierProps> = ({
  src,
  alt = 'Product image',
  zoomLevel = 2.4,
  onClick,
  isHoverDisabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [isImageLoaded, setIsImageLoaded] = useState<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const updateInnerZoom = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current || !imgRef.current) return;

      const rect = imgRef.current.getBoundingClientRect();

      // Check bounds
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        setIsZoomed(false);
        if (imgRef.current) {
          imgRef.current.style.transform = 'scale(1)';
          imgRef.current.style.transformOrigin = 'center center';
        }
        return;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));

      if (imgRef.current) {
        imgRef.current.style.transformOrigin = `${xPercent}% ${yPercent}%`;
        imgRef.current.style.transform = `scale(${zoomLevel})`;
      }
    },
    [zoomLevel]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isHoverDisabled) return;

    if (!isZoomed) {
      setIsZoomed(true);
    }

    const { clientX, clientY } = e;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      updateInnerZoom(clientX, clientY);
    });
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isHoverDisabled) return;
    setIsZoomed(true);
    updateInnerZoom(e.clientX, e.clientY);
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
    if (imgRef.current) {
      imgRef.current.style.transform = 'scale(1)';
      imgRef.current.style.transformOrigin = 'center center';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`piz-magnifier-container ${isZoomed ? 'is-zoomed' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Click to expand image fullscreen"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {!isImageLoaded && <div className="piz-skeleton-loader" />}

      {/* Main Base Image with Inner Pan Zoom */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className="piz-base-image"
        onLoad={() => setIsImageLoaded(true)}
        loading="eager"
        draggable={false}
      />
    </div>
  );
};

export default ImageMagnifier;
