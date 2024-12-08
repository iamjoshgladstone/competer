<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-section class="text-h1">Todos</q-section>
      <q-list>
        <!-- Iterate over the reactive todos array -->
        <q-item v-for="todo in todoStore.todos" :key="todo.id">
          {{ todo.task }}
          <q-item-section side top>
            <q-btn
              @click="deleteTask(todo.id)"
              size="10px"
              class="q-ml-lg glossy"
              color="negative"
            >
              <q-icon color="white" name="delete"></q-icon>
            </q-btn>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
    <hr class="q-ma-md" />
    <TaskForm />
  </q-page>
</template>

<script setup>
defineOptions({
  name: "IndexPage",
});

import { useTodoStore } from "../stores/todoStore";
import { onMounted } from "vue";
import TaskForm from "src/components/TaskForm.vue";
import { Notify } from "quasar";

// Access the Pinia store
const todoStore = useTodoStore();

// Fetch todos on mount
onMounted(() => {
  todoStore.fetchTodos();
});

// Function to handle task deletion
const deleteTask = async (id) => {
  const { error } = await todoStore.removeTodo(id);
  if (error) {
    Notify.create({
      message: "Failed to delete task.",
      type: "negative", // Red notification
      position: "top", // Display at the top
    });
  } else {
    Notify.create({
      message: "Task deleted.",
      type: "positive", // Green notification
      position: "top", // Display at the top
      timeout: 2000, // Auto-dismiss after 2 seconds
      icon: "delete",
    });
  }
};
</script>
