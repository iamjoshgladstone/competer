<script setup>
import { onMounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

// Log the dynamic parameter (UUID)
onMounted(() => {
  console.log("UUID:", route.params.uuid);
});
</script>

<template>
  <q-page>
    <div class="q-pa-md">
      <h4>Competitor UUID: {{ route.params.uuid }}</h4>
    </div>
  </q-page>
</template>
