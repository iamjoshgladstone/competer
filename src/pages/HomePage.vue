<template>
  <q-page class="flex flex-center column">
    <h1>Home Page Dashboard</h1>
    <q-btn @click="showTheDiv">Show the Div</q-btn>
    <transition-group
      appear
      enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut"
    >
      <div v-if="showDiv">
        Hi I'm q-header
        <q-btn @click="showTheDiv">Hide the Div</q-btn>
      </div>
    </transition-group>
  </q-page>
</template>

<script setup>
import { ref } from "vue";

const showDiv = ref(false);

const showTheDiv = () => {
  showDiv.value = !showDiv.value;
};
</script>
