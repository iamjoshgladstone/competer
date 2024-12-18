<template>
  <q-page style="background-color: #f3f3f3">
    <div class="q-pa-md">
      <h4>Select Competitors</h4>

      <!-- Competitors Grid -->
      <div class="fit row wrap justify-start items-start content-start">
        <!-- Competitor Cards -->
        <q-card
          v-for="competitor in competitors"
          :key="competitor.id"
          class="q-pa-sm q-ma-sm"
          :class="{
            'selected-card': selectedCompetitors.includes(competitor.name),
          }"
          style="cursor: pointer; height: 150px; width: 150px"
          @click="toggleCompetitorSelection(competitor)"
        >
          <div class="flex flex-center">
            <q-img
              :src="competitor.logo"
              style="max-width: 75px; object-fit: contain"
              ratio="1"
              class="q-mb-sm q-pa-sm"
            />
          </div>
          <div class="text-center">{{ competitor.name }}</div>
        </q-card>

        <!-- Add New Competitor -->
        <q-card
          class="q-pa-sm q-ma-sm flex column"
          style="
            cursor: pointer;
            height: 150px;
            width: 150px;
            border: dashed 2px #ccc;
          "
          @click="openAddModal"
        >
          <q-icon name="add" size="50px" color="primary" />
          <div class="text-center">Add New Competitor</div>
        </q-card>
      </div>

      <!-- Store Competitors Button -->
      <q-btn
        label="Store Competitors"
        color="primary"
        class="q-mt-md"
        @click="storeCompetitors"
      />

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
import { supabase } from "app/utils/supabase";
import { v4 as uuidv4 } from "uuid";
import { useQuasar } from "quasar";
import { useChatCompletion } from "src/use/useChatCompletion";

const competitors = ref([]); // Competitor list
const selectedCompetitors = ref([]); // Selected competitors
const companyUuid = ref(""); // User's company UUID
const companyName = ref(""); // User's company name
const isModalOpen = ref(false);
const newCompetitorUrl = ref("");

const $q = useQuasar();
const { generateContent } = useChatCompletion();

// Step 1: Fetch the company_uuid from userstorage
const fetchCompanyUuid = async () => {
  const { data: user, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.user?.id) throw new Error("User not authenticated.");

  const { data: userData, error: userStorageError } = await supabase
    .from("userstorage")
    .select("company_uuid")
    .eq("user_id", user.user.id)
    .single();

  if (userStorageError || !userData?.company_uuid)
    throw new Error("Failed to fetch company_uuid.");

  companyUuid.value = userData.company_uuid;
};

// Step 2: Check for existing competitors in competitor_link
const fetchOrGenerateCompetitors = async () => {
  $q.loading.show();

  try {
    await fetchCompanyUuid();

    // Check the competitor_link table
    const { data: competitorLinks } = await supabase
      .from("competitor_link")
      .select("competitor_uuid")
      .eq("company_uuid", companyUuid.value);

    if (competitorLinks?.length > 0) {
      // Fetch competitors from companies table
      const competitorUuids = competitorLinks.map(
        (link) => link.competitor_uuid
      );
      const { data: competitorsData } = await supabase
        .from("companies")
        .select("company_uuid, company_name, company_url")
        .in("company_uuid", competitorUuids);

      competitors.value = competitorsData.map((c) => ({
        id: c.company_uuid,
        name: c.company_name,
        url: c.company_url,
        logo: `https://logo.clearbit.com/${new URL(c.company_url).hostname}`,
      }));
    } else {
      // Fetch company_name from companies table
      const { data: companyData } = await supabase
        .from("companies")
        .select("company_name")
        .eq("company_uuid", companyUuid.value)
        .single();

      companyName.value = companyData.company_name;

      // Query LLM for competitors
      const prompt = `Generate a JSON list of 5 competitors for ${companyName.value} with fields: name, domain. Just the JSON, nothing else.`;
      const response = await generateContent(prompt);
      const competitorList = JSON.parse(response);

      competitors.value = competitorList.map((c) => ({
        id: uuidv4(),
        name: c.name,
        url: `https://${c.domain}`,
        logo: `https://logo.clearbit.com/${c.domain}`,
      }));
    }
  } catch (error) {
    console.error("Error fetching competitors:", error.message);
  } finally {
    $q.loading.hide();
  }
};

// Step 3: Toggle competitor selection
const toggleCompetitorSelection = (competitor) => {
  const index = selectedCompetitors.value.findIndex(
    (item) => item.company_uuid === competitor.id
  );

  if (index === -1) {
    // Add the competitor to the selected list
    selectedCompetitors.value.push({
      company_uuid: competitor.id || uuidv4(),
      company_name: competitor.name,
      company_url: competitor.url,
    });
  } else {
    // Remove competitor from the selected list
    selectedCompetitors.value.splice(index, 1);
  }
  console.log(selectedCompetitors.value);
};

// Step 4: Add a new competitor manually
const addCompetitor = () => {
  try {
    const domain = new URL(newCompetitorUrl.value).hostname;
    const newCompetitor = {
      id: uuidv4(),
      name: domain,
      url: `https://${domain}`,
      logo: `https://logo.clearbit.com/${domain}`,
    };

    competitors.value.push(newCompetitor);
    closeAddModal();
  } catch (error) {
    console.error("Invalid URL:", error.message);
    $q.notify({ color: "negative", message: "Please enter a valid URL." });
  }
};

// Step 5: Store competitors in companies and competitor_link tables
const storeCompetitors = async () => {
  $q.loading.show();
  try {
    for (const competitor of selectedCompetitors.value) {
      const competitorUuid = competitor.company_uuid || uuidv4();

      const payload = {
        company_uuid: competitorUuid,
        company_name: competitor.company_name,
        company_url: competitor.company_url,
      };

      // Insert competitor into companies table
      const { error: upsertError } = await supabase
        .from("companies")
        .upsert([payload], { onConflict: ["company_uuid"] });

      if (upsertError) throw upsertError;

      // Insert into competitor_link table
      const { error: linkError } = await supabase
        .from("competitor_link")
        .insert([
          {
            company_uuid: companyUuid.value,
            competitor_uuid: competitorUuid,
          },
        ]);

      if (linkError) throw linkError;
    }

    $q.notify({
      color: "positive",
      message: "Competitors stored successfully!",
    });
  } catch (error) {
    console.error("Error storing competitors:", error.message);
    $q.notify({ color: "negative", message: "Failed to store competitors." });
  } finally {
    $q.loading.hide();
  }
};

// Modal management
const openAddModal = () => (isModalOpen.value = true);
const closeAddModal = () => {
  isModalOpen.value = false;
  newCompetitorUrl.value = "";
};

// On mounted
onMounted(fetchOrGenerateCompetitors);
</script>

<style scoped>
.selected-card {
  border: 3px solid #1976d2; /* Blue border for selected cards */
  border-radius: 8px; /* Optional rounded corners */
}
</style>
