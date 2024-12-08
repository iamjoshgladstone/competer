<template>
  <q-page class="flex flex-center">
    <q-card>
      <q-section class="text-h1">Todos</q-section>
      <q-list>
        <q-item v-for="todo in todoStore.todos" :key="todo.id">
          {{ todo.task }}
        </q-item>
      </q-list>
    </q-card>

    <!-- <q-card style="width: 100%; max-width: 500px">
      <q-card-section>
        <div class="text-h6">Company Information</div>
      </q-card-section>
      <q-card-section>
        <q-input
          filled
          v-model="companyName"
          label="Company Name"
          :disable="loading"
        />
      </q-card-section>
      <q-card-actions :align="right">
        <q-btn
          flat
          label="Submit"
          @click="SubmitCompanyInfo"
          :loading="loading"
        ></q-btn>
      </q-card-actions>
      <q-inner-loading :showing="loading">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>
    </q-card> -->
  </q-page>
</template>

<script setup>
defineOptions({
  name: "IndexPage",
});

import { useTodoStore } from "../stores/todoStore";
import { onMounted } from "vue";

const todoStore = useTodoStore();

onMounted(() => {
  todoStore.fetchTodos();
});
</script>
