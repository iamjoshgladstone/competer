import {
  createRouter,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
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
        path: "/selectcompetitors",
        component: () => import("src/pages/SelectCompetitorPage.vue"),
        beforeEnter: authGuard,
      },
      {
        path: "/generate",
        component: () => import("src/pages/GeneratePage.vue"),
        beforeEnter: authGuard,
      },
      {
        path: "/generate/:uuid", // Dynamic route for the competitor's UUID
        component: () => import("src/pages/ChildBattlecardPage.vue"), // Create this page
        beforeEnter: authGuard,
      },
      {
        path: "/create2",
        component: () => import("src/pages/CreatePage2.vue"),
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
