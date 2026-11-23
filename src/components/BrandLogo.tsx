import { useEffect, useState } from 'react';

export const CUSTOM_LOGO_STORAGE_KEY = 'youglob_custom_logo_v1';
export const DEFAULT_YOUGLOB_LOGO_URL =
  '/assets/aistudio/WhatsApp_Image_2026-11-23_at_1.23.03_AM_7cd7b39d.jpeg';

export function getStoredCustomLogo(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(CUSTOM_LOGO_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredCustomLogo(dataUrl: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (dataUrl) {
      window.localStorage.setItem(CUSTOM_LOGO_STORAGE_KEY, dataUrl);
    } else {
      window.localStorage.removeItem(CUSTOM_LOGO_STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent('youglob:logo-updated'));
  } catch {
    // Ignore storage quota issues
  }
}

interface BrandLogoProps {
  compact?: boolean;
}

export function BrandLogo({ compact = false }: BrandLogoProps) {
  const [customLogo, setCustomLogo] = useState<string | null>(() => getStoredCustomLogo());

  useEffect(() => {
    const sync = () => setCustomLogo(getStoredCustomLogo());
    window.addEventListener('youglob:logo-updated', sync);
    return () => window.removeEventListener('youglob:logo-updated', sync);
  }, []);

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0">
      {customLogo ? (
        <img
          src={customLogo}
          alt="YouGlob Technology logo"
          className="h-8 w-8 rounded-full object-cover bg-white border border-[#9C99B8]/40 shrink-0"
        />
      ) : (
        <span className="h-8 w-8 rounded-full overflow-hidden bg-[#2E2935] ring-1 ring-[#474150]/25 shrink-0 inline-flex items-center justify-center">
          <img
            src={DEFAULT_YOUGLOB_LOGO_URL}
            alt="YouGlob Technology logo"
            className="h-full w-full object-cover scale-[1.12]"
          />
        </span>
      )}
      <span className="font-display font-extrabold tracking-tight text-[#474150] text-lg sm:text-xl whitespace-nowrap">
        {compact ? 'YouGlob' : 'YouGlob Technology'}
      </span>
    </span>
  );
}
