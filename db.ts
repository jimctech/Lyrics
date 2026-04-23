
import { initializeApp, deleteApp } from "firebase/app";
import { rtdb, auth, firebaseConfig } from './firebase';
import { ref, get, set, update, child, remove } from "firebase/database";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, getAuth } from "firebase/auth";
import { Category, SubCategory, Lyric, User, UserRole, DisplaySettings, GlobalSettings } from './types';
import { INITIAL_CATEGORIES, INITIAL_SUBCATEGORIES, INITIAL_LYRICS } from './constants';

const DEFAULT_DISPLAY: DisplaySettings = {
  backgroundColor: '#F5F5DC',
  textColor: '#1A0F0D',
  fontSize: 24,
  lineHeight: 2.5
};

const DEFAULT_GLOBAL: GlobalSettings = {
  isSignupEnabled: true,
  isLoginEnabled: true
};

export const db = {
  // Global Settings
  getGlobalSettings: async (): Promise<GlobalSettings> => {
    const dbRef = ref(rtdb);
    const snapshot = await get(child(dbRef, 'globalSettings'));
    return snapshot.exists() ? snapshot.val() : DEFAULT_GLOBAL;
  },

  saveGlobalSettings: async (settings: GlobalSettings) => {
    await set(ref(rtdb, 'globalSettings'), settings);
  },

  // Auth
  getCurrentUser: (): User | null => {
    const user = auth.currentUser;
    if (!user) return null;
    const role = user.email === 'info@jimcstudio.com' ? UserRole.ADMIN : UserRole.USER;
    return { id: user.uid, username: user.email?.split('@')[0] || '', name: user.displayName || '', email: user.email || '', phone: '', role: role, isEnabled: true, createdAt: 0 };
  },

  getUserProfile: async (uid: string): Promise<User | null> => {
    const snapshot = await get(ref(rtdb, `profiles/${uid}`));
    if (!snapshot.exists()) {
      // Check if this is the master email even if profile doesn't exist yet
      const user = auth.currentUser;
      if (user?.email === 'info@jimcstudio.com') {
        return { id: uid, email: user.email, role: UserRole.ADMIN, isEnabled: true } as User;
      }
      return null;
    }
    const profile = snapshot.val();
    if (profile.email === 'info@jimcstudio.com') {
      profile.role = UserRole.ADMIN;
    }
    return profile;
  },

  login: async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const profile = await db.getUserProfile(cred.user.uid);
    if (profile && !profile.isEnabled) {
      await signOut(auth);
      throw new Error("Account is disabled");
    }
    return profile;
  },

  register: async (data: Partial<User>) => {
    const globals = await db.getGlobalSettings();
    if (!globals.isSignupEnabled) throw new Error("Registration is closed");

    const cred = await createUserWithEmailAndPassword(auth, data.email!, data.password!);
    const usersSnap = await get(ref(rtdb, 'profiles'));
    const isFirst = !usersSnap.exists();

    const profile: User = {
      id: cred.user.uid,
      username: data.username!,
      name: data.name || '',
      email: data.email!,
      phone: data.phone || '',
      role: (isFirst || data.email === 'info@jimcstudio.com') ? UserRole.ADMIN : UserRole.USER,
      isEnabled: true,
      createdAt: Date.now()
    };

    await set(ref(rtdb, `profiles/${cred.user.uid}`), profile);
    await db.seedUserData(cred.user.uid);
    return profile;
  },

  logout: () => signOut(auth),

  adminAddUser: async (data: any) => {
    // Secondary app trick to avoid signing out the current admin
    const tempName = `admin-create-${Date.now()}`;
    const tempApp = initializeApp(firebaseConfig, tempName);
    const tempAuth = getAuth(tempApp);
    
    try {
      const cred = await createUserWithEmailAndPassword(tempAuth, data.email, data.password);
      const profile: User = {
        id: cred.user.uid,
        username: data.username || data.email.split('@')[0],
        name: data.name || '',
        email: data.email,
        phone: data.phone || '',
        role: UserRole.USER,
        isEnabled: true,
        createdAt: Date.now()
      };

      await set(ref(rtdb, `profiles/${cred.user.uid}`), profile);
      await db.seedUserData(cred.user.uid);
      
      // We don't sign out here because we want to delete the whole temp app context
      await deleteApp(tempApp);
      return profile;
    } catch (err) {
      await deleteApp(tempApp).catch(()=>{});
      throw err;
    }
  },

  updateUser: async (uid: string, updates: Partial<User>) => {
    await update(ref(rtdb, `profiles/${uid}`), updates);
  },

  getAllUsers: async (): Promise<User[]> => {
    const snap = await get(ref(rtdb, 'profiles'));
    if (!snap.exists()) return [];
    return Object.values(snap.val());
  },

  // Content Data
  seedUserData: async (uid: string) => {
    const batch: any = {};
    INITIAL_CATEGORIES.forEach(c => batch[`categories/${c.id}`] = { ...c, userId: uid });
    INITIAL_SUBCATEGORIES.forEach(s => batch[`subcategories/${s.id}`] = { ...s, userId: uid });
    INITIAL_LYRICS.forEach(l => {
      const lyricData: any = { ...l, userId: uid };
      // Remove undefined fields for Firebase
      Object.keys(lyricData).forEach(key => {
        if (lyricData[key] === undefined) delete lyricData[key];
      });
      batch[`lyrics/${l.id}`] = lyricData;
    });
    await update(ref(rtdb, `users/${uid}`), batch);
  },

  getCategories: async (uid: string): Promise<Category[]> => {
    try {
      const profile = await db.getUserProfile(uid);
      if (profile?.role === UserRole.ADMIN || uid === 'info@jimcstudio.com') {
        const snap = await get(ref(rtdb, 'users'));
        if (!snap.exists()) return [];
        const allUsersData = snap.val();
        let allCats: Category[] = [];
        Object.keys(allUsersData).forEach((uId) => {
          const userData = allUsersData[uId];
          if (userData && userData.categories) {
            Object.values(userData.categories).forEach((cat: any) => {
              allCats.push({ ...cat, userId: uId });
            });
          }
        });
        return allCats;
      }
      const snap = await get(ref(rtdb, `users/${uid}/categories`));
      return snap.exists() ? Object.values(snap.val()) : [];
    } catch (err: any) {
      if (err.message?.includes('Permission denied')) {
        // Fallback to own categories if admin query fails
        const snap = await get(ref(rtdb, `users/${uid}/categories`));
        return snap.exists() ? Object.values(snap.val()) : [];
      }
      throw err;
    }
  },

  getSubCategories: async (uid: string, categoryId?: string): Promise<SubCategory[]> => {
    const profile = await db.getUserProfile(uid);
    if (profile?.role === UserRole.ADMIN) {
      const rootSnap = await get(ref(rtdb, 'users'));
      if (!rootSnap.exists()) return [];
      let all: SubCategory[] = [];
      Object.keys(rootSnap.val()).forEach((uId) => {
        const userData = rootSnap.val()[uId];
        if (userData.subcategories) {
          Object.values(userData.subcategories).forEach((sub: any) => {
            all.push({ ...sub, userId: uId });
          });
        }
      });
      if (categoryId) all = all.filter(s => s.categoryId === categoryId);
      return all;
    }
    const snap = await get(ref(rtdb, `users/${uid}/subcategories`));
    if (!snap.exists()) return [];
    let all: SubCategory[] = Object.values(snap.val());
    if (categoryId) all = all.filter(s => s.categoryId === categoryId);
    return all.sort((a, b) => a.serial - b.serial);
  },

  getLyrics: async (uid: string, subCategoryId?: string): Promise<Lyric[]> => {
    const profile = await db.getUserProfile(uid);
    if (profile?.role === UserRole.ADMIN) {
      const rootSnap = await get(ref(rtdb, 'users'));
      if (!rootSnap.exists()) return [];
      let all: Lyric[] = [];
      Object.keys(rootSnap.val()).forEach((uId) => {
        const userData = rootSnap.val()[uId];
        if (userData.lyrics) {
          Object.values(userData.lyrics).forEach((lyric: any) => {
            all.push({ ...lyric, userId: uId });
          });
        }
      });
      if (subCategoryId) all = all.filter(l => l.subCategoryId === subCategoryId);
      return all;
    }
    const snap = await get(ref(rtdb, `users/${uid}/lyrics`));
    if (!snap.exists()) return [];
    let all: Lyric[] = Object.values(snap.val());
    if (subCategoryId) all = all.filter(l => l.subCategoryId === subCategoryId);
    return all.sort((a, b) => a.serial - b.serial);
  },

  addCategory: async (uid: string, name: string) => {
    const id = "cat_" + Date.now();
    // Optimization: Only read the specific user's categories to calculate the serial
    const snap = await get(ref(rtdb, `users/${uid}/categories`));
    const categoriesList = snap.exists() ? Object.values(snap.val()) : [];
    const newCat: Category = { id, name, serial: categoriesList.length + 1, userId: uid };
    await set(ref(rtdb, `users/${uid}/categories/${id}`), newCat);
    return newCat;
  },

  addSubCategory: async (uid: string, categoryId: string, name: string) => {
    const id = "sub_" + Date.now();
    // Optimization: Only read the specific user's subcategories
    const snap = await get(ref(rtdb, `users/${uid}/subcategories`));
    let subs: SubCategory[] = snap.exists() ? Object.values(snap.val()) : [];
    subs = subs.filter((s: any) => s.categoryId === categoryId);
    
    const newSub: SubCategory = { id, categoryId, name, serial: subs.length + 1, userId: uid };
    await set(ref(rtdb, `users/${uid}/subcategories/${id}`), newSub);
    return newSub;
  },

  addLyric: async (uid: string, data: Omit<Lyric, 'id' | 'userId'>) => {
    const id = "lyric_" + Date.now();
    const newLyric: Lyric = { ...data, id, userId: uid };
    await set(ref(rtdb, `users/${uid}/lyrics/${id}`), newLyric);
    return newLyric;
  },

  deleteCategory: async (uid: string, catId: string) => {
    await remove(ref(rtdb, `users/${uid}/categories/${catId}`));
  },

  deleteSubCategory: async (uid: string, subId: string) => {
    await remove(ref(rtdb, `users/${uid}/subcategories/${subId}`));
  },

  deleteLyric: async (uid: string, lyricId: string) => {
    await remove(ref(rtdb, `users/${uid}/lyrics/${lyricId}`));
  },

  // Favorites
  toggleFavorite: async (uid: string, lyricId: string) => {
    const favRef = ref(rtdb, `users/${uid}/favorites/${lyricId}`);
    const snap = await get(favRef);
    if (snap.exists()) {
      await remove(favRef);
      return false;
    } else {
      await set(favRef, true);
      return true;
    }
  },

  getFavorites: async (uid: string): Promise<string[]> => {
    const snap = await get(ref(rtdb, `users/${uid}/favorites`));
    return snap.exists() ? Object.keys(snap.val()) : [];
  },

  // Display Settings
  getSettings: async (uid: string): Promise<DisplaySettings> => {
    const snap = await get(ref(rtdb, `users/${uid}/settings`));
    return snap.exists() ? snap.val() : DEFAULT_DISPLAY;
  },

  saveSettings: async (uid: string, settings: DisplaySettings) => {
    await set(ref(rtdb, `users/${uid}/settings`), settings);
  }
};
