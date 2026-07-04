import { create } from "zustand";

export interface VideoAsset {
  id: string;
  uri: string;
  filename: string;
  duration: number;
  width: number;
  height: number;
  creationTime: number;
  modificationTime?: number;
  albumId?: string;
  type?: "video" | "movie" | "tv" | "downloaded" | "favorite";
  resolution?: string;
  fileSize?: number;
  hdr?: boolean;
  dolby?: boolean;
  codec?: string;
  frameRate?: number;
  bitrate?: number;
}

type SortMode = "date" | "name" | "duration" | "size" | "resolution";
type ViewMode = "grid" | "list";
type FilterMode = "all" | "movies" | "tv" | "downloaded" | "favorites" | "recent" | "4k" | "1080p" | "720p" | "hdr";

interface LibraryState {
  videos: VideoAsset[];
  filteredVideos: VideoAsset[];
  searchQuery: string;
  sortMode: SortMode;
  sortAscending: boolean;
  viewMode: ViewMode;
  filterMode: FilterMode;
  selectedIds: Set<string>;
  isMultiSelect: boolean;

  setVideos: (videos: VideoAsset[]) => void;
  setSearch: (query: string) => void;
  setSortMode: (mode: SortMode) => void;
  toggleSortDirection: () => void;
  setViewMode: (mode: ViewMode) => void;
  setFilterMode: (mode: FilterMode) => void;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setMultiSelect: (enabled: boolean) => void;
  deleteVideos: (ids: string[]) => void;
  applyFilters: () => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  videos: [],
  filteredVideos: [],
  searchQuery: "",
  sortMode: "date",
  sortAscending: false,
  viewMode: "grid",
  filterMode: "all",
  selectedIds: new Set(),
  isMultiSelect: false,

  setVideos: (videos) => {
    set({ videos });
    get().applyFilters();
  },

  setSearch: (query) => {
    set({ searchQuery: query });
    get().applyFilters();
  },

  setSortMode: (mode) => {
    const { sortMode, sortAscending } = get();
    if (sortMode === mode) {
      set({ sortAscending: !sortAscending });
    } else {
      set({ sortMode: mode, sortAscending: false });
    }
    get().applyFilters();
  },

  toggleSortDirection: () => {
    set((s) => ({ sortAscending: !s.sortAscending }));
    get().applyFilters();
  },

  setViewMode: (mode) => set({ viewMode: mode }),
  setFilterMode: (mode) => {
    set({ filterMode: mode });
    get().applyFilters();
  },

  toggleSelection: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  selectAll: () =>
    set((s) => ({
      selectedIds: new Set(s.filteredVideos.map((v) => v.id)),
    })),

  clearSelection: () => set({ selectedIds: new Set(), isMultiSelect: false }),

  setMultiSelect: (enabled) => set({ isMultiSelect: enabled, selectedIds: new Set() }),

  deleteVideos: (ids) =>
    set((s) => ({
      videos: s.videos.filter((v) => !ids.includes(v.id)),
      selectedIds: new Set(),
    })),

  applyFilters: () => {
    const { videos, searchQuery, sortMode, sortAscending, filterMode } = get();
    let result = [...videos];

    // Filter
    if (filterMode === "favorites") {
      result = result.filter((v) => v.type === "favorite");
    } else if (filterMode === "downloaded") {
      result = result.filter((v) => v.type === "downloaded");
    } else if (filterMode === "movies") {
      result = result.filter((v) => v.type === "movie");
    } else if (filterMode === "tv") {
      result = result.filter((v) => v.type === "tv");
    } else if (filterMode === "recent") {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      result = result.filter((v) => v.creationTime * 1000 > weekAgo);
    } else if (filterMode === "4k") {
      result = result.filter((v) => (v.width ?? 0) >= 3840);
    } else if (filterMode === "1080p") {
      result = result.filter((v) => (v.width ?? 0) >= 1920 && (v.width ?? 0) < 3840);
    } else if (filterMode === "720p") {
      result = result.filter((v) => (v.width ?? 0) >= 1280 && (v.width ?? 0) < 1920);
    } else if (filterMode === "hdr") {
      result = result.filter((v) => v.hdr);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((v) => v.filename.toLowerCase().includes(q));
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortMode) {
        case "date":
          cmp = a.creationTime - b.creationTime;
          break;
        case "name":
          cmp = a.filename.localeCompare(b.filename);
          break;
        case "duration":
          cmp = a.duration - b.duration;
          break;
        case "size":
          cmp = (a.fileSize ?? 0) - (b.fileSize ?? 0);
          break;
        case "resolution":
          cmp = (a.width ?? 0) - (b.width ?? 0);
          break;
      }
      return sortAscending ? cmp : -cmp;
    });

    set({ filteredVideos: result });
  },
}));
