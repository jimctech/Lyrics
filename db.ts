
import { rtdb, auth } from './firebase';
import { ref, get, set, update, child, remove } from "firebase/database";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
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
    return { id: user.uid, username: user.email?.split('@')[0] || '', name: user.displayName || '', email: user.email || '', phone: '', role: UserRole.USER, isEnabled: true, createdAt: 0 };
  },

  getUserProfile: async (uid: string): Promise<User | null> => {
    const snapshot = await get(ref(rtdb, `profiles/${uid}`));
    return snapshot.exists() ? snapshot.val() : null;
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
      role: isFirst ? UserRole.ADMIN : UserRole.USER,
      isEnabled: true,
      createdAt: Date.now()
    };

    await set(ref(rtdb, `profiles/${cred.user.uid}`), profile);
    await db.seedUserData(cred.user.uid);
    return profile;
  },

  logout: () => signOut(auth),

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
    INITIAL_CATEGORIES.forEach(c => batch[`users/${uid}/categories/${c.id}`] = { ...c, userId: uid });
    INITIAL_SUBCATEGORIES.forEach(s => batch[`users/${uid}/subcategories/${s.id}`] = { ...s, userId: uid });
    INITIAL_LYRICS.forEach(l => batch[`users/${uid}/lyrics/${l.id}`] = { ...l, userId: uid });
    await update(ref(rtdb), batch);
  },

  getCategories: async (uid: string): Promise<Category[]> => {
    const snap = await get(ref(rtdb, `users/${uid}/categories`));
    return snap.exists() ? Object.values(snap.val()) : [];
  },

  getSubCategories: async (uid: string, categoryId?: string): Promise<SubCategory[]> => {
    const snap = await get(ref(rtdb, `users/${uid}/subcategories`));
    if (!snap.exists()) return [];
    let all: SubCategory[] = Object.values(snap.val());
    if (categoryId) all = all.filter(s => s.categoryId === categoryId);
    return all.sort((a, b) => a.serial - b.serial);
  },

  getLyrics: async (uid: string, subCategoryId?: string): Promise<Lyric[]> => {
    const snap = await get(ref(rtdb, `users/${uid}/lyrics`));
    if (!snap.exists()) return [];
    let all: Lyric[] = Object.values(snap.val());
    if (subCategoryId) all = all.filter(l => l.subCategoryId === subCategoryId);
    return all.sort((a, b) => a.serial - b.serial);
  },

  addCategory: async (uid: string, name: string) => {
    const id = "cat_" + Date.now();
    const categories = await db.getCategories(uid);
    const newCat: Category = { id, name, serial: categories.length + 1, userId: uid };
    await set(ref(rtdb, `users/${uid}/categories/${id}`), newCat);
    return newCat;
  },

  addSubCategory: async (uid: string, categoryId: string, name: string) => {
    const id = "sub_" + Date.now();
    const subs = await db.getSubCategories(uid, categoryId);
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
