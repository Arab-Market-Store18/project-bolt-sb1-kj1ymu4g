// ملف: lib/use-interaction-store.ts

import { create } from 'zustand';

interface UserInteractionState {
  likedCount: number;
  followingCount: number;
  setInitialCounts: (liked: number, followed: number) => void;
  incrementLiked: () => void;
  decrementLiked: () => void;
  incrementFollowing: () => void;
  decrementFollowing: () => void;
  reset: () => void;
}

export const useInteractionStore = create<UserInteractionState>((set) => ({
  likedCount: 0,
  followingCount: 0,
  setInitialCounts: (liked, followed) => set({ likedCount: liked, followingCount: followed }),
  incrementLiked: () => set((state) => ({ likedCount: state.likedCount + 1 })),
  decrementLiked: () => set((state) => ({ likedCount: Math.max(0, state.likedCount - 1) })),
  incrementFollowing: () => set((state) => ({ followingCount: state.followingCount + 1 })),
  decrementFollowing: () => set((state) => ({ followingCount: Math.max(0, state.followingCount - 1) })),
  reset: () => set({ likedCount: 0, followingCount: 0 }),
}));
