import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import vueDevTools from "vite-plugin-vue-devtools"
import ui from "@nuxt/ui/vite"

// https://vitejs.dev/config/
export default defineConfig({
  base: "",
  plugins: [
    vue(),
    vueDevTools(),
    ui({
      ui: {
        button: {
          slots: {
            base: 'cursor-pointer'
          },
        },
        colors: {
          primary: "blue",
          neutral: "zinc",
        },
      },
      autoImport: {
        imports: ["vue"],
      },
    }),
  ],
})
