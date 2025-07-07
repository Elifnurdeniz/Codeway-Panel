import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import SignIn from '../pages/SignIn.vue'
import Panel  from '../pages/Panel.vue'

const routes = [
  { path: '/signin', component: SignIn,  name: 'SignIn' },
  { path: '/',       component: Panel,   name: 'Panel', meta: { requiresAuth: true } },
  { path: '/:catchAll(.*)*', redirect: '/signin' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// global guard
router.beforeEach(async (to) => {
  const auth = useAuthStore()

    // wait for Firebase to finish restoring session
  if (auth.initializing) {
    await auth.waitForInit()
  }

  if (to.meta.requiresAuth && !auth.user) {
    // not signed in → go to sign-in
    return { name: 'SignIn' }
  }
  if (to.name === 'SignIn' && auth.user) {
    // already signed in → go to panel
    return { name: 'Panel' }
  }
})

export default router
