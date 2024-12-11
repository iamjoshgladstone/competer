<template>
  <q-layout view="lHh lpR lFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar class="q-mr-sm">
            <img
              src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg"
            /> </q-avatar
          >Competer
        </q-toolbar-title>
        <q-tabs align="right">
          <q-route-tab v-if="auth" to="/" exact label="Home" />
          <q-route-tab v-if="auth" to="/create" label="Create" />
          <q-route-tab v-if="!auth" to="/login" label="Login" />
          <q-route-tab v-if="auth" label="Logout" @click="logoutUser" />
        </q-tabs>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
    <q-footer class="q-pa-md"> </q-footer>
  </q-layout>
</template>

<script setup>
import { ref } from "vue";
import { auth } from "src/stores/authStore";
import { useRouter } from "vue-router";
import { supabase } from "app/utils/supabase";

const router = useRouter();

const logoutUser = async () => {
  await supabase.auth.signOut();
  router.push("/login");
  auth.value = false;
};

defineOptions({
  name: "MainLayout",
});
</script>

<style>
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
</style>
