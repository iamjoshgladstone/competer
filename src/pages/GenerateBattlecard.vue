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

// Define state variables
const companyName = ref(""); // User-input company name
const competitors = ref([]); // Competitor list generated from the API
const selectedCompetitor = ref(""); // Selected competitor from the dropdown
const loading = ref(false); // Loading state for the submit button

// Function to call the API
const generateCompetitors = async () => {
  if (!companyName.value.trim()) {
    alert("Please enter a company name.");
    return;
  }

  loading.value = true; // Show loading indicator
  try {
    const apiUrl = "https://litellm.staging.klue.io/v1/completions"; // Adjust endpoint as needed
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY; // Add key in .env.local

    const response = await axios.post(
      apiUrl,
      {
        model: "text-davinci-003", // Example model; adjust as needed
        prompt: `You are a competitive enablement expert for ${companyName.value}. Create a simple JSON list of competitors in the following structure: {competitors:[competitor1, competitor2]}`,
        max_tokens: 100,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const responseData = response.data; // Parse API response
    const parsedResponse = JSON.parse(responseData.choices[0].text); // Extract the JSON response

    if (parsedResponse && parsedResponse.competitors) {
      competitors.value = parsedResponse.competitors; // Update competitors list
    } else {
      console.error("Unexpected response format:", responseData);
      alert("Failed to retrieve competitors. Please try again.");
    }
  } catch (error) {
    console.error("Error fetching competitors:", error);
    alert("Error generating competitors. Please check your API setup.");
  } finally {
    loading.value = false; // Hide loading indicator
  }
};
</script>
