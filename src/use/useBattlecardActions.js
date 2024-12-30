import { ref } from "vue";
import { useCompetitiveStore } from "src/stores/competitiveStore";
import { supabase } from "src/utils/supabase";

export function useBattlecardActions() {
  const store = useCompetitiveStore();
  const loading = ref(false);
  const error = ref(null);

  // Fetch strengths and weaknesses for a specific company
  const fetchStrengthsAndWeaknesses = async (companyName) => {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: fetchError } =
        await store.fetchStrengthsAndWeaknesses(companyName);

      if (fetchError) {
        error.value = fetchError.message;
        console.error(
          "Error fetching strengths and weaknesses:",
          fetchError.message
        );
      }

      return data; // Return fetched data for use in the component
    } catch (err) {
      console.error("Unexpected error fetching strengths and weaknesses:", err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Add a new strength or weakness
  const addStrengthOrWeakness = async (companyName, type, content) => {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: addError } = await store.addStrengthOrWeakness(
        companyName,
        type,
        content
      );

      if (addError) {
        error.value = addError.message;
        console.error("Error adding strength or weakness:", addError.message);
      }

      return data; // Return inserted data for use in the component
    } catch (err) {
      console.error("Unexpected error adding strength or weakness:", err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Update the upvote or downvote count
  const updateVote = async (id, voteType) => {
    try {
      const columnToUpdate = voteType === "upvote" ? "upvote" : "downvote";

      // Fetch the current value
      const { data: existingData, error: fetchError } = await supabase
        .from("battlecards")
        .select(columnToUpdate)
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error(
          `Error fetching ${voteType} for id ${id}:`,
          fetchError.message
        );
        return { error: fetchError };
      }

      const currentValue = existingData[columnToUpdate] || 0;

      // Update with the incremented value
      const { data, error } = await supabase
        .from("battlecards")
        .update({ [columnToUpdate]: currentValue + 1 })
        .eq("id", id)
        .select();

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
  };

  return {
    fetchStrengthsAndWeaknesses,
    addStrengthOrWeakness,
    updateVote,
    loading,
    error,
  };
}
