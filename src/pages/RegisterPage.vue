<template>
  <q-page
    style="background-color: #f3f3f3"
    class="q-pa-ma flex flex-center column"
  >
    <h3 class="q-gutter-md">Sign Up for Competer</h3>

    <!-- Registration form -->
    <q-form @submit.prevent="register" @reset="onReset">
      <q-input
        filled
        v-model="email"
        label="Email"
        lazy-rules
        :rules="[
          (val, rules) =>
            rules.email(val) || 'Please enter a valid email address',
        ]"
        @blur="autoFillCompanyName"
      />

      <q-input
        filled
        v-model="companyName"
        label="Company Name"
        lazy-rules
        :rules="[(val) => !!val || 'Company Name is required']"
        class="q-mt-sm"
      />

      <q-input
        filled
        type="password"
        v-model="password"
        label="Password"
        id="password"
        lazy-rules
        class="q-mt-sm"
        :rules="[
          (val) => !!val || 'Password is required',
          (val) => val.length >= 5 || 'Password must be at least 5 characters',
        ]"
      />

      <q-input
        filled
        type="password"
        v-model="confirmPassword"
        label="Confirm Password"
        id="confirmPassword"
        lazy-rules
        class="q-mt-sm"
        :rules="[
          (val) => !!val || 'Please confirm your password',
          (val) => val === password || 'Passwords must match',
        ]"
      />

      <div class="q-mt-md">
        <q-btn label="Submit" type="submit" color="primary" />
        <q-btn
          label="Reset"
          type="reset"
          color="primary"
          flat
          class="q-ml-sm"
        />
      </div>

      <router-link
        class="q-mt-sm no-underline"
        to="/login"
        style="display: block; text-decoration: none"
        >Already have an account? Click here to
        <span
          style="
            background-color: yellow;
            color: black;
            padding: 2px 4px;
            border-radius: 3px;
            text-decoration: none;
          "
        >
          login instead.
        </span>
      </router-link>
    </q-form>
  </q-page>
</template>

<script setup>
import { useQuasar } from "quasar";
import { ref } from "vue";
import { supabase } from "app/utils/supabase";
import { useRouter } from "vue-router";
import { useChatCompletion } from "src/use/useChatCompletion";
import { v4 as uuidv4 } from "uuid"; // Import the v4 method to generate UUIDs
const $q = useQuasar();

const email = ref(null);
const companyName = ref(null);
const password = ref(null);
const confirmPassword = ref(null);
const userId = ref(null);

const { generateContent } = useChatCompletion();

const router = useRouter();

const autoFillCompanyName = async () => {
  if (!email.value) return;

  // Extract domain from email
  const domainMatch = email.value.match(/@([^\.]+)\./);
  if (domainMatch && domainMatch[1]) {
    const domain = domainMatch[1];

    // Skip common email providers
    const commonProviders = ["gmail", "yahoo", "outlook", "hotmail", "icloud"];
    if (!commonProviders.includes(domain)) {
      try {
        // Use LLM to generate company name
        const prompt = `Based on the domain '${domain}', what is the company name? Provide a single word answer only of the company name.`;
        const result = await generateContent(prompt);
        companyName.value = result || "";
      } catch (error) {
        console.error("Error generating company name:", error.message);
      }
    }
  }
};

const register = async () => {
  if (password.value === confirmPassword.value) {
    try {
      // Register user in Supabase Auth
      const { data: signUpData, error: authError } = await supabase.auth.signUp(
        {
          email: email.value,
          password: password.value,
        }
      );
      console.log("Supabase Auth SignUp Response:", signUpData);
      if (authError) throw authError;

      // Notify the user of successful registration
      $q.notify({
        color: "positive",
        message: "Registration successful! Please check your email to confirm.",
        icon: "check_circle",
      });

      // Insert user into the 'userstorage' table
      const { error: dbError } = await supabase.from("userstorage").insert([
        {
          id: signUpData.user.id, // Use the user's ID from Supabase Auth
          email: email.value,
          company_name: companyName.value,
          company_url: "",
        },
      ]);

      // Redirect to the login page
      router.push("/login");
    } catch (error) {
      console.error("Registration failed:", error.message);
      $q.notify({
        color: "negative",
        message: `Registration failed: ${error.message}`,
        icon: "error",
      });
    }
  } else {
    // Notify the user if passwords do not match
    $q.notify({
      color: "negative",
      message: "Passwords do not match.",
      icon: "error",
    });
  }
};

const onReset = () => {
  email.value = null;
  companyName.value = null;
  password.value = null;
  confirmPassword.value = null;
};
</script>
