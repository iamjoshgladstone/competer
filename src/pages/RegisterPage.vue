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

const $q = useQuasar();

const email = ref(null);
const password = ref(null);
const confirmPassword = ref(null);
const errorMessage = ref(null);

const router = useRouter();

const register = async () => {
  if (password.value === confirmPassword.value) {
    try {
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      });
      if (error) throw error;

      // Navigate using the path instead of name
      router.push("/");
    } catch (error) {
      console.error(error);
    }
    return;
  }
};

const onReset = () => {
  email.value = null;
  password.value = null;
  confirmPassword.value = null;
};
</script>
