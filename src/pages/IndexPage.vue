<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-section class="text-h1">Todos</q-section>
      <q-list>
        <!-- Iterate over the reactive todos array -->
        <q-item v-for="todo in todoStore.todos" :key="todo.id">
          {{ todo.task }}
        </q-item>
      </q-list>
    </q-card>
    <hr class="q-ma-md" />
    <task-form></task-form>
  </q-page>
</template>

<script setup>
defineOptions({
  name: "IndexPage",
});

import { useTodoStore } from "../stores/todoStore";
import { onMounted } from "vue";
import TaskForm from "src/components/TaskForm.vue";

// Access the Pinia store
const todoStore = useTodoStore();

// Fetch todos on mount
onMounted(() => {
  todoStore.fetchTodos();
});
</script>
