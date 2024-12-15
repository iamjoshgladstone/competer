<template>
  <q-page style="background-color: #f3f3f3">
    <div class="q-pa-md">
      <h4>Select a competitor to generate your battlecard</h4>

      <!-- Competitors Grid -->
      <div class="fit row wrap justify-start items-start content-start">
        <!-- Render competitors dynamically -->
        <q-card
          v-for="competitor in competitors"
          :key="competitor.id"
          class="q-pa-sm q-ma-sm"
          style="cursor: pointer; height: 150px; width: 150px"
          @click="generateBattlecard(competitor)"
        >
          <div class="flex flex-center">
            <q-img
              :src="competitor.logo"
              style="max-width: 75px; object-fit: contain !important"
              ratio="1"
              fit="contain"
              class="q-mb-sm q-pa-sm"
            />
          </div>
          <div class="text-center">{{ competitor.name }}</div>
        </q-card>

        <!-- Add Competitor Card -->
        <q-card
          class="q-pa-sm q-ma-sm flex column"
          style="
            cursor: pointer;
            height: 150px;
            width: 150px;
            align-items: center;
            justify-content: center;
            border: dashed 2px #ccc;
          "
          @click="openAddModal"
        >
          <q-icon name="add" size="50px" color="primary" />
          <div class="text-center">Generate for New Competitor</div>
        </q-card>
      </div>

      <!-- Add Competitor Modal -->
      <q-dialog v-model="isModalOpen">
        <q-card style="max-width: 400px; margin: auto">
          <q-card-section>
            <div class="text-h6">Add Competitor</div>
          </q-card-section>

          <q-card-section>
            <q-input v-model="newCompetitorUrl" label="Company URL" filled />
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Cancel"
              color="negative"
              @click="closeAddModal"
            />
            <q-btn
              flat
              label="Add Competitor"
              color="primary"
              @click="addCompetitor"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useChatCompletion } from "src/use/useChatCompletion";
import { useQuasar } from "quasar";
import axios from "axios";
import { supabase } from "app/utils/supabase";
import { v4 as uuidv4 } from "uuid"; // Import the UUID generation function
import { fetchCompanyName, companyName } from "src/stores/authStore";

const competitors = ref([]); // List of competitors
const isModalOpen = ref(false); // Modal state
const newCompetitorUrl = ref(""); // User-entered competitor URL

const $q = useQuasar();

const { generateContentSpecificModel } = useChatCompletion(); // Chat Completion API

// Function to fetch the logo from a free API (Clearbit API in this example)
const fetchLogo = async (domain) => {
  try {
    const logoUrl = `https://logo.clearbit.com/${domain}`;
    const response = await axios.get(logoUrl, { responseType: "blob" });
    if (response.status === 200) {
      return logoUrl; // Return the logo URL if valid
    }
  } catch (error) {
    console.error(`Failed to fetch logo for domain ${domain}:`, error.message);
    return "https://via.placeholder.com/150"; // Placeholder if logo fetch fails
  }
};

const fetchOrQueryCompetitors = async () => {
  try {
    $q.loading.show();

    // Get the logged-in user
    const { data: signUpData, error: userError } =
      await supabase.auth.getUser();
    if (userError || !signUpData?.user?.id) {
      console.error(
        "Error fetching user:",
        userError?.message || "No user found."
      );
      $q.loading.hide();
      return;
    }

    // Check if the user has competitors stored in Supabase
    const { data: userData, error: fetchError } = await supabase
      .from("userstorage")
      .select("competitors")
      .eq("id", signUpData.user.id) // Match the `id` in `userstorage` with the authenticated user's `id`
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error querying competitors:", fetchError.message);
      $q.loading.hide();
      return;
    }

    if (userData?.competitors) {
      // If competitors exist in Supabase, use them
      competitors.value = userData.competitors;
    } else {
      // Ensure `companyName` is fetched and use its value
      await fetchCompanyName(); // Ensure companyName is loaded before using it
      const companyNameValue = companyName.value || "your company"; // Fallback if companyName is empty

      // Query LLM to generate competitors
      const prompt = `You are VP of Competitive Enablement for ${companyNameValue}. Generate a JSON list of competitors with fields: name, domain (e.g., domain.com). Just the JSON. Nothing else.`;
      const model = "gpt-4o";
      const messages = [{ role: "user", content: prompt }];
      const temperature = 0.7;

      // Generate competitor list using the LLM
      const response = await generateContentSpecificModel({
        model,
        messages,
        temperature,
      });

      console.log("Generated Response from LLM:", response);
      const parsedResponse = JSON.parse(response);

      // Fetch logos for each competitor and prepare the competitors array
      const competitorsWithLogos = [];
      for (const competitor of parsedResponse) {
        const logo = await fetchLogo(competitor.domain); // Fetch logo using domain
        competitorsWithLogos.push({
          id: uuidv4(), // Generate a unique UUID for the competitor
          name: competitor.name,
          domain: competitor.domain,
          logo,
        });
      }

      // Save competitors to Supabase
      const { error: updateError } = await supabase
        .from("userstorage")
        .update({ competitors: competitorsWithLogos })
        .eq("id", signUpData.user.id); // Match the `id` in `userstorage` with the authenticated user's `id`

      if (updateError) {
        console.error(
          "Error updating competitors in Supabase:",
          updateError.message
        );
      }

      competitors.value = competitorsWithLogos;
    }
  } catch (error) {
    console.error("Error fetching or querying competitors:", error.message);
  } finally {
    $q.loading.hide();
  }
};

// Function to add a new competitor
const addCompetitor = async () => {
  if (!newCompetitorUrl.value) {
    alert("Please enter a valid company URL.");
    return;
  }

  try {
    const domain = new URL(newCompetitorUrl.value).hostname; // Extract domain from URL
    const logo = await fetchLogo(domain);

    // Add the new competitor to the list
    const newCompetitor = {
      id: `new-${Date.now()}`,
      name: domain, // Placeholder name; can be updated with another prompt
      logo,
    };
    competitors.value.push(newCompetitor);

    // Update the JSONB column in Supabase
    const { data: user, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error(
        "Error fetching user for updating competitors:",
        userError?.message
      );
      return;
    }

    const { error: updateError } = await supabase
      .from("userstorage")
      .update({ competitors: competitors.value })
      .eq("id", user.id);

    if (updateError) {
      console.error(
        "Error updating competitors in Supabase:",
        updateError.message
      );
    }

    closeAddModal();
  } catch (error) {
    console.error("Error adding competitor:", error.message);
  }
};

// Open and close modal functions
const openAddModal = () => {
  isModalOpen.value = true;
};

const closeAddModal = () => {
  isModalOpen.value = false;
  newCompetitorUrl.value = ""; // Reset input
};

onMounted(async () => {
  fetchOrQueryCompetitors();
  await fetchCompanyName();
  $q.loading.show();
  console.log(supabase.auth.getUser());
});
</script>
