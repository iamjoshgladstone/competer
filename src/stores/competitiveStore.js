import { defineStore } from "pinia";
import { supabase } from "app/utils/supabase";

export const useCompetitiveStore = defineStore("competitiveStore", {
  state: () => ({
    strengthsAndWeaknesses: [], // Holds fetched strengths and weaknesses
  }),

  actions: {
    // 1. Fetch strengths and weaknesses for a specific company
    async fetchStrengthsAndWeaknesses(companyName) {
      try {
        const { data, error } = await supabase
          .from("battlecards")
          .select("id, company_name, type, content, upvote, downvote")
          .eq("company_name", companyName.toLowerCase()); // Filter by company name

        if (error) {
          console.error(
            "Error fetching strengths and weaknesses:",
            error.message
          );
          return { error };
        }

        this.strengthsAndWeaknesses = data; // Update state with the fetched data
        return { data };
      } catch (err) {
        console.error(
          "Unexpected error fetching strengths and weaknesses:",
          err
        );
        return { error: err };
      }
    },

    // 2. Insert a new strength or weakness into the database
    async addStrengthOrWeakness(companyName, type, content) {
      try {
        const newEntry = {
          company_name: companyName,
          type, // "strength" or "weakness"
          content,
          upvote: 0, // Default value
          downvote: 0, // Default value
        };

        const { data, error } = await supabase
          .from("battlecards")
          .insert(newEntry)
          .select(); // Return the inserted row

        if (error) {
          console.error("Error adding strength or weakness:", error.message);
          return { error };
        }

        console.log("Strength/Weakness added to Supabase:", data);
        if (data && data.length > 0) {
          this.strengthsAndWeaknesses.push(...data); // Optimistic update
        }
        return { data };
      } catch (err) {
        console.error("Unexpected error adding strength or weakness:", err);
        return { error: err };
      }
    },

    // 3. Update the upvote or downvote count for a specific row
    async updateVote(id, voteType) {
      try {
        // Increment either upvote or downvote
        const columnToUpdate = voteType === "upvote" ? "upvote" : "downvote";

        const { data, error } = await supabase
          .from("battlecards")
          .update({ [columnToUpdate]: supabase.raw(`${columnToUpdate} + 1`) }) // Increment the value
          .eq("id", id) // Match the row by ID
          .select(); // Return the updated row

        if (error) {
          console.error(
            `Error updating ${voteType} for id ${id}:`,
            error.message
          );
          return { error };
        }

        console.log(`Successfully updated ${voteType} for id ${id}:`, data);
        return { data };
      } catch (err) {
        console.error("Unexpected error updating vote:", err);
        return { error: err };
      }
    },
  },
});
