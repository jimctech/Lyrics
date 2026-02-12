
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db';
import { Category, SubCategory } from '../types';

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
      
      {error && <div className="p-3 bg-red-50 text-red-600 text-center rounded-xl text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-right opacity-60 text-sm">عنوان (کیٹیگری) منتخب کریں</label>
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
            <label className="block text-right opacity-60 text-sm">ذیلی عنوان منتخب کریں</label>
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
            placeholder="مثلاً: تو شاہِ خوباں ہے"
            className="w-full p-3 bg-white border border-[#5D4037]/10 rounded-xl text-right outline-none"
            dir="rtl"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-right opacity-60 text-sm">کلام کی تحریر (Content)</label>
          <textarea 
            rows={10}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="یہاں کلام درج کریں..."
            className="w-full p-3 bg-white border border-[#5D4037]/10 rounded-xl text-right outline-none leading-relaxed"
            dir="rtl"
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#5D4037] text-white rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading && <div className="loading-spinner !border-white/30 !border-t-white"></div>}
          محفوظ کریں
        </button>
      </form>
    </div>
  );
};
