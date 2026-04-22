import { create } from 'zustand'

export const useStudioStore = create((set, get) => ({
  // Project identity
  projectId: null,
  userId: null,

  // Phase locks
  phase1Complete: false,
  phase2Complete: false,
  phase3Complete: false,

  // Phase 1 streaming
  streamingText: '',
  streamingDone: false,
  parsedScript: null,
  isStreaming: false,

  // Phase 2 image jobs: { [itemId]: { taskId, status, url } }
  imageJobs: {},

  // Phase 3 video jobs: { [planId]: { taskId, status, url } }
  videoJobs: {},

  // Error state
  error: null,

  // Actions
  setProjectId: (projectId) => set({ projectId }),
  setUserId: (userId) => set({ userId }),

  startStreaming: () => set({ isStreaming: true, streamingText: '', streamingDone: false, parsedScript: null }),

  appendStreamChunk: (text) =>
    set((state) => ({ streamingText: state.streamingText + text })),

  finalizeStream: (parsed) =>
    set({ streamingDone: true, isStreaming: false, parsedScript: parsed }),

  setImageJob: (itemId, job) =>
    set((state) => ({
      imageJobs: { ...state.imageJobs, [itemId]: { ...state.imageJobs[itemId], ...job } },
    })),

  setVideoJob: (planId, job) =>
    set((state) => ({
      videoJobs: { ...state.videoJobs, [planId]: { ...state.videoJobs[planId], ...job } },
    })),

  advancePhase: (phase) => {
    if (phase === 1) set({ phase1Complete: true })
    if (phase === 2) set({ phase2Complete: true })
    if (phase === 3) set({ phase3Complete: true })
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  reset: () =>
    set({
      projectId: null,
      phase1Complete: false,
      phase2Complete: false,
      phase3Complete: false,
      streamingText: '',
      streamingDone: false,
      parsedScript: null,
      isStreaming: false,
      imageJobs: {},
      videoJobs: {},
      error: null,
    }),
}))
