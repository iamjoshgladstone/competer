import { ref } from "vue";
import { supabase } from "app/utils/supabase";

export const auth = ref(false); // Holds the authentication state
export const companyName = ref(null); // Holds the company name

export const fetchCompanyName = async () => {
  try {
    // Get the currently logged-in user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Fetch the company name from the userstorage table using the user's email
      const { data, error } = await supabase
        .from("userstorage")
        .select("company_name")
        .eq("email", user.email)
        .single(); // Fetch a single row

      if (error) {
        console.error("Error fetching company name:", error.message);
        companyName.value = null;
        return null;
      }

      // Set the company name to the ref
      companyName.value = data?.company_name || "Unknown Company";
      return companyName.value;
    } else {
      // If no user is logged in
      companyName.value = null;
      return null;
    }
  } catch (error) {
    console.error("Error fetching company name:", error.message);
    companyName.value = null;
    return null;
  }
};
