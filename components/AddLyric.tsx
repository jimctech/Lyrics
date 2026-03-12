
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { Category, SubCategory } from '../types';
import { GoogleGenAI } from "@google/genai";

export const AddLyric: React.FC = () => {
  const user = db.getCurrentUser();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedSubId, setSelectedSubId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      db.getCategories(user.id).then(setCategories);
    }
  }, [user]);

  useEffect(() => {
    if (user && selectedCatId) {
      db.getSubCategories(user.id, selectedCatId).then(setSubCategories);
      setSelectedSubId('');
    } else {
      setSubCategories([]);
    }
  }, [selectedCatId, user]);

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a master Urdu poet. Write 4-6 verses (Misras) of Urdu poetry on the theme: "${aiPrompt}". Use classical Urdu vocabulary and proper poetic rhythm. Output ONLY the Urdu text, no English.`,
      });
      setContent(response.text || '');
      setAiPrompt('');
    } catch (err) {
      setError("AI سے کلام حاصل کرنے میں دشواری ہوئی۔");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedSubId || !title.trim() || !content.trim()) {
      setError("براہ کرم تمام معلومات درج کریں");
      return;
    }

    setLoading(true);
    try {
      const lyricCount = (await db.getLyrics(user.id, selectedSubId)).length;
      await db.addLyric(user.id, {
        subCategoryId: selectedSubId,
        title: title.trim(),
        content: content.trim(),
        serial: lyricCount + 1
      });
      navigate(`/subcategory/${selectedSubId}`);
    } catch (err) {
      setError("کلام محفوظ کرنے میں دشواری ہوئی");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 urdu-text space-y-6 pb-24 page-transition">
      <h2 className="text-3xl font-bold text-[#5D4037] text-center">نیا کلام شامل کریں</h2>
      
      {/* AI Assistant Section */}
      <div className="bg-[#2E7D32]/5 p-5 rounded-2xl border border-[#2E7D32]/10 space-y-3">
        <h3 className="text-sm font-bold text-[#2E7D32] text-right">AI شاعر (مدد حاصل کریں)</h3>
        <div className="flex gap-2">
           <button 
             onClick={generateWithAI}
             disabled={aiLoading}
             className="bg-[#2E7D32] text-white px-4 rounded-xl text-xs font-bold disabled:opacity-50"
           >
             {aiLoading ? "..." : "لکھیں"}
           </button>
           <input 
             value={aiPrompt}
             onChange={e => setAiPrompt(e.target.value)}
             placeholder="موضوع درج کریں (مثلاً: نعتِ پاک)"
             className="flex-1 p-2 text-xs bg-white border border-[#2E7D32]/20 rounded-xl text-right outline-none"
             dir="rtl"
           />
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 text-center rounded-xl text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-right opacity-60 text-sm">عنوان (کیٹیگری)</label>
          <select 
            value={selectedCatId}
            onChange={(e) => setSelectedCatId(e.target.value)}
            className="w-full p-3 bg-white border border-[#5D4037]/10 rounded-xl text-right outline-none appearance-none"
            dir="rtl"
          >
            <option value="">انتخاب کریں...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {selectedCatId && (
          <div className="space-y-2">
            <label className="block text-right opacity-60 text-sm">ذیلی عنوان</label>
            <select 
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
              className="w-full p-3 bg-white border border-[#5D4037]/10 rounded-xl text-right outline-none appearance-none"
              dir="rtl"
            >
              <option value="">انتخاب کریں...</option>
              {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-right opacity-60 text-sm">کلام کا نام (Title)</label>
          <input 
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="کلام کا عنوان..."
            className="w-full p-3 bg-white border border-[#5D4037]/10 rounded-xl text-right outline-none"
            dir="rtl"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-right opacity-60 text-sm">کلام کی تحریر (Content)</label>
          <textarea 
            rows={8}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="یہاں کلام درج کریں یا AI سے مدد لیں..."
            className="w-full p-3 bg-white border border-[#5D4037]/10 rounded-xl text-right outline-none leading-relaxed min-h-[200px]"
            dir="rtl"
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#5D4037] text-white rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading && <div className="loading-spinner !border-white/30 !border-t-white"></div>}
          لائبریری میں شامل کریں
        </button>
      </form>
    </div>
  );
};
