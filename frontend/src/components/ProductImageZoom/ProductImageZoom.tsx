import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import ImageMagnifier from './ImageMagnifier';
import './ProductImageZoom.css';

export interface ProductImageItem {
  id?: string | number;
  url: string;
  alt?: string;
  zoomUrl?: string;
}

export type ProductImageSource = string | ProductImageItem;

export interface ProductImageZoomProps {
  images?: ProductImageSource[];
  alt?: string;
  zoomLevel?: number;
  magnifierSize?: number;
  overlayTopRight?: React.ReactNode;
  overlayTopLeft?: React.ReactNode;
  selectedImageIndex?: number;
  onImageChange?: (index: number) => void;
  className?: string;
}

const defaultImages: ProductImageItem[] = [
  {
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    alt: 'Product Thumbnail 1',
  },
  {
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    alt: 'Product Thumbnail 2',
  },
];

export const ProductImageZoom: React.FC<ProductImageZoomProps> = ({
  images = defaultImages,
  alt = 'Product Image',
  zoomLevel = 2.4,
  overlayTopRight,
  overlayTopLeft,
  selectedImageIndex: controlledIndex,
  onImageChange,
  className = '',
}) => {
  // Normalize images to standard ProductImageItem array
  const normalizedImages: ProductImageItem[] = React.useMemo(() => {
    if (!images || images.length === 0) return defaultImages;
    return images.map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: index,
          url: item,
          alt: `${alt} - ${index + 1}`,
        };
      }
      return {
        ...item,
        id: item.id ?? index,
        url: item.url,
        alt: item.alt || `${alt} - ${index + 1}`,
      };
    });
  }, [images, alt]);

  // Active image index
  const [internalIndex, setInternalIndex] = useState<number>(0);
  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;

  // Fullscreen Lightbox Modal state
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Thumbnail scroll container ref
  const thumbsScrollRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Auto scroll active thumbnail into view
  useEffect(() => {
    if (thumbsScrollRef.current) {
      const activeEl = thumbsScrollRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeIndex]);

  const handleStageTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleStageTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    touchStartXRef.current = null;
    if (Math.abs(diff) > 40) {
      if (diff > 0 && activeIndex < normalizedImages.length - 1) {
        handleSelectImage(activeIndex + 1);
      } else if (diff < 0 && activeIndex > 0) {
        handleSelectImage(activeIndex - 1);
      }
    }
  };

  const currentImage = normalizedImages[activeIndex] || normalizedImages[0];

  const handleSelectImage = useCallback(
    (index: number) => {
      setInternalIndex(index);
      if (onImageChange) {
        onImageChange(index);
      }
    },
    [onImageChange]
  );

  // Scroll thumbnails left or right
  const scrollThumbs = (direction: 'left' | 'right') => {
    if (thumbsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      thumbsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Lightbox Modal open/close handlers
  const openLightbox = useCallback(() => {
    setIsLightboxOpen(true);
    setLightboxZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    setLightboxZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        handleSelectImage((activeIndex + 1) % normalizedImages.length);
        setLightboxZoom(1);
        setPanOffset({ x: 0, y: 0 });
      } else if (e.key === 'ArrowLeft') {
        handleSelectImage((activeIndex - 1 + normalizedImages.length) % normalizedImages.length);
        setLightboxZoom(1);
        setPanOffset({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, activeIndex, normalizedImages.length, handleSelectImage, closeLightbox]);

  // Lightbox Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (lightboxZoom <= 1) return;
    setIsPanning(true);
    dragStartRef.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || lightboxZoom <= 1) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div className={`piz-gallery-container ${className}`}>
      {/* MAIN VIEWER STAGE */}
      <div
        className="piz-main-stage"
        onTouchStart={handleStageTouchStart}
        onTouchEnd={handleStageTouchEnd}
      >
        {/* Overlay Slots (Wishlist button, Badges) */}
        {overlayTopLeft && <div className="piz-overlay-slot-top-left">{overlayTopLeft}</div>}
        {overlayTopRight && <div className="piz-overlay-slot-top-right">{overlayTopRight}</div>}

        {/* Core Image Magnifier with Inner Zoom and One-Click Expand */}
        <ImageMagnifier
          key={currentImage.url}
          src={currentImage.url}
          alt={currentImage.alt}
          zoomLevel={zoomLevel}
          onClick={openLightbox}
        />

        {/* Floating Expand Button */}
        <div className="piz-stage-toolbar">
          <button
            type="button"
            className="piz-tool-btn"
            onClick={openLightbox}
            title="Click to Expand Fullscreen"
            aria-label="Click to expand fullscreen"
          >
            <Maximize2 size={13} />
            <span>Click to expand</span>
          </button>
        </div>
      </div>

      {/* THUMBNAIL STRIP (Rendered when 2 or more images) */}
      {normalizedImages.length > 1 && (
        <div className="piz-thumbs-wrapper">
          {normalizedImages.length > 4 && (
            <button
              type="button"
              className="piz-thumb-nav-btn"
              onClick={() => scrollThumbs('left')}
              aria-label="Scroll thumbnails left"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <div className="piz-thumbs-scroll" ref={thumbsScrollRef}>
            {normalizedImages.map((img, idx) => (
              <button
                key={img.id ?? idx}
                type="button"
                className={`piz-thumb-btn ${idx === activeIndex ? 'active' : ''}`}
                onClick={() => handleSelectImage(idx)}
                aria-label={`Select image ${idx + 1}`}
              >
                <img src={img.url} alt={img.alt || `Thumbnail ${idx + 1}`} />
                <span className="piz-thumb-label">Image {idx + 1}</span>
              </button>
            ))}
          </div>

          {normalizedImages.length > 4 && (
            <button
              type="button"
              className="piz-thumb-nav-btn"
              onClick={() => scrollThumbs('right')}
              aria-label="Scroll thumbnails right"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div className="piz-lightbox-overlay" role="dialog" aria-modal="true">
          {/* Header */}
          <div className="piz-lightbox-header">
            <div className="piz-lightbox-title">
              <span>{alt}</span>
              <span className="piz-lightbox-counter">
                {activeIndex + 1} / {normalizedImages.length}
              </span>
            </div>

            <div className="piz-lightbox-actions">
              <button
                type="button"
                className="piz-lightbox-btn"
                onClick={() => setLightboxZoom((prev) => Math.min(prev + 0.5, 4))}
                title="Zoom In"
                aria-label="Zoom in"
              >
                <ZoomIn size={18} />
              </button>
              <button
                type="button"
                className="piz-lightbox-btn"
                onClick={() => {
                  setLightboxZoom((prev) => {
                    const next = Math.max(prev - 0.5, 1);
                    if (next === 1) setPanOffset({ x: 0, y: 0 });
                    return next;
                  });
                }}
                title="Zoom Out"
                aria-label="Zoom out"
              >
                <ZoomOut size={18} />
              </button>
              <button
                type="button"
                className="piz-lightbox-btn"
                onClick={() => {
                  setLightboxZoom(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                title="Reset Zoom"
                aria-label="Reset zoom"
              >
                <RotateCcw size={18} />
              </button>
              <button
                type="button"
                className="piz-lightbox-btn piz-lightbox-close"
                onClick={closeLightbox}
                title="Close Lightbox (Esc)"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lightbox Main Stage */}
          <div
            className={`piz-lightbox-stage ${isPanning ? 'is-panning' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {normalizedImages.length > 1 && (
              <button
                type="button"
                className="piz-lightbox-arrow prev"
                onClick={() => {
                  handleSelectImage(
                    (activeIndex - 1 + normalizedImages.length) % normalizedImages.length
                  );
                  setLightboxZoom(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                aria-label="Previous Image"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <img
              src={currentImage.zoomUrl || currentImage.url}
              alt={currentImage.alt}
              className="piz-lightbox-img"
              style={{
                transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${lightboxZoom})`,
                cursor: lightboxZoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
              }}
              draggable={false}
            />

            {normalizedImages.length > 1 && (
              <button
                type="button"
                className="piz-lightbox-arrow next"
                onClick={() => {
                  handleSelectImage((activeIndex + 1) % normalizedImages.length);
                  setLightboxZoom(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                aria-label="Next Image"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>

          {/* Lightbox Footer Thumbnails */}
          {normalizedImages.length > 1 && (
            <div className="piz-lightbox-footer">
              {normalizedImages.map((img, idx) => (
                <button
                  key={img.id ?? idx}
                  type="button"
                  className={`piz-lightbox-thumb ${idx === activeIndex ? 'active' : ''}`}
                  onClick={() => {
                    handleSelectImage(idx);
                    setLightboxZoom(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  aria-label={`Go to image ${idx + 1}`}
                >
                  <img src={img.url} alt={img.alt || `Thumb ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductImageZoom;
