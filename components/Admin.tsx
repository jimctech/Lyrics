
import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { User, UserRole, GlobalSettings, Category } from '../types';

export const Admin: React.FC = () => {
  const currentUser = db.getCurrentUser();
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'content'>('content');
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [globals, setGlobals] = useState<GlobalSettings>({ isSignupEnabled: true, isLoginEnabled: true });
  const [logoInput, setLogoInput] = useState('');
  const [catInput, setCatInput] = useState('');
  const [subInput, setSubInput] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserName, setNewUserName] = useState('');

  const fetchData = async () => {
    try {
      const [allUsers, currentGlobals, cats, allSubs] = await Promise.all([
        db.getAllUsers(),
        db.getGlobalSettings(),
        currentUser ? db.getCategories(currentUser.id) : Promise.resolve([]),
        currentUser ? db.getSubCategories(currentUser.id) : Promise.resolve([])
      ]);
      setUsers(allUsers);
      setGlobals(currentGlobals);
      setLogoInput(currentGlobals.logoUrl || '');
      setCategories(cats);
      setSubCategories(allSubs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  if (currentUser?.role !== UserRole.ADMIN) {
    return <div className="p-10 text-center urdu-text">آپ کے پاس ایڈمن کے اختیارات نہیں ہیں۔</div>;
  }

  const handleAddUser = async () => {
    if (!newUserEmail.trim() || !newUserPass.trim()) {
      setSaveMsg('ای میل اور پاس ورڈ ضروری ہے');
      return;
    }
    try {
      setLoading(true);
      await db.adminAddUser({
        email: newUserEmail,
        password: newUserPass,
        name: newUserName
      });
      setNewUserEmail('');
      setNewUserPass('');
      setNewUserName('');
      await fetchData();
      setSaveMsg('نیا صارف شامل کر دیا گیا');
    } catch (e: any) {
      console.error(e);
      setSaveMsg(`غلطی: ${e.message || 'صارف شامل نہیں ہو سکا'}`);
    } finally {
      setLoading(false);
      setTimeout(() => setSaveMsg(''), 5000);
    }
  };

  const handleSyncLibrary = async () => {
    if (!currentUser) return;
    setSyncing(true);
    try {
      await db.seedUserData(currentUser.id);
      await fetchData();
      setSaveMsg('لائبریری سنک ہو گئی (Success)');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err: any) {
      setSaveMsg(`غلطی: ${err.message || 'سنک فیل ہو گیا'}`);
    } finally {
      setSyncing(false);
    }
  };

  const toggleGlobal = async (key: keyof GlobalSettings) => {
    try {
      const next = { ...globals, [key]: !globals[key] };
      setGlobals(next);
      await db.saveGlobalSettings(next);
    } catch (err: any) {
      setSaveMsg(`غلطی: سیٹنگز تبدیل نہیں ہو سکیں`);
    }
  };

  const handleAddCategory = async () => {
    if (!catInput.trim() || !currentUser) {
      setSaveMsg('برائے مہربانی نام درج کریں');
      return;
    }
    try {
      setLoading(true);
      // If an admin has a user selected, they add it to THAT user's library
      const targetUserId = selectedUserId || currentUser.id;
      await db.addCategory(targetUserId, catInput);
      setCatInput('');
      await fetchData();
      setSaveMsg(selectedUserId ? 'صارف کے لیے عنوان حاصل کر لیا گیا' : 'عنوان شامل کر دیا گیا');
    } catch (e: any) {
      console.error(e);
      setSaveMsg(`غلطی: ${e.message || 'محفوظ نہیں ہو سکا'}`);
    } finally {
      setLoading(false);
      setTimeout(() => setSaveMsg(''), 5000);
    }
  };

  const handleAddSubCategory = async () => {
    if (!subInput.trim() || !selectedCatId || !currentUser) {
      setSaveMsg('تمام معلومات مکمل کریں');
      return;
    }
    try {
      setLoading(true);
      const targetUserId = selectedUserId || currentUser.id;
      await db.addSubCategory(targetUserId, selectedCatId, subInput);
      setSubInput('');
      setSelectedCatId('');
      await fetchData();
      setSaveMsg(selectedUserId ? 'صارف کے لیے ذیلی عنوان شامل کر دیا گیا' : 'ذیلی عنوان شامل کر دیا گیا');
    } catch (e: any) {
      console.error(e);
      setSaveMsg(`غلطی: ${e.message || 'محفوظ نہیں ہو سکا'}`);
    } finally {
      setLoading(false);
      setTimeout(() => setSaveMsg(''), 5000);
    }
  };

  const handleDeleteCategory = async (uid: string, catId: string) => {
    if (!window.confirm('کیا آپ واقعی یہ عنوان ختم کرنا چاہتے ہیں؟')) return;
    try {
      await db.deleteCategory(uid, catId);
      await fetchData();
      setSaveMsg('عنوان ختم کر دیا گیا');
    } catch (e) {
      setSaveMsg('ختم کرنے میں غلطی ہوئی');
    } finally {
      setTimeout(() => setSaveMsg(''), 2000);
    }
  };

  const handleDeleteSub = async (uid: string, subId: string) => {
    if (!window.confirm('کیا آپ واقعی یہ ذیلی عنوان ختم کرنا چاہتے ہیں؟')) return;
    try {
      await db.deleteSubCategory(uid, subId);
      await fetchData();
      setSaveMsg('ذیلی عنوان ختم کر دیا گیا');
    } catch (e) {
      setSaveMsg('ختم کرنے میں غلطی ہوئی');
    } finally {
      setTimeout(() => setSaveMsg(''), 2000);
    }
  };

  const filteredCategories = selectedUserId 
    ? categories.filter(c => c.userId === selectedUserId)
    : categories;

  const filteredSubCategories = selectedUserId
    ? subCategories.filter(s => s.userId === selectedUserId)
    : subCategories;

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
          {saveMsg && (
            <div className="bg-[#064E3B] text-white p-4 rounded-xl text-center urdu-text font-bold shadow-lg animate-bounce z-50 sticky top-0 border-2 border-[#D4AF37]">
              {saveMsg}
            </div>
          )}
          <div className="bg-[#064E3B]/5 p-4 rounded-xl border border-[#064E3B]/10 flex justify-between items-center">
             <button 
               onClick={handleSyncLibrary}
               disabled={syncing}
               className="bg-[#064E3B] text-[#D4AF37] px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-2"
             >
               {syncing && <div className="loading-spinner !w-3 !h-3 !border-[#D4AF37]/30 !border-t-[#D4AF37]"></div>}
               ڈیفالٹ لائبریری لوڈ کریں
             </button>
             <span className="text-[10px] opacity-60 text-right leading-tight">اگر کیٹیگریز خالی ہیں تو <br/> یہاں سے لوڈ کریں</span>
          </div>

          {/* Create Category */}
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
          </div>

          {/* Create Subcategory */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#5D4037]/5 space-y-4">
            <h3 className="text-lg font-bold opacity-40 uppercase text-right">نیا ذیلی عنوان شامل کریں</h3>
            <div className="space-y-3">
              <select 
                value={selectedCatId}
                onChange={e => setSelectedCatId(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-right appearance-none font-bold"
              >
                <option value="">...عنوان منتخب کریں</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button onClick={handleAddSubCategory} className="bg-[#5D4037] text-white px-4 rounded-xl text-sm font-bold active:scale-95 transition-all">شامل کریں</button>
                <input 
                  value={subInput} 
                  onChange={e => setSubInput(e.target.value)} 
                  className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl text-right" 
                  placeholder="ذیلی عنوان کا نام" 
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
             <div className="flex justify-between items-center px-1">
               <button onClick={() => setSelectedUserId(null)} className={`text-[10px] font-bold ${!selectedUserId ? 'text-[#5D4037]' : 'opacity-40'}`}>تمام دکھائیں</button>
               <h3 className="text-sm font-bold opacity-40 text-right">لائبریری کی فہرست</h3>
             </div>
            
            <div className="grid grid-cols-1 gap-2">
              {filteredCategories.map(c => (
                <div key={c.id} className="bg-white/70 p-4 rounded-xl space-y-2 group">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleDeleteCategory(c.userId!, c.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                        <span className="text-[10px] opacity-30">User: {users.find(u => u.id === c.userId)?.username || 'Unknown'}</span>
                      </div>
                      <span className="font-bold flex items-center gap-2">
                        <span className="text-[10px] bg-[#5D4037] text-white px-2 rounded-full">Category</span>
                        {c.name}
                      </span>
                   </div>
                   <div className="pl-4 border-l-2 border-[#5D4037]/10 space-y-1">
                      {filteredSubCategories.filter(s => s.categoryId === c.id).map(s => (
                        <div key={s.id} className="text-[11px] opacity-60 text-right flex justify-between items-center group/sub">
                           <button 
                             onClick={() => handleDeleteSub(s.userId!, s.id)}
                             className="opacity-0 group-hover/sub:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                           </button>
                           <div className="flex items-center gap-2">
                             {s.name}
                             <span className="text-[9px] opacity-20">Sub</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
            </div>
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
          {saveMsg && (
            <div className="bg-[#5D4037] text-white p-4 rounded-xl text-center urdu-text font-bold shadow-lg animate-bounce sticky top-0 border-2 border-[#D4AF37] z-50">
              {saveMsg}
            </div>
          )}
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#5D4037]/5 space-y-4">
            <h3 className="text-lg font-bold opacity-40 uppercase text-right">نیا صارف شامل کریں</h3>
            <div className="space-y-3">
              <input 
                value={newUserName} 
                onChange={e => setNewUserName(e.target.value)} 
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-right" 
                placeholder="صارف کا نام" 
              />
              <input 
                value={newUserEmail} 
                onChange={e => setNewUserEmail(e.target.value)} 
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-right font-mono" 
                placeholder="ای میل" 
              />
              <input 
                type="password"
                value={newUserPass} 
                onChange={e => setNewUserPass(e.target.value)} 
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-right" 
                placeholder="پاس ورڈ" 
              />
              <button 
                onClick={handleAddUser} 
                className="w-full py-3 bg-[#5D4037] text-white rounded-xl text-sm font-bold active:scale-95 transition-all shadow-md"
              >
                صارف شامل کریں
              </button>
            </div>
          </div>

          <h3 className="text-lg font-bold opacity-40 text-right">صارفین ({users.length})</h3>
          {users.map(u => (
            <div 
              key={u.id} 
              onClick={() => { setSelectedUserId(u.id); setActiveTab('content'); }}
              className={`bg-white p-4 rounded-xl border transition-all cursor-pointer ${selectedUserId === u.id ? 'ring-2 ring-[#5D4037] border-[#5D4037]' : 'border-[#5D4037]/5'} flex items-center justify-between gap-4`}
            >
              <button onClick={async (e) => { e.stopPropagation(); await db.updateUser(u.id, { isEnabled: !u.isEnabled }); setUsers(await db.getAllUsers()); }} disabled={u.id === currentUser.id} className={`text-[10px] px-3 py-1 rounded-lg font-bold border ${u.isEnabled ? 'text-red-600 border-red-100 bg-red-50' : 'text-green-600 border-green-100 bg-green-50'} disabled:opacity-20`}>{u.isEnabled ? "معطل" : "بحال"}</button>
              <div className="text-right flex-1 truncate">
                <div className="font-bold text-[#5D4037]">{u.name || u.username}</div>
                <div className="text-[10px] opacity-40">{u.email}</div>
                {u.id === currentUser.id && <span className="text-[9px] bg-[#5D4037] text-white px-2 rounded-full uppercase ml-2">You</span>}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
