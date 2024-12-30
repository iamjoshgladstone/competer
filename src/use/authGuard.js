import { supabase } from "../utils/supabase";
import { useAuthStore } from "../stores/authStore";

export const authGuard = async (to, from, next) => {
  const authStore = useAuthStore();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    authStore.user = session.user;
    await authStore.fetchCompanyDetails();
    next();
  } else {
    authStore.clearAuth();
    next("/login");
  }
};
