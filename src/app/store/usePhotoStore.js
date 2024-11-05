import { create } from 'zustand';

const usePhotoStore = create((set) => ({
  albums: [],
  currentAlbum: null,
  loading: false,
  error: null,
  selectedPhoto: null,
  isLightboxOpen: false,
  activeYear: 'all',
  activeCountry: 'all',

  setAlbums: (albums) => set({ albums }),
  setCurrentAlbum: (album) => set({ currentAlbum: album }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  openLightbox: (photo) => set({ selectedPhoto: photo, isLightboxOpen: true }),
  closeLightbox: () => set({ isLightboxOpen: false, selectedPhoto: null }),
  
  setActiveYear: (year) => set({ activeYear: year }),
  setActiveCountry: (country) => set({ activeCountry: country }),
}));

export default usePhotoStore;
