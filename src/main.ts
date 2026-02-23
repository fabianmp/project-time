import "./assets/css/main.css"

import { createApp } from "vue"
import { createRouter, createWebHashHistory } from "vue-router"
import ui from "@nuxt/ui/vue-plugin"

import App from "./App.vue"

const app = createApp(App)

app.use(
  createRouter({
    routes: [
      { path: "/", component: () => import("./pages/index.vue") },
      {
        path: "/statistics/",
        component: () => import("./pages/statistics.vue"),
      },
      {
        path: "/tickets/",
        component: () => import("./pages/tickets.vue"),
      },
    ],
    history: createWebHashHistory(),
  }),
)

app.use(ui)

app.mount("#app")
