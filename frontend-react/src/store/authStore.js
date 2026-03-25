import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username, password) => {
        const data = await api.post('/auth/login', { username, password })
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true
        })
        return data
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },

      checkAuth: () => {
        const state = useAuthStore.getState()
        set({ isAuthenticated: !!state.token })
      }
    }),
    { name: 'auth-storage' }
  )
)
