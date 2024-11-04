// src/app/store/usePhotoStore.js
'use client';
import { create } from 'zustand';

const usePhotoStore = create((set) => ({
  albums: [],
  currentAlbum: null,
  selectedPhoto: null,
  isLightboxOpen: false,
  sortBy: 'date-new',
  activeYear: 'all',
  activeCountry: 'all', // New state for country filter
  loading: false,
  error: null,

  // Actions
  setAlbums: (albums) => set({ albums }),
  setCurrentAlbum: (album) => set({ currentAlbum: album }),
  openLightbox: (photo) => set({ selectedPhoto: photo, isLightboxOpen: true }),
  closeLightbox: () => set({ isLightboxOpen: false, selectedPhoto: null }),
  setSortBy: (sortBy) => set({ sortBy }),
  setActiveYear: (year) => set({ activeYear: year }),
  setActiveCountry: (country) => set({ activeCountry: country }), // New action
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export default usePhotoStore;
