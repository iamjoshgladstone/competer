<template>
  <q-page>
    <div class="q-pa-xl">
      <!-- Flex Container for Side-by-Side Layout -->
      <p class="text-bold">Competing against: {{ competitorName }}</p>
      <div class="side-by-side flex row q-gutter-md">
        <!-- Left Section: Prospect Details Input -->
        <div class="prospect-details column shadow-13 q-pa-xl" style="flex: 1">
          <p>Who is your prospect?</p>
          <q-input
            v-model="prospectName"
            filled
            label="Prospect Name"
            class="q-mb-md"
          />
          <q-select
            v-if="prospectSuggestions.length > 0 && prospectNeeds.length === 0"
            v-model="prospectName"
            :options="prospectSuggestions.map((item) => item.prospect_name)"
            label="Select Prospect"
            emit-value
            map-options
            @click="fetchProspectNeeds"
            class="q-mb-md"
          />
          <q-input
            v-model="prospectUrl"
            filled
            label="Prospect Website URL"
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

          <!-- No Needs Fetched -->
          <div
            v-else-if="!loading && prospectNeeds.length === 0"
            class="q-mt-md"
          >
            <p>
              No prospect needs generated yet. Enter details and click "Generate
              Prospect Needs".
            </p>
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage" class="text-negative q-mt-md">
            {{ errorMessage }}
          </div>
        </div>

        <!-- Right Section: Prospect Needs -->
        <div class="prospect-needs column" style="flex: 1; padding-left: 16px">
          <div v-if="prospectNeeds.length > 0 || newCustomNeed">
            <div class="text-h6">What does this prospect care about?</div>
            <p style="font-size: 15px; font-weight: 500">
              Add or remove prospect needs, then click
              <span class="text-green">"Generate"</span> content.
            </p>
            <div class="flex wrap q-gutter-md q-mt-md">
              <!-- Existing prospect needs -->
              <q-chip
                v-for="need in prospectNeeds"
                :key="need"
                :color="'primary'"
                text-color="white"
                class="position-relative"
              >
                {{ need }}
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
              color="accent"
              style="color: black"
              label="Generate Content"
              @click="generateContent"
              :loading="loading"
              class="q-mb-md q-mt-lg"
            />
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "src/utils/supabase";
import { useChatCompletion } from "src/use/useChatCompletion";
import { companyName, companyUuid } from "src/stores/authStore";
import { debounce } from "lodash"; // Use lodash for debounce

const route = useRoute();
const { generateContentSpecificModel, loading } = useChatCompletion();

const competitorName = ref(""); // Competitor's name fetched from the database
const prospectName = ref("");
const prospectUrl = ref("");
const prospectNeeds = ref([]); // Array of needs from LLM
const selectedNeeds = ref([]); // Tracks selected needs
const errorMessage = ref(""); // Error handling
const newCustomNeed = ref(""); // Holds the value of manually added need
const prospectData = ref([]);

// Provide fuzzy search as looking for prospect
const prospectSuggestions = ref([]);

const fetchProspectSuggestions = debounce(async (query) => {
  if (!query) {
    prospectSuggestions.value = [];
    return;
  }

  try {
    const { data, error } = await supabase
      .from("prospects")
      .select("prospect_name, prospect_needs")
      .ilike("prospect_name", `%${query}%`);

    if (error) {
      throw new Error("Failed to fetch prospect suggestions.");
    }

    prospectSuggestions.value = data;
  } catch (error) {
    console.error("Error fetching prospect suggestions:", error.message);
    errorMessage.value = "Failed to fetch suggestions.";
  }
}, 300);

watch(prospectName, (newValue) => {
  fetchProspectSuggestions(newValue);
});

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

// Fetch Prospect Needs or Generate

const fetchProspectNeeds = async () => {
  if (!prospectName.value) {
    errorMessage.value = "Please enter a Prospect Name.";
    return;
  }

  errorMessage.value = "";
  prospectNeeds.value = [];
  selectedNeeds.value = [];

  try {
    // Check if prospect is already in the database
    const { data, error } = await supabase
      .from("prospects")
      .select("prospect_needs, prospect_url")
      .ilike("prospect_name", `%${prospectName.value}%`)
      .single();

    if (data && data.prospect_needs) {
      // Use existing needs from the database
      prospectNeeds.value = data.prospect_needs;
      prospectUrl.value = data.prospect_url;
    } else {
      // Query LLM if no database match
      await queryLLMForNeeds();
    }
  } catch (error) {
    console.error("Error fetching prospect needs:", error.message);
    errorMessage.value = "Failed to fetch prospect needs. Please try again.";
  }
};

const queryLLMForNeeds = async () => {
  const content = `Provide JSON only. No preamble. You are a VP of Competitive Enablement for ${companyName.value}. Generate a JSON array of business needs that ${prospectName.value} would have in the context of ${companyName.value}'s product. Use research from around the web - why are they shopping for this product now? Are they price sensitive because of recent layoffs? Are they losing business?  Provide each need as a simple string. Max 8 words or less. Nothing else. Example: [
    "Pricing",
    "Automate battlecard creation",
    "Elevate win rate",
]`;

  try {
    const response = await generateContentSpecificModel({
      model: "llama-3.1-sonar-huge-128k-online",
      messages: [{ role: "user", content }],
      temperature: 0.7,
    });

    const parsedNeeds = JSON.parse(response);
    if (Array.isArray(parsedNeeds)) {
      prospectNeeds.value = parsedNeeds;
    } else {
      throw new Error("Invalid response format.");
    }
  } catch (error) {
    console.error("Error querying LLM:", error.message);
    errorMessage.value = "Failed to generate prospect needs. Please try again.";
  }
};

// Step 4: Add custom prospect need
// Removed selection toggle
const addCustomNeed = () => {
  const trimmedNeed = newCustomNeed.value.trim();
  if (trimmedNeed && !prospectNeeds.value.includes(trimmedNeed)) {
    prospectNeeds.value.push(trimmedNeed);
    newCustomNeed.value = "";
  }
};

const deleteNeed = (need) => {
  prospectNeeds.value = prospectNeeds.value.filter((n) => n !== need);
};

// Step 7: Generate Content

const generateContent = async () => {
  try {
    // Retrieve the current user's UUID and company UUID
    const userUuid = (await supabase.auth.getUser()).data.user.id;

    // Prepare data to insert into the database
    const prospectData = {
      user_uuid: userUuid,
      company_uuid: companyUuid.value,
      prospect_name: prospectName.value.trim(),
      prospect_url: prospectUrl.value.trim(),
      prospect_needs: prospectNeeds.value.length > 0 ? prospectNeeds.value : [],
      // Pass array directly
    };

    console.log("Inserting Prospect Data:", prospectData);

    // Insert the data into the `prospects` table
    const { data, error } = await supabase
      .from("prospects")
      .insert([prospectData]);

    if (error) {
      console.error(
        "Supabase Insert Error:",
        error.message,
        error.details,
        error.hint
      );
      throw new Error("Failed to save prospect details.");
    }

    console.log("Prospect data saved successfully:", data);
  } catch (error) {
    console.error("Error saving prospect data:", error.message);
    errorMessage.value = "Failed to save prospect data. Please try again.";
  }
};

// OnMounted Lifecycle
onMounted(async () => {
  console.log("Competitor UUID:", competitorUuid);
  await fetchCompetitorName();
  console.log((await supabase.auth.getUser()).data.user.id);
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
