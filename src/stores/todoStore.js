import { defineStore } from "pinia";
import { supabase } from "src/utils/supabase.js";

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
    // add task to Supabase
    async addTodo(newTodo) {
      try {
        // Use `.select()` to request the inserted data to be returned
        const { data, error } = await supabase
          .from("todos")
          .insert(newTodo)
          .select(); // Request the inserted row(s) to be returned

        if (error) {
          console.error("Error adding task:", error.message);
          return { error };
        } else {
          console.log("Task added to Supabase:", data);
          // Ensure that data is iterable (it's an array)
          if (data && data.length > 0) {
            this.todos.push(...data); // Optimistic update
          }
          return { data };
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        return { error: err };
      }
    },

    async removeTodo(id) {
      try {
        // Delete the task from Supabase by its ID
        const { data, error } = await supabase
          .from("todos")
          .delete()
          .eq("id", id); // Filters the row to delete based on ID

        if (error) {
          console.error("Error removing task:", error.message);
          return { error };
        } else {
          console.log("Task removed from Supabase:", data);
          // Update the local state by filtering out the deleted task
          this.todos = this.todos.filter((todo) => todo.id !== id);
          return { data };
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        return { error: err };
      }
    },
  },
});
