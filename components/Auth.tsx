
import React, { useState } from 'react';
import { db } from '../db';

export const Auth: React.FC<{ onAuth: () => void }> = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '', name: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // In this implementation, we use email as the unique identifier for Firebase
        await db.login(formData.email, formData.password);
      } else {
        if (!formData.email.includes('@')) {
          throw new Error("براہ کرم درست ای میل درج کریں");
        }
        await db.register(formData);
      }
      onAuth();
    } catch (err: any) {
      setError(err.message || "کچھ غلط ہو گیا ہے");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 page-transition">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-[#5D4037]/5">
        <h2 className="text-3xl font-bold urdu-text text-center mb-8 text-[#5D4037]">
          {isLogin ? "لاگ ان کریں" : "نیا اکاؤنٹ بنائیں"}
        </h2>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 urdu-text text-center text-sm rounded-lg">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <input 
                placeholder="آپ کا نام" 
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg text-right urdu-text outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
              <input 
                placeholder="یوزر نیم (تلاش کے لیے)" 
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg text-right urdu-text outline-none"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                required
              />
              <input 
                placeholder="فون نمبر" 
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg text-right urdu-text outline-none"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </>
          )}
          <input 
            placeholder="ای میل" 
            type="email"
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg text-right urdu-text outline-none"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            required
          />
          <input 
            placeholder="پاس ورڈ" 
            type="password"
            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-lg text-right urdu-text outline-none"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            required
          />

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-[#5D4037] text-white rounded-full urdu-text text-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading && <div className="loading-spinner !w-5 !h-5 !border-white/30 !border-t-white"></div>}
            {isLogin ? "داخل ہوں" : "رجسٹر کریں"}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)} 
          className="w-full mt-6 text-[#5D4037]/60 urdu-text text-sm hover:text-[#5D4037]"
        >
          {isLogin ? "نیا اکاؤنٹ بنائیں؟" : "پہلے سے اکاؤنٹ موجود ہے؟"}
        </button>
      </div>
    </div>
  );
};
