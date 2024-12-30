<template>
  <q-page class="q-pa-ma flex flex-center column">
    <h3 class="q-gutter-md">Login to Competer</h3>

    <!-- Login form -->
    <q-form @submit.prevent="login" @reset="onReset">
      <q-input
        filled
        v-model="email"
        label="Email"
        lazy-rules
        :rules="[
          (val, rules) => !!val || 'Email is required',
          (val, rules) =>
            rules.email(val) || 'Please enter a valid email address',
          () => emailErrorMessage || true, // Dynamically show error from emailErrorMessage
        ]"
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
          () => passwordErrorMessage || true, // Dynamically show error from passwordErrorMessage
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
        to="/register"
        style="display: block; text-decoration: none"
        >Already have an account? Click here to
        <span
          style="
            background-color: #fb3fb3;
            color: #fff;
            padding: 2px 4px;
            border-radius: 3px;
            text-decoration: none;
          "
        >
          sign up instead.
        </span>
      </router-link>
    </q-form>
  </q-page>
</template>

<script setup>
import { useQuasar } from "quasar";
import { ref } from "vue";
import { supabase } from "src/utils/supabase";
import { useRouter } from "vue-router";

const $q = useQuasar();
const router = useRouter();

const email = ref(null);
const password = ref(null);
const emailErrorMessage = ref(null);
const passwordErrorMessage = ref(null);

const login = async () => {
  // Clear previous error messages
  emailErrorMessage.value = null;
  passwordErrorMessage.value = null;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) {
      // Update error messages dynamically based on login failure
      if (error.message.includes("email")) {
        emailErrorMessage.value = "Invalid email address.";
      } else if (error.message.includes("password")) {
        passwordErrorMessage.value = "Incorrect password.";
      } else {
        $q.notify({
          color: "red-5",
          textColor: "white",
          icon: "error",
          message: error.message || "Login failed.",
        });
      }
      throw error;
    }

    router.push("/");
  } catch (error) {
    console.error(error);
  }
};

const onReset = () => {
  email.value = null;
  password.value = null;
  emailErrorMessage.value = null;
  passwordErrorMessage.value = null;
};
</script>
