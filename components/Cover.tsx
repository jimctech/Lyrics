
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { COLORS } from '../constants';
import { db } from '../db';
import { GlobalSettings } from '../types';

const FastQuranLogo = () => (
  <svg width="220" height="220" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="256" cy="256" r="240" fill="#064E3B" fillOpacity="0.05"/>
    <circle cx="256" cy="256" r="220" stroke="#D4AF37" strokeWidth="4" strokeDasharray="15 15"/>
    <path d="M256 80L280 160H360L295 210L320 290L256 240L192 290L217 210L152 160H232L256 80Z" fill="#D4AF37"/>
    <path d="M256 432C158.799 432 80 353.201 80 256S158.799 80 256 80s176 78.799 176 176-78.799 176-176 176zm0-320c-79.402 0-144 64.598-144 144s64.598 144 144 144 144-64.598 144-144-64.598-144-144-144z" fill="#064E3B"/>
    <text x="256" y="285" textAnchor="middle" fontSize="75" fill="#064E3B" className="urdu-text font-bold" style={{ direction: 'rtl' }}>قرآن</text>
  </svg>
);

const DecorativeCorner = ({ className }: { className?: string }) => (
  <svg className={className} width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0C50 0 100 50 100 100" stroke="#D4AF37" strokeWidth="3" opacity="0.3"/>
    <circle cx="0" cy="0" r="15" fill="#D4AF37" opacity="0.1"/>
    <path d="M30 0C30 40 40 70 100 70" stroke="#D4AF37" strokeWidth="1" opacity="0.2" strokeDasharray="5 5"/>
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
    <div className="flex flex-col items-center justify-center h-full text-center space-y-12 py-10 min-h-[75vh] relative overflow-hidden">
      {/* Manuscript Decorative Corners */}
      <DecorativeCorner className="absolute top-2 left-2" />
      <DecorativeCorner className="absolute top-2 right-2 rotate-90" />
      <DecorativeCorner className="absolute bottom-2 right-2 rotate-180" />
      <DecorativeCorner className="absolute bottom-2 left-2 -rotate-90" />
      
      {/* Background Motifs */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
        <svg width="600" height="600" viewBox="0 0 100 100">
           <path d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" fill="#D4AF37" />
        </svg>
      </div>

      {/* Central Motif Area */}
      <div className="relative w-64 h-64 flex items-center justify-center animate-fadeIn">
        <div className="absolute inset-0 border-4 border-[#D4AF37] rotate-45 opacity-20 shadow-[0_0_20px_rgba(212,175,55,0.2)]"></div>
        <div className="absolute inset-6 border-2 border-[#064E3B] opacity-15"></div>
        
        <div className="relative z-10 w-52 h-52 flex items-center justify-center overflow-hidden rounded-full bg-white/40 backdrop-blur-sm border border-[#D4AF37]/30">
          {globalSettings.logoUrl ? (
            <img 
              src={globalSettings.logoUrl} 
              alt="Custom Logo" 
              className="w-full h-full object-contain p-6"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <FastQuranLogo />
          )}
        </div>
      </div>

      <div className="space-y-6 relative z-20">
        <h1 className="text-4xl font-bold urdu-text leading-tight tracking-wide drop-shadow-sm" style={{ color: '#064E3B' }}>
          کلامِ رضا
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto opacity-60"></div>
        <p className="text-xl urdu-text font-bold" style={{ color: '#8B0000' }}>
          مجموعہ نعت و منقبت
        </p>
      </div>

      <div className="flex flex-col space-y-6 w-full items-center relative z-20">
        <Link 
          to="/categories" 
          className="w-56 py-3 border-2 border-[#D4AF37] text-[#064E3B] font-bold text-2xl urdu-text hover:bg-[#064E3B] hover:text-[#FDFCF0] transition-all shadow-[0_4px_10px_rgba(212,175,55,0.2)] active:translate-y-1 bg-[#FDFCF0]/80 backdrop-blur-md rounded-lg"
        >
          فہرست دیکھیں
        </Link>
        <div className="flex items-center gap-3">
           <div className="h-[1px] w-8 bg-[#D4AF37]/30"></div>
           <p className="text-[12px] uppercase tracking-[0.2em] text-[#064E3B] opacity-60 font-bold">Islamic Digital Library</p>
           <div className="h-[1px] w-8 bg-[#D4AF37]/30"></div>
        </div>
      </div>
    </div>
  );
};
