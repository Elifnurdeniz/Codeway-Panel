import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth } from '../services/firebase'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(auth.currentUser)
  let timer: ReturnType<typeof setTimeout> | null = null
  const TIMEOUT = 1000 * 60 * 60  // 1 hour

  // reset or start inactivity timer
  function resetTimer() {
    if (timer) clearTimeout(timer)
    if (user.value) {
      timer = setTimeout(() => {
        doLogout()
      }, TIMEOUT)
    }
  }

  // watch Firebase auth state
  onAuthStateChanged(auth, (u) => {
    user.value = u
    resetTimer()
  })

  async function doLogout() {
    if (timer) clearTimeout(timer)
    await signOut(auth)
    user.value = null
    router.push({ name: 'SignIn' })
  }

  return { user, resetTimer, doLogout }
})