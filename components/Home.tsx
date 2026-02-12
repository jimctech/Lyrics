
import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../db';
import { Category, Lyric } from '../types';

export const Home: React.FC = () => {
  const user = db.getCurrentUser();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [allLyrics, setAllLyrics] = useState<Lyric[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favs'>('all');

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const [cats, lyrics, favs] = await Promise.all([
            db.getCategories(user.id),
            db.getLyrics(user.id),
            db.getFavorites(user.id)
          ]);
          setCategories(cats);
          setAllLyrics(lyrics);
          setFavorites(favs);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user]);

  const filteredLyrics = useMemo(() => {
    let list = allLyrics;
    if (filter === 'favs') {
      list = list.filter(l => favorites.includes(l.id));
    }
    if (!searchQuery.trim()) return filter === 'favs' ? list : [];
    
    const query = searchQuery.toLowerCase();
    return list.filter(lyric => 
      lyric.title.toLowerCase().includes(query) || 
      lyric.content.toLowerCase().includes(query)
    );
  }, [searchQuery, allLyrics, filter, favorites]);

  if (loading) {
    return <div className="flex justify-center p-20"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="flex flex-col w-full min-h-screen relative">
      <div className="p-4 border-b border-black/5 bg-white/30 backdrop-blur-sm sticky top-14 z-40 space-y-3">
        <input
          placeholder="کلام تلاش کریں..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 bg-white/70 border border-[#5D4037]/20 rounded-xl text-right urdu-text outline-none focus:border-[#5D4037] transition-all"
          dir="rtl"
        />
        <div className="flex gap-2 justify-center">
           <button 
             onClick={() => setFilter('favs')}
             className={`px-4 py-1 rounded-full text-xs urdu-text transition-all ${filter === 'favs' ? 'bg-[#5D4037] text-white' : 'bg-white text-[#5D4037] border border-[#5D4037]/10'}`}
           >
             پسندیدہ کلام ({favorites.length})
           </button>
           <button 
             onClick={() => setFilter('all')}
             className={`px-4 py-1 rounded-full text-xs urdu-text transition-all ${filter === 'all' ? 'bg-[#5D4037] text-white' : 'bg-white text-[#5D4037] border border-[#5D4037]/10'}`}
           >
             تمام عنوانات
           </button>
        </div>
      </div>
      
      <div className="divide-y divide-black/5 pb-20 page-transition">
        { (searchQuery.trim() || filter === 'favs') ? (
          filteredLyrics.length > 0 ? (
            filteredLyrics.map(lyric => (
              <Link key={lyric.id} to={`/lyric/${lyric.id}`} className="flex justify-between items-center p-5 active:bg-black/5 bg-white/40 mb-1 border-y border-black/5">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={favorites.includes(lyric.id) ? "red" : "none"} stroke={favorites.includes(lyric.id) ? "red" : "currentColor"} strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                <span className="text-xl urdu-text text-right">{lyric.title}</span>
              </Link>
            ))
          ) : (
            <div className="p-20 text-center urdu-text opacity-40">کوئی کلام نہیں ملا</div>
          )
        ) : (
          categories.map(cat => (
            <Link key={cat.id} to={`/category/${cat.id}`} className="flex items-center justify-between p-6 active:bg-black/5 group bg-white/40 mb-1 border-y border-black/5">
              <svg className="opacity-10 group-active:opacity-100" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5D4037" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
              <div className="flex items-center gap-4">
                <span className="text-2xl urdu-text font-medium">{cat.name}</span>
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-xs font-bold text-[#5D4037]/60">
                  {cat.serial}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Floating Action Button for Adding Lyric */}
      <button 
        onClick={() => navigate('/add-lyric')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#2E7D32] text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-all z-50 border-4 border-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
  );
};
