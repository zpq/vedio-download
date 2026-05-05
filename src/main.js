import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style/variables.css'
import './style/global.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.mount('#app')

import { useThemeStore } from './stores/theme'
const theme = useThemeStore()
theme.init()
