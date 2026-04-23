
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../db';
import { Category, SubCategory, DisplaySettings } from '../types';

export const CategoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [settings, setSettings] = useState<DisplaySettings>({
    backgroundColor: '#F5F5DC',
    textColor: '#1A0F0D',
    fontSize: 24,
    lineHeight: 2.5
  });

  const loadData = async () => {
    const user = db.getCurrentUser();
    if (id && user) {
      const [allCats, subs, s] = await Promise.all([
        db.getCategories(user.id),
        db.getSubCategories(user.id, id),
        db.getSettings(user.id)
      ]);
      setCategory(allCats.find(c => c.id === id) || null);
      setSubCategories(subs);
      setSettings(s);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const handleAddSub = async () => {
    const user = db.getCurrentUser();
    if (!user || !id || !newSubName.trim()) return;
    try {
      await db.addSubCategory(user.id, id, newSubName);
      setNewSubName('');
      await loadData();
    } catch (e) {
      console.error(e);
      alert("محفوظ کرنے میں غلطی ہوئی۔");
    }
  };

  if (!category) return <div className="text-center p-10 urdu-text">عنوان نہیں ملا</div>;

  return (
    <div className="flex flex-col w-full min-h-screen" style={{ backgroundColor: settings.backgroundColor }}>
      {/* Add New Subcategory Input */}
      <div className="p-4 bg-white/40 border-b border-black/5 flex gap-2">
         <button 
           onClick={handleAddSub}
           className="bg-[#5D4037] text-white px-5 rounded-xl text-sm font-bold urdu-text pt-1"
         >
           شامل کریں
         </button>
         <input 
           value={newSubName}
           onChange={e => setNewSubName(e.target.value)}
           placeholder="نیا ذیلی عنوان..."
           className="flex-1 p-3 bg-white/70 border border-[#5D4037]/10 rounded-xl text-right urdu-text outline-none"
           dir="rtl"
         />
      </div>

      <div className="divide-y divide-black/5 p-2">
        {subCategories.length > 0 ? (
          subCategories.map((sub) => (
            <Link
              key={sub.id}
              to={`/subcategory/${sub.id}`}
              className="flex items-center justify-between p-5 active:bg-black/5 transition-colors group"
            >
              <svg className="opacity-10" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              <div className="flex items-center gap-4">
                <span className="text-2xl urdu-text font-medium" style={{ color: settings.textColor }}>{sub.name}</span>
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-xs font-bold text-[#5D4037]/60">
                  {sub.serial}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 opacity-30 urdu-text italic">کوئی ذیلی عنوان موجود نہیں ہے</div>
        )}
      </div>
    </div>
  );
};
