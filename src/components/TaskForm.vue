<template>
  <q-page padding>
    <q-form @submit.prevent="submitForm">
      <!-- Input for Task -->
      <q-input v-model="task" label="Enter Task" outlined required />

      <!-- Submit Button -->
      <q-btn type="submit" class="q-mt-md" label="Add Task" color="primary" />
    </q-form>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useTodoStore } from "../stores/todoStore";
import { Notify } from "quasar";

// Access the Pinia todoStore
const todoStore = useTodoStore();

// Reactive variable for the task input
const task = ref("");

// Submit handler for the form
const submitForm = async () => {
  if (task.value.trim() === "") {
    console.error("Task input cannot be empty.");
    return;
  }

  try {
    // Insert the task into the Supabase database via the todoStore
    const { data, error } = await todoStore.addTodo({ task: task.value });

    if (error) {
      console.error("Error adding task:", error.message);
    } else {
      Notify.create({
        message: "Task added!",
        type: "positive",
        position: "bottom",
        timeout: 2000, // Auto-dismiss after 2 seconds
      });
      task.value = ""; // Clear the input field after successful submission
      await todoStore.fetchTodos(); // Ensure the state is in sync
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
};
</script>
