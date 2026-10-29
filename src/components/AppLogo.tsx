/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

interface AppLogoProps {
  size?: number | string;
  showText?: boolean;
  className?: string;
  allowUpload?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 48,
  showText = false,
  className = '',
  allowUpload = false,
}) => {
  const [logoSrc, setLogoSrc] = useState<string>('/logo.svg');

  useEffect(() => {
    // Check if custom logo was uploaded or saved
    const saved = localStorage.getItem('srt_custom_logo');
    if (saved) {
      setLogoSrc(saved);
    }

    const handleLogoUpdate = () => {
      const updated = localStorage.getItem('srt_custom_logo');
      setLogoSrc(updated || '/logo.svg');
    };

    window.addEventListener('srt-logo-updated', handleLogoUpdate);
    window.addEventListener('storage', handleLogoUpdate);
    return () => {
      window.removeEventListener('srt-logo-updated', handleLogoUpdate);
      window.removeEventListener('storage', handleLogoUpdate);
    };
  }, []);

  const handleResetToDefault = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem('srt_custom_logo');
    setLogoSrc('/logo.svg');
    window.dispatchEvent(new Event('srt-logo-updated'));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          localStorage.setItem('srt_custom_logo', result);
          setLogoSrc(result);
          window.dispatchEvent(new Event('srt-logo-updated'));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isCustomLogo = logoSrc !== '/logo.svg';

  return (
    <div className={`inline-flex items-center gap-3 relative group ${className}`}>
      <div className="relative shrink-0">
        <img
          src={logoSrc}
          alt="SAFETY & SECURE TOUR 360° - AI Logo"
          style={{ width: size, height: size }}
          className="rounded-full shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform shrink-0 object-contain ring-1 ring-cyan-400/40"
          loading="eager"
        />
        {allowUpload && (
          <div className="absolute inset-0 rounded-full bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[9px] font-bold backdrop-blur-xs gap-1">
            <label
              title="Click to select image file from your device"
              className="cursor-pointer hover:underline text-cyan-300"
            >
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {isCustomLogo && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-rose-300 hover:text-white hover:underline text-[8px]"
                title="Reset to default official logo"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-tight text-white text-base md:text-lg leading-tight uppercase">
              SAFETY &amp; SECURE
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-black tracking-wider text-xs md:text-sm text-cyan-400 leading-tight">
              TOUR 360° - AI
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              PRO
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

