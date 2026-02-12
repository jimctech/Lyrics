
export interface Category {
  id: string;
  userId?: string; // Associated owner
  name: string;
  serial: number;
}

export interface SubCategory {
  id: string;
  userId?: string; // Associated owner
  categoryId: string;
  name: string;
  serial: number;
}

export interface Lyric {
  id: string;
  userId?: string; // Associated owner
  subCategoryId: string;
  title: string;
  content: string;
  serial: number;
  audioUrl?: string;
}

export interface DisplaySettings {
  backgroundColor: string;
  textColor: string;
  fontSize: number;
  lineHeight: number;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  isEnabled: boolean;
  createdAt: number;
}

export interface GlobalSettings {
  isSignupEnabled: boolean;
  isLoginEnabled: boolean;
  logoUrl?: string;
}
