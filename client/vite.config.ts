import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    build: {
        outDir: '../dist/public', // Vite manderà la build direttamente qui!
        emptyOutDir: false,       // Imposta a false per evitare che svuoti la cartella del BE
    }
})
