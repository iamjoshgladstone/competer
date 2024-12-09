<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-md">
      <q-input
        filled
        v-model="companyName"
        label="Type in your company name"
        clearable
        class="q-mb-md"
      ></q-input>
      <q-btn
        label="Submit"
        color="secondary"
        @click="generateCompetitors"
        :loading="loading"
        class="q-mb-md"
      ></q-btn>

      <q-card-section v-if="competitors.length > 0">
        <q-select
          v-model="selectedCompetitor"
          :options="competitors"
          label="Select a Competitor"
          rounded
          outlined
          dense
        ></q-select>
        <q-btn
          class="q-mt-lg"
          label="Generate Battlecard"
          color="primary"
          :disable="!selectedCompetitor"
          @click="generateBattlecard"
        ></q-btn>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";

// State variables
const companyName = ref(""); // User input for company name
const competitors = ref([]); // List of competitors extracted from the API response
const selectedCompetitor = ref(""); // Selected competitor from the dropdown
const loading = ref(false); // Loading state for the submit button

// Function to generate competitors
const generateCompetitors = async () => {
  if (!companyName.value.trim()) {
    alert("Please enter a company name.");
    return;
  }

  const API_KEY = import.meta.env.VITE_OPENAI_API_KEY; // API key from .env.local
  const BASE_URL = "https://litellm.staging.klue.io/v1/chat/completions";
  const MODEL = "gpt-4o-mini";

  loading.value = true; // Start loading

  try {
    // Create headers
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${API_KEY}`);
    myHeaders.append("Content-Type", "application/json");

    // Create the payload
    const raw = JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: `You are a competitive enablement expert for ${companyName.value}. Create a JSON object with a list of competitors for ${companyName.value} in the following structure: {"competitors":["competitor1", "competitor2", ...]}. Only provide the JSON object as the response.`,
        },
      ],
      temperature: 0.7,
    });

    // Define the request options
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    // Make the fetch request
    const response = await fetch(BASE_URL, requestOptions);

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json(); // Parse the response as JSON
    let messageContent = result.choices[0].message.content;

    // Sanitize the response by removing code block formatting
    messageContent = messageContent
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Parse the JSON content
    const parsedResponse = JSON.parse(messageContent);
    if (parsedResponse.competitors) {
      competitors.value = parsedResponse.competitors; // Update the list of competitors
    } else {
      console.error("Unexpected response format:", messageContent);
      alert("Failed to retrieve competitors. Please try again.");
    }
  } catch (error) {
    console.error("Error generating competitors:", error.message);
    alert(`Error generating competitors: ${error.message}`);
  } finally {
    loading.value = false; // End loading
  }
};

// Generate Battlecard
const generateBattlecard = () => {
  console.log(selectedCompetitor.value);
};
</script>
