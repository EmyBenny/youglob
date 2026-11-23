import { useState } from 'react';
import { Laptop } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function SafeImage({ src, alt, className = '', fallbackTitle }: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F5FFF4] to-[#9C99B8]/25 text-[#474150] p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Laptop className="w-8 h-8 mb-2 opacity-80 text-[#474150]" />
        {fallbackTitle && <span className="text-xs font-medium opacity-80">{fallbackTitle}</span>}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
