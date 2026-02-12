
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../db';
import { DisplaySettings } from '../types';

const Header: React.FC<{ title?: string }> = ({ title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCover = location.pathname === '/';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#5D4037] text-white shadow-md flex items-center justify-between px-3 h-14">
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        {!isCover && (
          <button onClick={() => navigate(-1)} className="p-1 active:bg-white/10 rounded-full shrink-0 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
        )}
        <h1 className="text-xl urdu-text truncate font-medium pt-1 pr-2 flex-1 text-center">
          {title || "کلامِ رضا"}
        </h1>
      </div>
    </header>
  );
};

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#5D4037] text-white/60 flex items-center justify-around h-16 border-t border-white/10">
      <button 
        onClick={() => navigate('/')} 
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isActive('/') ? 'text-white' : 'hover:text-white/80'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={isActive('/') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span className="text-[10px] urdu-text">سرورق</span>
      </button>

      <button 
        onClick={() => navigate('/categories')} 
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isActive('/categories') ? 'text-white' : 'hover:text-white/80'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        <span className="text-[10px] urdu-text">فہرست</span>
      </button>

      <button 
        onClick={() => navigate('/settings')} 
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isActive('/settings') ? 'text-white' : 'hover:text-white/80'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span className="text-[10px] urdu-text">ترتیبات</span>
      </button>

      <button 
        onClick={() => navigate('/admin')} 
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${isActive('/admin') ? 'text-white' : 'hover:text-white/80'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span className="text-[10px] urdu-text">ایڈمن</span>
      </button>
    </nav>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [currentTitle, setCurrentTitle] = React.useState("");
  const [settings, setSettings] = React.useState<DisplaySettings>({
    backgroundColor: '#F5F5DC',
    textColor: '#1A0F0D',
    fontSize: 24,
    lineHeight: 2.5
  });

  React.useEffect(() => {
    const user = db.getCurrentUser();
    if (!user) return;

    // Fetch user settings asynchronously
    db.getSettings(user.id).then(setSettings);

    const path = location.pathname;
    const fetchTitle = async () => {
      if (path.startsWith('/lyric/')) {
        const id = path.split('/').pop();
        const lyrics = await db.getLyrics(user.id);
        const lyric = lyrics.find(l => l.id === id);
        if (lyric) setCurrentTitle(lyric.title);
      } else if (path.startsWith('/category/')) {
        const id = path.split('/').pop();
        const cats = await db.getCategories(user.id);
        const cat = cats.find(c => c.id === id);
        if (cat) setCurrentTitle(cat.name);
      } else if (path.startsWith('/subcategory/')) {
        const id = path.split('/').pop();
        const subs = await db.getSubCategories(user.id);
        const sub = subs.find(s => s.id === id);
        if (sub) setCurrentTitle(sub.name);
      } else if (path === '/categories') {
         setCurrentTitle("فہرست عنوانات");
      } else {
        setCurrentTitle("");
      }
    };
    fetchTitle();
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: settings.backgroundColor }}>
      <Header title={currentTitle} />
      <main className="w-full max-w-xl pt-14 pb-16 flex-grow flex flex-col" style={{ backgroundColor: settings.backgroundColor }}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
};
