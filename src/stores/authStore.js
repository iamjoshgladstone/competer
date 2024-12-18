import { ref } from "vue";
import { supabase } from "app/utils/supabase";

export const auth = ref(false); // Holds the authentication state
export const companyName = ref(null); // Holds the company name
export const companyUuid = ref(null); // Holds the company UUID
export const companyHasCompetitors = ref(false); // Tracks if company has competitors

// Fetch company name and UUID
export const fetchCompanyDetails = async () => {
  try {
    // Get the currently logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Fetch the company name and UUID from the userstorage table using the user's email
      const { data, error } = await supabase
        .from("userstorage")
        .select("company_name, company_uuid")
        .eq("user_email", user.email)
        .single();

      if (error) {
        console.error("Error fetching company details:", error.message);
        companyName.value = null;
        companyUuid.value = null;
        return null;
      }

      // Set company details to refs
      companyName.value = data?.company_name || "Unknown Company";
      companyUuid.value = data?.company_uuid || null;

      // Check for competitors
      await checkCompanyCompetitors();
      return { companyName: companyName.value, companyUuid: companyUuid.value };
    } else {
      // If no user is logged in
      companyName.value = null;
      companyUuid.value = null;
      companyHasCompetitors.value = false;
      return null;
    }
  } catch (error) {
    console.error("Error fetching company details:", error.message);
    companyName.value = null;
    companyUuid.value = null;
    companyHasCompetitors.value = false;
    return null;
  }
};

// Check if the company has competitors
export const checkCompanyCompetitors = async () => {
  if (!companyUuid.value) return;

  try {
    const { data, error } = await supabase
      .from("competitor_link")
      .select("competitor_uuid")
      .eq("company_uuid", companyUuid.value);

    if (error) {
      console.error("Error checking company competitors:", error.message);
      companyHasCompetitors.value = false;
      return;
    }

    companyHasCompetitors.value = data?.length > 0; // Set to true if competitors exist
  } catch (error) {
    console.error("Error checking company competitors:", error.message);
    companyHasCompetitors.value = false;
  }
};
