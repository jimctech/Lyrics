
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { User, UserRole, GlobalSettings, Category } from '../types';

export const Admin: React.FC = () => {
  const currentUser = db.getCurrentUser();
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'content'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [globals, setGlobals] = useState<GlobalSettings>({ isSignupEnabled: true, isLoginEnabled: true });
  const [logoInput, setLogoInput] = useState('');
  const [catInput, setCatInput] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allUsers, currentGlobals, cats] = await Promise.all([
          db.getAllUsers(),
          db.getGlobalSettings(),
          currentUser ? db.getCategories(currentUser.id) : Promise.resolve([])
        ]);
        setUsers(allUsers);
        setGlobals(currentGlobals);
        setLogoInput(currentGlobals.logoUrl || '');
        setCategories(cats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  if (currentUser?.role !== UserRole.ADMIN) {
    return <div className="p-10 text-center urdu-text">آپ کے پاس ایڈمن کے اختیارات نہیں ہیں۔</div>;
  }

  const toggleGlobal = async (key: keyof GlobalSettings) => {
    const next = { ...globals, [key]: !globals[key] };
    setGlobals(next);
    await db.saveGlobalSettings(next);
  };

  const handleAddCategory = async () => {
    if (!catInput.trim()) return;
    await db.addCategory(currentUser.id, catInput);
    setCatInput('');
    const cats = await db.getCategories(currentUser.id);
    setCategories(cats);
    setSaveMsg('عنوان شامل کر دیا گیا');
    setTimeout(() => setSaveMsg(''), 2000);
  };

  if (loading) return <div className="flex justify-center p-20"><div className="loading-spinner"></div></div>;

  return (
    <div className="p-6 urdu-text space-y-6 pb-24 h-full overflow-y-auto">
      <div className="flex bg-white/50 p-1 rounded-xl shadow-inner mb-6">
        <button onClick={() => setActiveTab('content')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'content' ? 'bg-[#5D4037] text-white shadow-md' : 'text-[#5D4037]/60'}`}>لائبریری</button>
        <button onClick={() => setActiveTab('settings')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'settings' ? 'bg-[#5D4037] text-white shadow-md' : 'text-[#5D4037]/60'}`}>سیٹنگز</button>
        <button onClick={() => setActiveTab('users')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'users' ? 'bg-[#5D4037] text-white shadow-md' : 'text-[#5D4037]/60'}`}>صارفین</button>
      </div>

      {activeTab === 'content' && (
        <section className="space-y-4 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#5D4037]/5 space-y-4">
            <h3 className="text-lg font-bold opacity-40 uppercase text-right">نیا عنوان شامل کریں</h3>
            <div className="flex gap-2">
              <button onClick={handleAddCategory} className="bg-[#5D4037] text-white px-4 rounded-xl text-sm font-bold">شامل کریں</button>
              <input 
                value={catInput} 
                onChange={e => setCatInput(e.target.value)} 
                className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-right" 
                placeholder="عنوان کا نام" 
              />
            </div>
            {saveMsg && <div className="text-center text-xs text-green-600">{saveMsg}</div>}
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-bold opacity-40 text-right">موجودہ عنوانات</h3>
            {categories.map(c => (
              <div key={c.id} className="bg-white/70 p-4 rounded-xl flex justify-between items-center">
                 <span className="text-xs opacity-30">Serial: {c.serial}</span>
                 <span className="font-bold">{c.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 animate-fadeIn">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-[#5D4037]/5 space-y-4">
            <h3 className="text-lg font-bold opacity-40 uppercase">لوگو مینجمنٹ</h3>
            <input type="text" value={logoInput} onChange={e => setLogoInput(e.target.value)} className="w-full p-2 border border-gray-100 rounded-lg text-left font-mono text-xs outline-none" placeholder="لوگو URL" />
            <button onClick={async () => { await db.saveGlobalSettings({ ...globals, logoUrl: logoInput }); setSaveMsg('محفوظ کر لیا گیا'); setTimeout(()=>setSaveMsg(''), 2000); }} className="w-full py-2 bg-[#5D4037] text-white rounded-lg text-sm font-bold">لوگو محفوظ کریں</button>
            {saveMsg && activeTab === 'settings' && <div className="text-center text-xs text-green-600">{saveMsg}</div>}
          </section>
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-[#5D4037]/5 space-y-4">
            <h3 className="text-lg font-bold opacity-40 uppercase">سسٹم کنٹرول</h3>
            <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
              <button onClick={() => toggleGlobal('isSignupEnabled')} className={`px-4 py-1 rounded-full text-xs font-bold ${globals.isSignupEnabled ? 'bg-green-600' : 'bg-red-600'} text-white`}>{globals.isSignupEnabled ? 'آن' : 'آف'}</button>
              <span className="font-medium text-right">رجسٹریشن</span>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'users' && (
        <section className="space-y-3 animate-fadeIn">
          <h3 className="text-lg font-bold opacity-40 text-right">صارفین ({users.length})</h3>
          {users.map(u => (
            <div key={u.id} className="bg-white p-4 rounded-xl border border-[#5D4037]/5 flex items-center justify-between gap-4">
              <button onClick={async () => { await db.updateUser(u.id, { isEnabled: !u.isEnabled }); setUsers(await db.getAllUsers()); }} disabled={u.id === currentUser.id} className={`text-[10px] px-3 py-1 rounded-lg font-bold border ${u.isEnabled ? 'text-red-600 border-red-100 bg-red-50' : 'text-green-600 border-green-100 bg-green-50'} disabled:opacity-20`}>{u.isEnabled ? "معطل" : "بحال"}</button>
              <div className="text-right flex-1 truncate">
                <div className="font-bold text-[#5D4037]">{u.name || u.username}</div>
                <div className="text-[10px] opacity-40">{u.email}</div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
