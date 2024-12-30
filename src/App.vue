<template>
  <router-view />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from './stores/authStore'
import { useCompetitiveStore } from './stores/competitiveStore'

const authStore = useAuthStore()
const competitiveStore = useCompetitiveStore()

// Initialize stores and subscriptions
onMounted(async () => {
  await authStore.initialize()
  competitiveStore.initializeSubscriptions()
})

// Cleanup subscriptions
onUnmounted(() => {
  competitiveStore.cleanup()
})

defineOptions({
  name: "App",
});
</script>
