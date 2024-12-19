<template>
  <q-page>
    <div class="q-pa-xl">
      <!-- Header with Competitor Name -->
      <h4 class="q-mb-md">
        Generate Content in Context of Competitor: {{ competitorName }}
      </h4>

      <!-- Prospect Details Input -->
      <q-input
        v-model="prospectName"
        filled
        label="Prospect Name"
        placeholder="e.g., ABC Corp"
        class="q-mb-md"
      />
      <q-input
        v-model="prospectUrl"
        filled
        label="Prospect Website URL"
        placeholder="e.g., https://abc.com"
        class="q-mb-md"
      />

      <!-- Submit Button -->
      <q-btn
        color="primary"
        label="Generate Prospect Needs"
        @click="fetchProspectNeeds"
        :loading="loading"
        class="q-mb-md"
        v-if="!prospectNeeds.length > 0"
      />

      <!-- Error Message -->
      <div v-if="errorMessage" class="text-negative q-mt-md">
        {{ errorMessage }}
      </div>

      <!-- Prospect Needs Display -->
      <div v-if="prospectNeeds.length > 0" class="q-mt-md">
        <h6>Select Prospect Needs:</h6>
        <div class="flex wrap q-gutter-md q-mt-md">
          <!-- Existing prospect needs -->
          <q-chip
            v-for="need in prospectNeeds"
            :key="need"
            clickable
            :color="isSelected(need) ? 'accent' : 'primary'"
            text-color="white"
            @click="toggleNeedSelection(need)"
            class="position-relative"
          >
            <!-- Chip Text -->
            {{ need }}

            <!-- Delete Icon -->
            <q-icon
              name="cancel"
              size="sm"
              color="red"
              class="delete-icon"
              @click.stop="deleteNeed(need)"
            />
          </q-chip>

          <!-- Add custom prospect need -->
          <q-chip
            clickable
            color="grey-3"
            text-color="black"
            @click.stop
            class="add-chip"
          >
            <q-input
              v-model="newCustomNeed"
              placeholder="+ Add Prospect Need"
              dense
              borderless
              @keydown.enter="addCustomNeed"
            />
          </q-chip>
        </div>
        <!-- Generate Content Button -->
        <q-btn
          color="secondary"
          style="color: black"
          label="Generate Compete Content"
          @click="generateContent"
          :loading="loading"
          class="q-mb-md q-mt-lg"
          v-if="prospectNeeds.length > 0"
        />
      </div>

      <!-- No Needs Fetched -->
      <div v-else-if="!loading && prospectNeeds.length === 0" class="q-mt-md">
        <p>
          No prospect needs generated yet. Enter details and click "Generate
          Prospect Needs".
        </p>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "app/utils/supabase";
import { useChatCompletion } from "src/use/useChatCompletion";
import { companyName } from "src/stores/authStore";

const route = useRoute();
const { generateContentSpecificModel, loading } = useChatCompletion();

const competitorName = ref(""); // Competitor's name fetched from the database
const prospectName = ref("");
const prospectUrl = ref("");
const prospectNeeds = ref([]); // Array of needs from LLM
const selectedNeeds = ref([]); // Tracks selected needs
const errorMessage = ref(""); // Error handling
const newCustomNeed = ref(""); // Holds the value of manually added need

// Fetch competitor UUID from dynamic route
const competitorUuid = route.params.uuid;

// Step 1: Fetch Competitor Name from companies table
const fetchCompetitorName = async () => {
  try {
    const { data, error } = await supabase
      .from("companies")
      .select("company_name")
      .eq("company_uuid", competitorUuid)
      .single();

    if (error) {
      console.error("Error fetching competitor name:", error.message);
      errorMessage.value = "Failed to fetch competitor details.";
    } else {
      competitorName.value = data.company_name || "Competitor";
    }
  } catch (err) {
    console.error("Error fetching competitor name:", err.message);
    errorMessage.value = "Failed to load competitor details.";
  }
};

// Step 2: Query the LLM to generate needs
const fetchProspectNeeds = async () => {
  if (!prospectName.value || !prospectUrl.value) {
    errorMessage.value = "Please enter both Prospect Name and URL.";
    return;
  }

  errorMessage.value = "";
  prospectNeeds.value = [];
  selectedNeeds.value = [];

  const content = `Provide JSON only. No preamble. You are a VP of Competitive Enablement for ${companyName.value}. Generate a JSON array of business needs that ${prospectName.value} would have for why they are shopping for ${companyName.value}'s product. Use research from around the web - why are they shopping for this product now? Provide each need as a simple string. Max 8 words or less. Nothing else. Example: [
    "Track competitor website updates",
    "Gather and analyze market insights across 100+ types of market information",
    "Automate battlecard creation and maintenance with AI-powered tools",
    "Enhance sales intelligence with timely and relevant competitor data",
    "Integrate competitive intelligence with existing CRM systems like Salesforce",
    "Streamline competitive landscape data collection and analysis",
    "Monitor competitor social media and industry trends efficiently",
    "Create detailed, up-to-date battlecards for strategic planning and decision-making",
    "Identify emerging competitors and track their activities proactively",
    "Facilitate cross-functional collaboration on competitive intelligence efforts"
]`;
  // const content = `Provide JSON only. Nothing You are a content strategist. Based on a company named "${prospectName.value}" with the website "${prospectUrl.value}", generate a JSON array of 10 potential business needs in the context of the competitor "${competitorName.value}". Provide each need as a simple string.`;

  try {
    const response = await generateContentSpecificModel({
      model: "llama-3.1-sonar-huge-128k-online",
      messages: [{ role: "user", content }],
      temperature: 0.7,
    });

    // Parse response as JSON
    const parsedNeeds = JSON.parse(response);
    console.log(parsedNeeds.value);
    console.log(parsedNeeds);
    if (Array.isArray(parsedNeeds)) {
      prospectNeeds.value = parsedNeeds;
    } else {
      throw new Error("Invalid response format.");
    }
  } catch (error) {
    console.error("Error fetching prospect needs:", error.message);
    errorMessage.value = "Failed to generate prospect needs. Please try again.";
  }
};

// Step 3: Toggle selected prospect needs
const toggleNeedSelection = (need) => {
  if (selectedNeeds.value.includes(need)) {
    selectedNeeds.value = selectedNeeds.value.filter((n) => n !== need);
  } else {
    selectedNeeds.value.push(need);
  }
};

// Step 4: Add custom prospect need
const addCustomNeed = () => {
  const trimmedNeed = newCustomNeed.value.trim();
  if (trimmedNeed && !prospectNeeds.value.includes(trimmedNeed)) {
    prospectNeeds.value.push(trimmedNeed);
    newCustomNeed.value = "";
  }
};

// Step 5: Delete a prospect need
const deleteNeed = (need) => {
  prospectNeeds.value = prospectNeeds.value.filter((n) => n !== need);
  selectedNeeds.value = selectedNeeds.value.filter((n) => n !== need);
};

// Step 6: Check if a need is selected
const isSelected = (need) => selectedNeeds.value.includes(need);

// Step 7: Generate Content

const generateContent = () => {
  console.log(selectedNeeds.value);
};

// OnMounted Lifecycle
onMounted(async () => {
  console.log("Competitor UUID:", competitorUuid);
  await fetchCompetitorName();
});
</script>

<style scoped>
/* Chip styling for better visuals */
.q-chip {
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.add-chip {
  background-color: #f3f3f3;
  min-width: 180px;
}

.add-chip input {
  font-size: 14px;
}

/* Delete icon styling */
.delete-icon {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: white;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-icon:hover {
  color: darkred;
}
</style>
