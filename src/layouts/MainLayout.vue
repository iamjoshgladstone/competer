<template>
  <q-layout view="lHh lpR lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar class="q-mr-sm">
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg" />
          </q-avatar>
          Competer
        </q-toolbar-title>
        <!-- Display the company name -->
        <div v-if="companyName" class="q-mr-lg">Hello, {{ companyName }}</div>
        <q-separator vertical style="background-color: white"></q-separator>
        <q-tabs
          class="no-underline-tabs"
          active-bg-color="accent"
          align="right"
        >
          <q-route-tab v-if="auth" to="/" label="Home" />

          <!-- Dynamic route for the Generate button -->
          <q-route-tab
            v-if="auth && generateRoute"
            :to="generateRoute"
            label="Generate"
          />

          <q-route-tab v-if="!auth" to="/login" label="Login" />
          <q-route-tab v-if="auth" label="Logout" @click="logoutUser" />
        </q-tabs>

        <q-btn flat round icon="menu" @click="toggleDrawer" aria-label="Menu" />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="isDrawerOpen"
      side="right"
      overlay
      behavior="mobile"
      width="250"
    >
      <q-list>
        <!-- User Email -->
        <q-item>
          <q-item-section avatar>
            <q-avatar>
              <img src="https://cdn.quasar.dev/img/avatar.png" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ userEmail }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator />

        <!-- Settings Option -->
        <q-item clickable @click="goToSettings">
          <q-item-section>
            <q-icon name="settings" />
            Settings
          </q-item-section>
        </q-item>

        <!-- Logout Option -->
        <q-item clickable @click="logoutUser">
          <q-item-section>
            <q-icon name="logout" />
            Log Out
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="q-pa-md"></q-footer>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "app/utils/supabase";
import {
  auth,
  fetchCompanyDetails,
  companyName,
  companyHasCompetitors,
  userEmail,
} from "src/stores/authStore";

const router = useRouter();
const generateRoute = ref(null); // Holds the dynamic route
const isDrawerOpen = ref(false); // Drawer state

// Toggle the drawer
const toggleDrawer = () => {
  isDrawerOpen.value = !isDrawerOpen.value;
};

// Navigate to Settings page
const goToSettings = () => {
  toggleDrawer();
  router.push("/settings");
};

// Logout function
const logoutUser = async () => {
  await supabase.auth.signOut();
  router.push("/login");
  auth.value = false;
};

// Fetch company details and dynamically set the route
onMounted(async () => {
  try {
    await fetchCompanyDetails();

    // Determine the correct route dynamically
    generateRoute.value = companyHasCompetitors.value
      ? "/generate"
      : "/selectcompetitors";
  } catch (error) {
    console.error("Error fetching company details:", error.message);
  }
});
</script>

<style>
.q-tab__indicator {
  display: none;
}

.q-drawer--open {
  backdrop-filter: blur(4px);
}
/* Include styles for Material Symbols */
.material-symbols-outlined {
  font-family: "Material Symbols Outlined";
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
}

/* Optional styling for the drawer background dim effect */
</style>
