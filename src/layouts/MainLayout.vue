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
          <q-route-tab v-if="authStore.user" to="/" label="Home" />
          <q-route-tab v-if="authStore.user" to="/generate" label="Generate" />

          <!-- Dynamic route for the Generate button -->
          <q-route-tab
            v-if="authStore.user && generateRoute"
            :to="generateRoute"
            label="Generate"
          />

          <q-route-tab v-if="!authStore.user" to="/login" label="Login" />
          <q-route-tab
            v-if="authStore.user"
            label="Logout"
            @click="logoutUser"
          />
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
import { supabase } from "../utils/supabase";
import { useAuthStore } from "../stores/authStore";
import { storeToRefs } from "pinia";

const router = useRouter();
const generateRoute = ref(null); // Holds the dynamic route
const isDrawerOpen = ref(false); // Drawer state
const authStore = useAuthStore();

// Use storeToRefs to maintain reactivity
const { userEmail, companyName, companyHasCompetitors } =
  storeToRefs(authStore);

// Toggle the drawer
const toggleDrawer = () => {
  isDrawerOpen.value = !isDrawerOpen.value;
};

// Navigate to Settings page
const goToSettings = () => {
  router.push("/settings");
  isDrawerOpen.value = false;
};

// Logout function
const logoutUser = async () => {
  try {
    await supabase.auth.signOut();
    authStore.clearAuth();
    router.push("/login");
    isDrawerOpen.value = false;
  } catch (error) {
    console.error("Error logging out:", error);
  }
};

// Fetch company details and dynamically set the route
onMounted(async () => {
  try {
    await authStore.fetchCompanyDetails();
    // Set the generate route based on whether the company has competitors
    generateRoute.value = companyHasCompetitors.value
      ? "/generate"
      : "/select-competitor";
  } catch (error) {
    console.error("Error in onMounted:", error);
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
