
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { COLORS } from '../constants';
import { db } from '../db';
import { GlobalSettings } from '../types';

const FastQuranLogo = () => (
  <svg width="200" height="200" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M256 0C114.615 0 0 114.615 0 256s114.615 256 256 256 256-114.615 256-256S397.385 0 256 0z" fill="#FF9800" fillOpacity="0.1"/>
    <circle cx="256" cy="256" r="230" stroke="#5D4037" strokeWidth="2" strokeDasharray="10 10" opacity="0.2"/>
    <path d="M256 80L280 160H360L295 210L320 290L256 240L192 290L217 210L152 160H232L256 80Z" fill="#FF9800"/>
    <path d="M256 432C158.799 432 80 353.201 80 256S158.799 80 256 80s176 78.799 176 176-78.799 176-176 176zm0-320c-79.402 0-144 64.598-144 144s64.598 144 144 144 144-64.598 144-144-64.598-144-144-144z" fill="#5D4037"/>
    <text x="256" y="280" textAnchor="middle" fontSize="70" fill="#5D4037" className="urdu-text font-bold" style={{ direction: 'rtl' }}>قرآن</text>
  </svg>
);

const DecorativeCorner = ({ className }: { className?: string }) => (
  <svg className={className} width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0C50 0 100 50 100 100" stroke="#5D4037" strokeWidth="2" opacity="0.1"/>
    <circle cx="0" cy="0" r="10" fill="#5D4037" opacity="0.05"/>
    <path d="M20 0C20 40 40 60 80 60" stroke="#5D4037" strokeWidth="1" opacity="0.05" strokeDasharray="4 4"/>
  </svg>
);

export const Cover: React.FC = () => {
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({
    isSignupEnabled: true,
    isLoginEnabled: true
  });

  useEffect(() => {
    db.getGlobalSettings().then(setGlobalSettings);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-10 py-6 min-h-[70vh] relative overflow-hidden">
      {/* Decorative Elements */}
      <DecorativeCorner className="absolute top-0 left-0" />
      <DecorativeCorner className="absolute top-0 right-0 rotate-90" />
      <DecorativeCorner className="absolute bottom-0 right-0 rotate-180" />
      <DecorativeCorner className="absolute bottom-0 left-0 -rotate-90" />
      
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
        <svg width="400" height="400" viewBox="0 0 24 24" fill="#5D4037">
           <path d="M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z" />
        </svg>
      </div>

      {/* Elegant Islamic Central Motif */}
      <div className="relative w-56 h-56 flex items-center justify-center animate-fadeIn">
        <div className="absolute inset-0 border-2 border-[#5D4037] rotate-45 opacity-10"></div>
        <div className="absolute inset-4 border border-[#5D4037] opacity-20"></div>
        
        <div className="relative z-10 w-48 h-48 flex items-center justify-center overflow-hidden rounded-full">
          {globalSettings.logoUrl ? (
            <img 
              src={globalSettings.logoUrl} 
              alt="Custom Logo" 
              className="w-full h-full object-contain p-4"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <FastQuranLogo />
          )}
        </div>
      </div>

      <div className="space-y-4 relative z-20">
        <h1 className="text-3xl font-bold urdu-text leading-tight tracking-wide" style={{ color: COLORS.GREEN }}>
          کلامِ رضا
        </h1>
        <div className="w-16 h-0.5 bg-[#5D4037] mx-auto opacity-30"></div>
        <p className="text-lg urdu-text opacity-80 font-medium" style={{ color: COLORS.RED }}>
          مجموعہ نعت و منقبت
        </p>
      </div>

      <div className="flex flex-col space-y-4 w-full items-center relative z-20">
        <Link 
          to="/categories" 
          className="w-48 py-2 border-2 border-[#5D4037] text-[#5D4037] font-bold text-xl urdu-text hover:bg-[#5D4037] hover:text-white transition-all shadow-sm active:translate-y-1 bg-white/50 backdrop-blur-sm"
        >
          فہرست دیکھیں
        </Link>
        <p className="text-[10px] uppercase tracking-widest text-[#5D4037] opacity-40 font-bold">Islamic Digital Library</p>
      </div>
    </div>
  );
};
