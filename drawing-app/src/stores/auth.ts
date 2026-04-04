import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as any,
    username: '' as string,
    loading: true
  }),

  actions: {
    async fetchUser() {
      const { data } = await supabase.auth.getUser()
      this.user = data.user

      if (this.user) {
        await this.fetchProfile()
      }

      this.loading = false
    },

    async fetchProfile() {
      if (!this.user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', this.user.id)
        .single()

      if (!error && data) {
        this.username = data.username
      }
    },

    async login(email: string, password: string) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      await this.fetchUser()
    },

    async logout() {
      await supabase.auth.signOut()
      this.user = null
      this.username = ''
    }
  }
})