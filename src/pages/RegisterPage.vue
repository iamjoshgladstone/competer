<template>
  <q-page
    style="background-color: #f3f3f3"
    class="q-pa-md flex flex-center column"
  >
    <h3 class="q-gutter-md">Sign Up for Competer</h3>

    <!-- Registration Form -->
    <q-form @submit.prevent="register" @reset="onReset">
      <!-- Email Input -->
      <q-input
        filled
        v-model="email"
        label="Email"
        lazy-rules
        :rules="[
          (val) => !!val || 'Email is required',
          (val) =>
            /.+@.+\..+/.test(val) || 'Please enter a valid email address',
        ]"
        @blur="autoFillCompanyName"
      />

      <!-- Company Inputs Side-by-Side -->
      <div class="row q-gutter-md q-mt-md">
        <q-input
          filled
          v-model="companyName"
          label="Company Name"
          class="col"
          :rules="[(val) => !!val || 'Company name is required']"
        />

        <q-input
          filled
          v-model="companyUrl"
          label="Company URL"
          class="col"
          placeholder="https://example.com"
          :rules="[
            (val) => !!val || 'Company URL is required',
            (val) => /.+\..+/.test(val) || 'Enter a valid URL',
          ]"
        />
      </div>

      <!-- Password Inputs -->
      <q-input
        filled
        type="password"
        v-model="password"
        label="Password"
        class="q-mt-md"
        :rules="[(val) => !!val || 'Password is required']"
      />

      <q-input
        filled
        type="password"
        v-model="confirmPassword"
        label="Confirm Password"
        class="q-mt-sm"
        :rules="[
          (val) => !!val || 'Please confirm your password',
          (val) => val === password || 'Passwords must match',
        ]"
      />

      <!-- Submit & Reset Buttons -->
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
    </q-form>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { supabase } from "app/utils/supabase";
import { v4 as uuidv4 } from "uuid"; // Import UUID generator
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";

const $q = useQuasar();
const router = useRouter();

const email = ref("");
const companyName = ref("");
const companyUrl = ref("");
const password = ref("");
const confirmPassword = ref("");
const companyDivision = ref(""); // Optional division input

const register = async () => {
  if (password.value !== confirmPassword.value) {
    $q.notify({
      color: "negative",
      message: "Passwords do not match.",
      icon: "error",
    });
    return;
  }

  try {
    // Prepend "https://" to the URL if missing
    let formattedCompanyUrl = companyUrl.value.trim();
    if (!/^https?:\/\//i.test(formattedCompanyUrl)) {
      formattedCompanyUrl = `https://${formattedCompanyUrl}`;
    }

    let companyUuid;

    // Step 1: Search for the company in the 'companies' table
    const { data: existingCompanies, error: searchError } = await supabase
      .from("companies")
      .select("company_uuid")
      .or(
        `company_name.eq.${companyName.value},company_url.eq.${formattedCompanyUrl}`
      )
      .limit(1);

    if (searchError) throw searchError;

    if (existingCompanies && existingCompanies.length > 0) {
      // Step 2: Company exists, use its UUID
      companyUuid = existingCompanies[0].company_uuid;
    } else {
      // Step 3: Company does not exist, generate new UUID and insert into 'companies' table
      companyUuid = uuidv4();

      const { error: insertCompanyError } = await supabase
        .from("companies")
        .insert([
          {
            company_uuid: companyUuid,
            company_name: companyName.value,
            company_url: formattedCompanyUrl,
            company_division: companyDivision.value || null, // Optional division
          },
        ]);

      if (insertCompanyError) throw insertCompanyError;
    }

    // Step 4: Register user in Supabase Auth
    const { data: signUpData, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    });

    if (authError) throw authError;

    // Step 5: Insert user details into 'userstorage' table
    const { error: insertUserError } = await supabase
      .from("userstorage")
      .insert([
        {
          user_id: signUpData.user.id,
          user_email: email.value,
          company_name: companyName.value,
          company_uuid: companyUuid,
        },
      ]);

    if (insertUserError) throw insertUserError;

    // Success Notification
    $q.notify({
      color: "positive",
      message: "Registration successful! Please check your email to confirm.",
      icon: "check_circle",
    });

    // Redirect to Login Page
    router.push("/login");
  } catch (error) {
    console.error("Error:", error.message);
    $q.notify({
      color: "negative",
      message: `Registration failed: ${error.message}`,
      icon: "error",
    });
  }
};

const onReset = () => {
  email.value = "";
  companyName.value = "";
  companyUrl.value = "";
  companyDivision.value = "";
  password.value = "";
  confirmPassword.value = "";
};
</script>
