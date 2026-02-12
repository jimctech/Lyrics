
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { Cover } from './components/Cover';
import { CategoryDetail } from './components/CategoryDetail';
import { SubCategoryDetail } from './components/SubCategoryDetail';
import { LyricView } from './components/LyricView';
import { Admin } from './components/Admin';
import { Settings } from './components/Settings';
import { Auth } from './components/Auth';
import { AddLyric } from './components/AddLyric';
import { db } from './db';
import { auth } from './firebase';
import { onAuthStateChanged } from "firebase/auth";
import { User } from './types';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await db.getUserProfile(firebaseUser.uid);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F5DC]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <ScrollToTop />
      <Layout>
        {!user ? (
          <Auth onAuth={() => {}} />
        ) : (
          <Routes>
            <Route path="/" element={<Cover />} />
            <Route path="/categories" element={<Home />} />
            <Route path="/category/:id" element={<CategoryDetail />} />
            <Route path="/subcategory/:id" element={<SubCategoryDetail />} />
            <Route path="/lyric/:id" element={<LyricView />} />
            <Route path="/add-lyric" element={<AddLyric />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/settings" element={<Settings onLogout={() => setUser(null)} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </Layout>
    </Router>
  );
};

export default App;
