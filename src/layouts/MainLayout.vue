<template>
  <q-layout view="lHh lpR lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round aria-label="Menu" @click="toggleLeftDrawer">
          <!-- Updated to use Material Symbols -->
          <span class="material-symbols-outlined">menu</span>
        </q-btn>

        <q-toolbar-title> Competer </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="250"
      :breakpoint="767"
    >
      <q-list>
        <q-item-label header> Navigation </q-item-label>

        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
    <q-footer class="q-pa-md"> </q-footer>
  </q-layout>
</template>

<script setup>
import { ref } from "vue";
import EssentialLink from "components/EssentialLink.vue";

defineOptions({
  name: "MainLayout",
});

const linksList = [
  {
    title: "Generate",
    icon: "fitness_center", // Update Material Symbols name here
    link: "/",
  },
  {
    title: "Store",
    icon: "store", // Another Material Symbol example
    link: "/page2",
  },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

const totalSum = ref(0);

const changeOnPageTwo = (newTotalSum) => {
  totalSum.value = newTotalSum;
};
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
