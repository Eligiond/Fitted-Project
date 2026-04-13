export interface AppUser {
  uid: string;
  displayName: string | null;
  handle: string;
  avatarUrl: string | null;
  bio: string;
  following: string[];
  followers: string[];
  theme: 'light' | 'dark';
  createdAt: string;
}

export interface WardrobeItem {
  id: string;
  userId: string;
  frontImageUrl: string;
  backImageUrl?: string;
  category: WardrobeCategory;
  tags: string[];
  createdAt: string;
}

export type WardrobeCategory =
  | 'All'
  | 'Tops'
  | 'Bottoms'
  | 'Shoes'
  | 'Accessories'
  | 'Outerwear';

export const WARDROBE_CATEGORIES: WardrobeCategory[] = [
  'All',
  'Tops',
  'Bottoms',
  'Shoes',
  'Accessories',
  'Outerwear',
];

export interface CanvasItemLayout {
  itemId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

export interface Outfit {
  id: string;
  userId: string;
  name: string;
  itemIds: string[];
  canvasLayout: CanvasItemLayout[];
  coverImageUrl?: string;
  createdAt: string;
}

export interface PlannerEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  outfitId?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface SocialPost {
  id: string;
  userId: string;
  outfitId?: string;
  imageUrl: string;
  caption?: string;
  likes: string[]; // array of userIds
  comments: Comment[];
  createdAt: string;
  // Denormalized for display
  userDisplayName?: string;
  userAvatarUrl?: string;
  userHandle?: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  userDisplayName?: string;
  userAvatarUrl?: string;
}
