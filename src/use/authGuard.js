import { supabase } from "app/utils/supabase";
import { auth } from "src/stores/authStore";

export const authGuard = async (to, from, next) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    auth.value = true; // Set auth to true if session exists
    next(); // Allow access
  } else {
    auth.value = false; // Set auth to false if no session exists
    next("/login"); // Redirect to login
  }
};
