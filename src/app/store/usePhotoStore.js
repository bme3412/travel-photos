// src/app/store/usePhotoStore.js

import { create } from 'zustand';

const usePhotoStore = create((set) => ({
  albums: [],
  currentAlbum: null,
  isLightboxOpen: false,
  selectedPhoto: null,
  activeYear: 'all',
  activeCountry: 'all',
  loading: false,
  error: null,

  setAlbums: (albums) => set({ albums }),
  setCurrentAlbum: (album) => set({ currentAlbum: album }),
  openLightbox: (photo) => set({ isLightboxOpen: true, selectedPhoto: photo }),
  closeLightbox: () => set({ isLightboxOpen: false, selectedPhoto: null }),
  setActiveYear: (year) => set({ activeYear: year }),
  setActiveCountry: (country) => set({ activeCountry: country }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

export default usePhotoStore;
