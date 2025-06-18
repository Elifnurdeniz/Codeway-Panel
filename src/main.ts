import { createApp }   from 'vue'
import { createPinia } from 'pinia'
import App             from './App.vue'
import router          from './router'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')

// after mounting, start listening for interactions
const auth = useAuthStore()
const events = ['click', 'keydown', 'mousemove', 'scroll']
events.forEach(evt =>
  window.addEventListener(evt, () => auth.resetTimer())
)
