import { createApp } from 'vue'
import { logoUrl } from './assets/imagenes'
import './style.css'
import App from './App.vue'
import router from './router'

function configurarFavicon() {
  for (const rel of ['icon', 'apple-touch-icon']) {
    let enlace = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
    if (!enlace) {
      enlace = document.createElement('link')
      enlace.rel = rel
      document.head.appendChild(enlace)
    }
    enlace.type = 'image/png'
    enlace.href = logoUrl
  }
}

configurarFavicon()

createApp(App).use(router).mount('#app')
