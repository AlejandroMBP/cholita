// vite.config.js
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    server: {
        // Abre directamente la portada en /bruja
        open: '/bruja/index.html',
        // (opcional) permite abrir desde otras máquinas en la red
        // host: true
    },
    build: {
        rollupOptions: {
            input: {
                // multipágina: declara ambas entradas para build
                juego: resolve(__dirname, 'index.html'),
                inicio: resolve(__dirname, 'bruja/index.html'),
            }
        }
    }
})
