<template>
  <q-page style="background-color: #f3f3f3">
    <div class="q-pa-lg q-ml-xl">
      <!-- Header -->
      <h4>
        You're setting up the {{ companyName }} account - let's start by picking
        your competitors.
      </h4>

      <!-- Competitors Grid -->
      <div class="fit row wrap justify-start items-start content-start q-mt-md">
        <!-- Competitor Cards -->
        <q-card
          v-for="competitor in competitors"
          :key="competitor.id"
          class="flex flex-center column q-ma-sm"
          :class="{
            'selected-card': selectedCompetitors.some(
              (selected) => selected.company_uuid === competitor.id
            ),
          }"
          style="cursor: pointer; height: 150px; width: 150px"
          @click="toggleCompetitorSelection(competitor)"
        >
          <div class="flex flex-center" style="min-width: 75px">
            <q-img
              :src="competitor.logo"
              style="object-fit: contain !important"
              ratio="1"
              class="q-mb-sm q-pa-sm"
            />
          </div>
          <div class="text-center">{{ competitor.name }}</div>
        </q-card>
      </div>

      <!-- Add New Competitor -->
      <div class="q-mt-lg">
        <q-btn
          color="primary"
          label="Add New Competitor"
          @click="openAddModal"
        />
      </div>

      <!-- Store Competitors Button -->
      <div class="q-mt-md">
        <q-btn
          label="Store Competitors"
          color="primary"
          @click="storeCompetitors"
          :disable="selectedCompetitors.length === 0"
        />
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
import { supabase } from "app/utils/supabase";
import { v4 as uuidv4 } from "uuid";
import { useQuasar } from "quasar";
import { useChatCompletion } from "src/use/useChatCompletion";
import { useRouter } from "vue-router";

const router = useRouter();
const competitors = ref([]); // Competitor list
const selectedCompetitors = ref([]); // Selected competitors
const companyName = ref(""); // User's company name
const companyUuid = ref(""); // User's company UUID
const isModalOpen = ref(false);
const newCompetitorUrl = ref("");

const $q = useQuasar();
const { generateContent } = useChatCompletion();

// Step 1: Fetch company details
const fetchCompanyDetails = async () => {
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("userstorage")
    .select("company_name, company_uuid")
    .eq("user_id", user?.user?.id)
    .single();

  if (error) throw new Error("Failed to fetch company details.");

  companyName.value = data.company_name;
  companyUuid.value = data.company_uuid;
};

// Step 2: Generate competitors using LLM
const generateCompetitors = async () => {
  const prompt = `Generate a JSON list of 10 competitors for ${companyName.value} with fields: name, domain. Just the JSON, nothing else.`;
  const response = await generateContent(prompt);
  const competitorList = JSON.parse(response);

  competitors.value = competitorList.map((c) => ({
    id: uuidv4(),
    name: c.name,
    url: `https://${c.domain}`,
    logo: `https://logo.clearbit.com/${c.domain}`,
  }));
};

// Step 3: Add a competitor manually
const addCompetitor = async () => {
  try {
    const domain = new URL(newCompetitorUrl.value.trim()).hostname;

    // Fetch the name of the company via API
    const response = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${domain}`
    );
    const companyData = await response.json();

    if (!companyData || !companyData[0]) {
      throw new Error("Company name could not be fetched.");
    }

    const newCompetitor = {
      id: uuidv4(),
      name: companyData[0].name,
      url: `https://${domain}`,
      logo: `https://logo.clearbit.com/${domain}`,
    };

    competitors.value.push(newCompetitor);
    closeAddModal();
    $q.notify({ color: "positive", message: "Competitor added successfully!" });
  } catch (error) {
    console.error("Error adding competitor:", error.message);
    $q.notify({
      color: "negative",
      message: "Failed to add competitor. Ensure the URL is valid.",
    });
  }
};

// Step 4: Toggle competitor selection
const toggleCompetitorSelection = (competitor) => {
  const index = selectedCompetitors.value.findIndex(
    (item) => item.company_uuid === competitor.id
  );

  if (index === -1) {
    selectedCompetitors.value.push({
      company_uuid: competitor.id,
      company_name: competitor.name,
      company_url: competitor.url,
    });
  } else {
    selectedCompetitors.value.splice(index, 1);
  }
};

// Step 5: Store selected competitors
const storeCompetitors = async () => {
  try {
    for (const competitor of selectedCompetitors.value) {
      await supabase.from("companies").upsert([
        {
          company_uuid: competitor.company_uuid,
          company_name: competitor.company_name,
          company_url: competitor.company_url,
        },
      ]);

      await supabase.from("competitor_link").insert([
        {
          company_uuid: companyUuid.value,
          competitor_uuid: competitor.company_uuid,
        },
      ]);
    }

    $q.notify({
      color: "positive",
      message: "Competitors stored successfully!",
    });
    router.push("/generate");
  } catch (error) {
    console.error("Error storing competitors:", error.message);
    $q.notify({
      color: "negative",
      message: "Failed to store competitors.",
    });
  }
};

// Modal management
const openAddModal = () => (isModalOpen.value = true);
const closeAddModal = () => {
  isModalOpen.value = false;
  newCompetitorUrl.value = "";
};

// On mounted: fetch details and generate competitors
onMounted(async () => {
  await fetchCompanyDetails();
  await generateCompetitors();
});
</script>

<style scoped>
.selected-card {
  border: 3px solid #1976d2;
  border-radius: 8px;
}
</style>
