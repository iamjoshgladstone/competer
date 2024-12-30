import { ref } from "vue";
import { defineStore } from "pinia";
import { supabase } from "../utils/supabase";
import {
  CACHE_DURATION,
  isCacheValid,
  fetchWithRetry,
} from "../utils/cacheUtils";

export const useCompetitiveStore = defineStore("competitive", {
  state: () => ({
    strengthsAndWeaknesses: [],
    lastFetchTimestamp: null,
    subscriptions: {},
  }),

  actions: {
    // Initialize real-time subscriptions
    initializeSubscriptions() {
      this.subscriptions.strengthsWeaknesses = supabase
        .channel("strengths_weaknesses_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "battlecards" },
          (payload) => {
            this.handleRealtimeUpdate(payload);
          }
        )
        .subscribe();
    },

    // Handle real-time updates
    handleRealtimeUpdate(payload) {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      switch (eventType) {
        case "INSERT":
          this.strengthsAndWeaknesses.push(newRecord);
          break;
        case "DELETE":
          this.strengthsAndWeaknesses = this.strengthsAndWeaknesses.filter(
            (item) => item.id !== oldRecord.id
          );
          break;
        case "UPDATE":
          this.strengthsAndWeaknesses = this.strengthsAndWeaknesses.map(
            (item) => (item.id === newRecord.id ? newRecord : item)
          );
          break;
      }
    },

    // Fetch strengths and weaknesses with caching
    async fetchStrengthsAndWeaknesses(companyName) {
      try {
        // Check cache validity
        if (isCacheValid(this.lastFetchTimestamp)) {
          return {
            data: this.strengthsAndWeaknesses.filter(
              (item) => item.company_name === companyName
            ),
            error: null,
          };
        }

        const { data, error } = await fetchWithRetry(async () => {
          return await supabase
            .from("battlecards")
            .select("id, company_name, type, content, upvote, downvote")
            .eq("company_name", companyName);
        });

        if (error) throw error;

        // Update cache
        this.strengthsAndWeaknesses = data;
        this.lastFetchTimestamp = Date.now();

        return { data, error: null };
      } catch (error) {
        console.error("Error in fetchStrengthsAndWeaknesses:", error);
        return { data: null, error };
      }
    },

    // Add strength or weakness with optimistic update
    async addStrengthOrWeakness(companyName, type, content) {
      // Create new record
      const newRecord = {
        id: Date.now(), // Temporary ID
        company_name: companyName,
        type,
        content,
        upvote: 0,
        downvote: 0,
        created_at: new Date().toISOString(),
      };

      // Optimistic update
      this.strengthsAndWeaknesses.push(newRecord);

      try {
        const { data, error } = await fetchWithRetry(async () => {
          return await supabase
            .from("battlecards")
            .insert([
              {
                company_name: companyName,
                type,
                content,
                upvote: 0,
                downvote: 0,
              },
            ])
            .select()
            .single();
        });

        if (error) throw error;

        // Update with actual server data
        this.strengthsAndWeaknesses = this.strengthsAndWeaknesses.map((item) =>
          item.id === newRecord.id ? data : item
        );

        return { data, error: null };
      } catch (error) {
        // Revert optimistic update
        this.strengthsAndWeaknesses = this.strengthsAndWeaknesses.filter(
          (item) => item.id !== newRecord.id
        );
        console.error("Error in addStrengthOrWeakness:", error);
        return { data: null, error };
      }
    },

    // Update vote with optimistic update
    async updateVote(id, voteType) {
      // Store original state
      const originalItem = this.strengthsAndWeaknesses.find(
        (item) => item.id === id
      );
      const originalVotes = originalItem ? { ...originalItem } : null;

      // Optimistic update
      this.strengthsAndWeaknesses = this.strengthsAndWeaknesses.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            [voteType]: (item[voteType] || 0) + 1,
          };
        }
        return item;
      });

      try {
        const { data, error } = await fetchWithRetry(async () => {
          return await supabase
            .from("battlecards")
            .update({ [voteType]: supabase.raw(`${voteType} + 1`) })
            .eq("id", id)
            .select()
            .single();
        });

        if (error) throw error;

        return { data, error: null };
      } catch (error) {
        // Revert optimistic update
        if (originalVotes) {
          this.strengthsAndWeaknesses = this.strengthsAndWeaknesses.map(
            (item) => (item.id === id ? originalVotes : item)
          );
        }
        console.error("Error in updateVote:", error);
        return { data: null, error };
      }
    },

    // Cleanup subscriptions
    cleanup() {
      Object.values(this.subscriptions).forEach((subscription) => {
        if (subscription && subscription.unsubscribe) {
          subscription.unsubscribe();
        }
      });
      this.subscriptions = {};
    },
  },
});
