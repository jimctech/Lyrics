
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { DisplaySettings, User } from '../types';

export const Settings: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [settings, setSettings] = useState<DisplaySettings>({
    backgroundColor: '#F5F5DC',
    textColor: '#1A0F0D',
    fontSize: 24,
    lineHeight: 2.5
  });
  const [user, setUser] = useState<User>(db.getCurrentUser()!);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    if (user) {
      db.getSettings(user.id).then(setSettings);
    }
  }, [user]);

  const updateSetting = async (key: keyof DisplaySettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await db.saveSettings(user.id, newSettings);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.updateUser(user.id, user);
    setProfileMsg("پروفائل اپ ڈیٹ ہو گئی");
    setTimeout(() => setProfileMsg(''), 3000);
  };

  return (
    <div className="flex flex-col w-full h-full p-6 animate-fadeIn urdu-text space-y-10 pb-20">
      <h2 className="text-3xl font-bold text-center" style={{ color: '#5D4037' }}>ترتیبات و پروفائل</h2>

      {/* Profile Section */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-[#5D4037]/5 space-y-4">
        <h3 className="text-lg font-bold opacity-40 uppercase tracking-widest text-right">آپ کی معلومات</h3>
        {profileMsg && <div className="p-2 bg-green-50 text-green-600 text-center text-xs rounded-lg">{profileMsg}</div>}
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <input 
            value={user.name} 
            onChange={e => setUser({...user, name: e.target.value})}
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg text-right" 
            placeholder="نام"
          />
          <input 
            value={user.email} 
            onChange={e => setUser({...user, email: e.target.value})}
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg text-right" 
            placeholder="ای میل"
          />
          <input 
            value={user.phone} 
            onChange={e => setUser({...user, phone: e.target.value})}
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg text-right" 
            placeholder="فون نمبر"
          />
          <input 
            type="password"
            value={user.password || ''} 
            onChange={e => setUser({...user, password: e.target.value})}
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg text-right" 
            placeholder="نیا پاس ورڈ"
          />
          <button type="submit" className="w-full py-3 bg-[#5D4037] text-white rounded-xl text-sm font-bold">محفوظ کریں</button>
        </form>
      </section>

      {/* Visual Settings Section */}
      <section className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold opacity-40 uppercase tracking-widest">تحریر کا سائز</h3>
            <span className="text-xs font-bold font-sans">{settings.fontSize}px</span>
          </div>
          <input
            type="range"
            min="16"
            max="40"
            value={settings.fontSize}
            onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
            className="w-full h-1.5 bg-[#5D4037]/10 rounded-lg appearance-none cursor-pointer accent-[#5D4037]"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold opacity-40 uppercase tracking-widest">سطروں کا فاصلہ</h3>
            <span className="text-xs font-bold font-sans">{settings.lineHeight.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="1.5"
            max="3.5"
            step="0.1"
            value={settings.lineHeight}
            onChange={(e) => updateSetting('lineHeight', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#5D4037]/10 rounded-lg appearance-none cursor-pointer accent-[#5D4037]"
          />
        </div>
      </section>

      <div className="pt-4 space-y-3">
        <button 
          onClick={() => { db.logout(); onLogout(); }}
          className="w-full py-4 bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-700/20"
        >
          لاگ آؤٹ کریں
        </button>
      </div>
    </div>
  );
};
