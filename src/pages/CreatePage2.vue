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
        color="primary"
        @click="generateCompetitors"
        :loading="loading"
        class="q-mb-md"
        :disable="!companyName"
      ></q-btn>
    </q-card>
    <transition class="animate__fadeInLeft">
      <q-card v-if="showCompetitors">
        <q-card-section>
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
            :loading="loading"
            :disable="!selectedCompetitor"
            @click="generateBattlecard"
          ></q-btn>
        </q-card-section>
      </q-card>
    </transition>

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
  </q-page>
</template>

<script setup>
import { ref, watch } from "vue";
import { useBattlecardActions } from "src/use/useBattlecardActions";
import { useChatCompletion } from "src/use/useChatCompletion";

const companyName = ref(""); // User input for company name
const competitors = ref([]); // List of competitors
const selectedCompetitor = ref(""); // Selected competitor
const loading = ref(false); // Loading state
const pageState = ref("input"); // Page state: "input" or "battlecard"
const strengths = ref([]); // List of strengths
const weaknesses = ref([]); // List of weaknesses
const showCompetitors = ref(false); // Control visibility of competitors card

const { fetchStrengthsAndWeaknesses, updateVote } = useBattlecardActions();
const { generateContent } = useChatCompletion();

// Function to generate competitors
const generateCompetitors = async () => {
  if (!companyName.value.trim()) {
    alert("Please enter a company name.");
    return;
  }

  loading.value = true;
  showCompetitors.value = false; // Reset visibility

  try {
    const content = `You are a competitive enablement expert for ${companyName.value}. Create a JSON object with a list of competitors for ${companyName.value} in the following structure: {"competitors":["competitor1", "competitor2", ...]}. Only provide the JSON object as the response.`;

    const result = await generateContent(content, 0.7, "gpt-4o-mini");

    if (result.competitors) {
      competitors.value = result.competitors;
      // Delay setting `showCompetitors` to true for smooth animation
      setTimeout(() => {
        showCompetitors.value = true;
      }, 100); // Optional delay for better animation
    } else {
      console.error("Unexpected response format:", result);
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
  loading.value = true;

  try {
    const content = `You are a competitive enablement expert. Analyze the competitor "${selectedCompetitor.value}" and provide a JSON object with their strengths and weaknesses. Use the following structure: {"strengths":[{"id":1,"content":"strength1"},...],"weaknesses":[{"id":1,"content":"weakness1"},...]}. Only provide the JSON object as the response.`;

    const result = await generateContent(content, 0.7, "gpt-4o-mini");

    if (result && result.strengths && result.weaknesses) {
      strengths.value = result.strengths;
      weaknesses.value = result.weaknesses;
      loading.value = false;
    } else {
      console.error("Unexpected response format:", result);
      alert("Failed to generate battlecard. Please try again.");
    }
  } catch (error) {
    console.error("Error generating battlecard:", error.message);
    alert(`Error generating battlecard: ${error.message}`);
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
  name: "CreatePage",
});
</script>
