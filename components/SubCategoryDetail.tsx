
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../db';
import { SubCategory, Lyric, DisplaySettings } from '../types';

export const SubCategoryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [subCategory, setSubCategory] = useState<SubCategory | null>(null);
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [settings, setSettings] = useState<DisplaySettings>({
    backgroundColor: '#F5F5DC',
    textColor: '#1A0F0D',
    fontSize: 24,
    lineHeight: 2.5
  });

  useEffect(() => {
    const user = db.getCurrentUser();
    if (id && user) {
      const fetchData = async () => {
        const [allSubs, lyricList, s] = await Promise.all([
          db.getSubCategories(user.id),
          db.getLyrics(user.id, id),
          db.getSettings(user.id)
        ]);
        const currentSub = allSubs.find(s => s.id === id);
        setSubCategory(currentSub || null);
        setLyrics(lyricList);
        setSettings(s);
      };
      fetchData();
    }
  }, [id]);

  if (!subCategory) return <div className="text-center p-10 urdu-text">ذیلی عنوان نہیں ملا</div>;

  return (
    <div className="flex flex-col w-full min-h-screen" style={{ backgroundColor: settings.backgroundColor }}>
      <div className="divide-y divide-black/5 p-2">
        {lyrics.length > 0 ? (
          lyrics.map((lyric) => (
            <Link
              key={lyric.id}
              to={`/lyric/${lyric.id}`}
              className="flex items-center justify-between p-5 active:bg-black/5 transition-colors group"
            >
              <svg className="opacity-10" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              <div className="flex items-center gap-4">
                <span className="text-2xl urdu-text font-medium" style={{ color: settings.textColor }}>{lyric.title}</span>
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-xs font-bold text-[#5D4037]/60 group-active:bg-[#5D4037] group-active:text-white transition-colors">
                  {lyric.serial}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-20 opacity-30 urdu-text italic">اس ذیلی عنوان میں کوئی کلام موجود نہیں ہے</div>
        )}
      </div>
    </div>
  );
};
