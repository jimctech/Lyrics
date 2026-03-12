
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
    return <div className="flex justify-center p-24"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="flex flex-col w-full min-h-screen relative page-transition">
      <div className="p-4 border-b border-[#D4AF37]/20 bg-[#FDFCF0]/50 backdrop-blur-md sticky top-16 z-40 space-y-4">
        <div className="relative">
          <input
            placeholder="کلام تلاش کریں..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-4 bg-white/80 border-2 border-[#D4AF37]/30 rounded-2xl text-right urdu-text outline-none focus:border-[#064E3B] transition-all shadow-sm"
            dir="rtl"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#064E3B" strokeWidth="3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>
        
        <div className="flex gap-2 justify-center">
           <button 
             onClick={() => setFilter('favs')}
             className={`px-6 py-2 rounded-full text-xs urdu-text font-bold transition-all ${filter === 'favs' ? 'bg-[#064E3B] text-[#FDFCF0] shadow-md' : 'bg-white text-[#064E3B] border border-[#D4AF37]/30'}`}
           >
             پسندیدہ کلام ({favorites.length})
           </button>
           <button 
             onClick={() => setFilter('all')}
             className={`px-6 py-2 rounded-full text-xs urdu-text font-bold transition-all ${filter === 'all' ? 'bg-[#064E3B] text-[#FDFCF0] shadow-md' : 'bg-white text-[#064E3B] border border-[#D4AF37]/30'}`}
           >
             تمام عنوانات
           </button>
        </div>
      </div>
      
      <div className="pb-24 px-4 pt-4 space-y-3">
        { (searchQuery.trim() || filter === 'favs') ? (
          filteredLyrics.length > 0 ? (
            filteredLyrics.map(lyric => (
              <Link key={lyric.id} to={`/lyric/${lyric.id}`} className="islamic-card flex justify-between items-center p-5 rounded-2xl active:scale-[0.98] transition-all border-r-4 border-r-[#D4AF37]">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={favorites.includes(lyric.id) ? "#8B0000" : "none"} stroke={favorites.includes(lyric.id) ? "#8B0000" : "currentColor"} strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                <span className="text-xl urdu-text text-right font-bold text-[#064E3B]">{lyric.title}</span>
              </Link>
            ))
          ) : (
            <div className="p-20 text-center urdu-text opacity-40">کوئی کلام نہیں ملا</div>
          )
        ) : (
          categories.map(cat => (
            <Link key={cat.id} to={`/category/${cat.id}`} className="islamic-card flex items-center justify-between p-6 rounded-2xl active:scale-[0.98] group transition-all border-l-4 border-l-[#D4AF37]">
              <svg className="opacity-10 group-active:opacity-100 transition-opacity" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#064E3B" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
              <div className="flex items-center gap-6">
                <span className="text-2xl urdu-text font-bold text-[#064E3B]">{cat.name}</span>
                <div className="w-10 h-10 rounded-xl bg-[#064E3B] flex items-center justify-center text-xs font-bold text-[#D4AF37] rotate-45 shadow-sm">
                  <span className="-rotate-45">{cat.serial}</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Floating Action Button - Enhanced */}
      <button 
        onClick={() => navigate('/add-lyric')}
        className="fixed bottom-24 right-6 w-16 h-16 bg-[#064E3B] text-[#D4AF37] rounded-full shadow-[0_10px_25px_rgba(6,78,59,0.4)] flex items-center justify-center active:scale-90 transition-all z-50 border-4 border-[#D4AF37]/50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>
  );
};
