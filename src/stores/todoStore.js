import { defineStore } from "pinia";
import { supabase } from "app/utils/supabase.js";

export const useTodoStore = defineStore("todoStore", {
  state: () => ({
    todos: [],
  }),
  actions: {
    async fetchTodos() {
      try {
        const { data, error } = await supabase.from("todos").select("id, task");

        console.log("Supabase Data:", data); // Log fetched data
        console.log("Supabase Error:", error); // Log any errors

        if (error) {
          console.error("Error fetching todos:", error.message);
        } else if (data.length === 0) {
          console.warn("No data found in the todos table.");
        } else {
          this.todos = data;
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    },
  },
});
