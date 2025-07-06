import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth } from '../services/firebase'
import {
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth'
import type { User } from 'firebase/auth'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  // 1️⃣ state
  const user         = ref<User|null>(null)
  const initializing = ref(true)
  let   initResolve: () => void
  const initPromise = new Promise<void>(r => { initResolve = r })

  // inactivity timer
  let timer: ReturnType<typeof setTimeout>|null = null
  const TIMEOUT = 1000 * 60 * 60  // 1h

  function resetTimer() {
    if (timer) clearTimeout(timer)
    if (user.value) {
      timer = setTimeout(doLogout, TIMEOUT)
    }
  }

  async function doLogout() {
    if (timer) clearTimeout(timer)
    await signOut(auth)
    user.value = null
    router.push({ name: 'SignIn' })
  }

  // 2️⃣ set persistence _before_ any sign-in happens
  setPersistence(auth, browserLocalPersistence)
    .catch(err => console.error('Persist failed', err))

  // 3️⃣ watch auth state
  onAuthStateChanged(auth, u => {
    user.value = u
    resetTimer()
    if (initializing.value) {
      initializing.value = false
      initResolve()
    }
  })

  // 4️⃣ let the router wait for that first restore
  function waitForInit() { return initPromise }

  return {
    user,
    initializing,
    waitForInit,
    resetTimer,
    doLogout
  }
})
