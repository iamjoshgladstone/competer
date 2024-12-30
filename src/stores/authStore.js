import { ref } from "vue";
import { defineStore } from "pinia";
import { supabase } from "../utils/supabase";
import { isCacheValid, fetchWithRetry } from "../utils/cacheUtils";

// Reactive refs for auth state
export const userEmail = ref(null);
export const companyName = ref(null);
export const companyUuid = ref(null);
export const companyHasCompetitors = ref(false);

// Cache duration for company details (30 minutes)
const COMPANY_CACHE_DURATION = 30 * 60 * 1000;

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null,
    companyDetails: null,
    lastCompanyFetch: null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    hasCompanyDetails: (state) => !!state.companyDetails,
  },

  actions: {
    async initialize() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        this.user = user;
        if (user) {
          await this.fetchCompanyDetails();
        }
      } catch (error) {
        console.error("Error initializing auth store:", error);
        this.error = error.message;
      }
    },

    async fetchCompanyDetails() {
      // Check cache validity
      if (
        this.companyDetails &&
        isCacheValid(this.lastCompanyFetch, COMPANY_CACHE_DURATION)
      ) {
        return { data: this.companyDetails, error: null };
      }

      try {
        this.loading = true;
        const { data, error } = await fetchWithRetry(async () => {
          return await supabase
            .from("userstorage")
            .select("company_name, company_uuid")
            .eq("user_email", this.user.email)
            .single();
        });

        if (error) throw error;

        // Update state and cache
        this.companyDetails = data;
        this.lastCompanyFetch = Date.now();

        // Update reactive refs
        userEmail.value = this.user.email;
        companyName.value = data.company_name;
        companyUuid.value = data.company_uuid;

        await this.checkCompanyCompetitors();

        return { data, error: null };
      } catch (error) {
        console.error("Error fetching company details:", error);
        return { data: null, error };
      } finally {
        this.loading = false;
      }
    },

    async checkCompanyCompetitors() {
      if (!companyUuid.value) return;

      try {
        const { data, error } = await fetchWithRetry(async () => {
          return await supabase
            .from("competitor_link")
            .select("competitor_uuid")
            .eq("company_uuid", companyUuid.value);
        });

        if (error) throw error;

        companyHasCompetitors.value = data?.length > 0;
      } catch (error) {
        console.error("Error checking company competitors:", error);
        companyHasCompetitors.value = false;
      }
    },

    async clearAuth() {
      // Clear all auth state
      this.user = null;
      this.companyDetails = null;
      this.lastCompanyFetch = null;
      userEmail.value = null;
      companyName.value = null;
      companyUuid.value = null;
      companyHasCompetitors.value = false;
    },
  },
});

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  const store = useAuthStore();
  if (event === "SIGNED_IN") {
    store.user = session?.user ?? null;
    store.fetchCompanyDetails();
  } else if (event === "SIGNED_OUT") {
    store.clearAuth();
  }
});
