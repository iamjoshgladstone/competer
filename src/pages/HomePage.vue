<template>
  <q-page class="q-pa-md">
    <q-transition name="fade">
      <div v-if="pageState === 'input'">
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
            color="primary"
            @click="generateCompetitors"
            :loading="loading"
            class="q-mb-md"
            :disable="!companyName"
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
      </div>
    </q-transition>

    <q-transition name="slide-left">
      <div v-if="pageState === 'battlecard'">
        <q-card class="q-pa-md">
          <h3>{{ selectedCompetitor }} - Strengths</h3>
          <q-list bordered>
            <q-item v-for="strength in strengths" :key="strength.id">
              <q-item-section>{{ strength.content }}</q-item-section>
              <q-item-section side>
                <q-btn
                  icon="check"
                  color="positive"
                  flat
                  @click="handleVote(strength.id, 'upvote')"
                ></q-btn>
                <q-btn
                  icon="close"
                  color="negative"
                  flat
                  @click="handleVote(strength.id, 'downvote')"
                ></q-btn>
              </q-item-section>
            </q-item>
          </q-list>

          <h3 class="q-mt-lg">{{ selectedCompetitor }} - Weaknesses</h3>
          <q-list bordered>
            <q-item v-for="weakness in weaknesses" :key="weakness.id">
              <q-item-section>{{ weakness.content }}</q-item-section>
              <q-item-section side>
                <q-btn
                  icon="check"
                  color="positive"
                  flat
                  @click="handleVote(weakness.id, 'upvote')"
                ></q-btn>
                <q-btn
                  icon="close"
                  color="negative"
                  flat
                  @click="handleVote(weakness.id, 'downvote')"
                ></q-btn>
              </q-item-section>
            </q-item>
          </q-list>

          <q-btn
            label="Back"
            color="primary"
            flat
            class="q-mt-md"
            @click="goBack"
          ></q-btn>
        </q-card>
      </div>
    </q-transition>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useBattlecardActions } from "src/use/useBattlecardActions";

const companyName = ref(""); // User input for company name
const competitors = ref([]); // List of competitors
const selectedCompetitor = ref(""); // Selected competitor
const loading = ref(false); // Loading state
const pageState = ref("input"); // Page state: "input" or "battlecard"
const strengths = ref([]); // List of strengths
const weaknesses = ref([]); // List of weaknesses

const { fetchStrengthsAndWeaknesses, updateVote } = useBattlecardActions();

// Function to generate competitors
const generateCompetitors = async () => {
  if (!companyName.value.trim()) {
    alert("Please enter a company name.");
    return;
  }

  const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  const BASE_URL = "https://litellm.staging.klue.io/v1/chat/completions";
  const MODEL = "gpt-4o-mini";

  loading.value = true;

  try {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${API_KEY}`);
    myHeaders.append("Content-Type", "application/json");

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

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    const response = await fetch(BASE_URL, requestOptions);

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    let messageContent = result.choices[0].message.content;

    messageContent = messageContent
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsedResponse = JSON.parse(messageContent);

    if (parsedResponse.competitors) {
      competitors.value = parsedResponse.competitors;
    } else {
      console.error("Unexpected response format:", messageContent);
      alert("Failed to retrieve competitors. Please try again.");
    }
  } catch (error) {
    console.error("Error generating competitors:", error.message);
    alert(`Error generating competitors: ${error.message}`);
  } finally {
    loading.value = false;
  }
};

// Function to generate the battlecard
const generateBattlecard = async () => {
  pageState.value = "battlecard";

  const data = await fetchStrengthsAndWeaknesses(selectedCompetitor.value);
  if (data) {
    strengths.value = data.filter((item) => item.type === "strength");
    weaknesses.value = data.filter((item) => item.type === "weakness");
  }
};

// Handle voting
const handleVote = async (id, voteType) => {
  const response = await updateVote(id, voteType);
  if (response && voteType === "downvote") {
    strengths.value = strengths.value.filter((item) => item.id !== id);
    weaknesses.value = weaknesses.value.filter((item) => item.id !== id);
  }
};

// Go back to input page
const goBack = () => {
  pageState.value = "input";
};

defineOptions({
  name: "HomePage",
});
</script>
