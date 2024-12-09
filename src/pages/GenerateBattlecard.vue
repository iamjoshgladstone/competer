<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md">
      <q-input
        filled
        v-model="companyName"
        label="Type in company name"
        hint="Enter the name of the company"
        clearable
        class="q-mb-md"
      ></q-input>
      <q-btn
        label="Submit"
        color="primary"
        @click="generateCompetitors"
        :loading="loading"
        class="q-mb-md"
      ></q-btn>

      <!-- Dropdown populated with competitors -->
      <q-select
        v-if="competitors.length > 0"
        filled
        v-model="selectedCompetitor"
        :options="competitors"
        label="Select a competitor"
        hint="Pick from the generated competitors"
        class="q-mb-md"
      ></q-select>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

const companyName = ref("");
const competitors = ref([]);
const selectedCompetitor = ref("");
const loading = ref(false);

const generateCompetitors = async () => {
  if (!companyName.value.trim()) {
    alert("Please enter a company name.");
    return;
  }

  const BASE_URL = "https://litellm.prod.klue.io/v1";
  const MODEL = "gpt-4"; // Changed from "gpt-4o-mini" to "gpt-4"
  const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

  loading.value = true;

  try {
    const payload = {
      model: MODEL,
      messages: [
        {
          role: "user",
          content: `You are a competitive enablement expert for ${companyName.value}. Create a simple JSON list of competitors in the following structure: {competitors:[competitor1, competitor2]}`,
        },
      ],
      temperature: 0.7, // Added temperature parameter
      max_tokens: 500, // Added max_tokens parameter
    };

    const response = await axios.post(`${BASE_URL}/chat/completions`, payload, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json", // Added Accept header
      },
    });

    const result = response.data;
    if (result && result.choices && result.choices.length > 0) {
      try {
        const generatedText = result.choices[0].message.content;
        const parsedResponse = JSON.parse(generatedText);

        if (parsedResponse.competitors) {
          competitors.value = parsedResponse.competitors;
        } else {
          throw new Error("Invalid response format");
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        alert("Failed to parse the API response. Please try again.");
      }
    } else {
      throw new Error("Invalid API response");
    }
  } catch (error) {
    console.error("Error generating competitors:", error);
    alert(
      `Error generating competitors: ${
        error.response?.data?.error?.message || error.message || "Unknown error"
      }`
    );
  } finally {
    loading.value = false;
  }
};
</script>
