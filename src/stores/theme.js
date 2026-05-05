import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    mode: localStorage.getItem('theme') || 'system',
  }),
  getters: {
    resolvedTheme(state) {
      if (state.mode === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return state.mode
    },
  },
  actions: {
    setMode(mode) {
      this.mode = mode
      localStorage.setItem('theme', mode)
      this.apply()
    },
    apply() {
      document.documentElement.setAttribute('data-theme', this.resolvedTheme)
    },
    init() {
      this.apply()
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (this.mode === 'system') this.apply()
      })
    },
  },
})
