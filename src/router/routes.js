import { createRouter, createWebHistory } from "vue-router";
import { authGuard } from "src/use/authGuard";

const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      {
        path: "",
        component: () => import("src/pages/HomePage.vue"),
        beforeEnter: authGuard,
      },
      {
        path: "/create",
        component: () => import("src/pages/CreatePage.vue"),
        beforeEnter: authGuard,
      },
      {
        path: "/login",
        component: () => import("src/pages/LoginPage.vue"),
      },
      {
        path: "/register",
        component: () => import("src/pages/RegisterPage.vue"),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;
