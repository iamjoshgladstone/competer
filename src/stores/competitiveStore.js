import { defineStore } from "pinia";
import { supabase } from "app/utils/supabase";

export const useCompetitiveStore = defineStore("competitiveStore", {
  state: () => ({
    llmResponses: [],
  }),

  // actions
  actions: {
    async fetchResponses() {
      try {
        const { data, error } = await supabase
          .from("llm_responses") // Replace with your table name
          .select("id, question, response, created_at"); // Define columns to fetch

        if (error) {
          console.error("Error fetching responses:", error.message);
        } else if (data.length === 0) {
          console.warn("No data found in the llm_responses table.");
        } else {
          this.llmResponses = data; // Update state with fetched data
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    },
    // Add a new LLM response to the database
    async addResponse(newResponse) {
      try {
        const { data, error } = await supabase
          .from("llm_responses") // Replace with your table name
          .insert(newResponse)
          .select(); // Request the inserted row(s) to be returned

        if (error) {
          console.error("Error adding response:", error.message);
          return { error };
        } else {
          console.log("Response added to Supabase:", data);
          if (data && data.length > 0) {
            this.llmResponses.push(...data); // Optimistic update
          }
          return { data };
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        return { error: err };
      }
    },
  },
});
