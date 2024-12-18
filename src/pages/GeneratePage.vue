<template>
  <q-page style="background-color: #f3f3f3">
    <div class="q-pa-lg q-ml-xl">
      <!-- Header -->
      <h4>Select a Competitor to Generate Content</h4>

      <!-- Competitors Grid -->
      <div class="fit row wrap justify-start items-start content-start q-mt-md">
        <q-card
          v-for="competitor in competitors"
          :key="competitor.id"
          class="flex flex-center column q-ma-sm"
          style="cursor: pointer; height: 150px; width: 150px"
          @click="navigateToGeneratePage(competitor.id)"
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

        <!-- Add New Competitor Card -->
        <q-card
          class="flex flex-center column q-ma-sm"
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

      <!-- No Competitors Message -->
      <div v-if="competitors.length === 0" class="text-center q-mt-xl">
        <q-icon name="info" size="3em" color="grey" />
        <p>No competitors found. Add competitors to proceed.</p>
      </div>

      <!-- Add Competitor Modal -->
      <q-dialog v-model="isModalOpen">
        <q-card style="max-width: 400px; margin: auto">
          <q-card-section>
            <div class="text-h6">Add New Competitor</div>
          </q-card-section>
          <q-card-section>
            <q-input
              v-model="newCompetitorUrl"
              label="Company URL"
              filled
              placeholder="e.g., klue.com"
            />
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
import { useRouter } from "vue-router";
import { supabase } from "app/utils/supabase";
import { useQuasar } from "quasar";
import { v4 as uuidv4 } from "uuid";

const competitors = ref([]); // Competitor list
const companyUuid = ref(""); // User's company UUID
const isModalOpen = ref(false);
const newCompetitorUrl = ref(""); // Input for new competitor URL
const $q = useQuasar();
const router = useRouter();

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

// Step 2: Fetch competitors from the database
const fetchCompetitors = async () => {
  $q.loading.show();
  try {
    await fetchCompanyUuid();

    const { data: competitorLinks } = await supabase
      .from("competitor_link")
      .select("competitor_uuid")
      .eq("company_uuid", companyUuid.value);

    if (competitorLinks?.length) {
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
        logo: `https://logo.clearbit.com/${new URL(c.company_url).hostname}`,
      }));
    } else {
      competitors.value = [];
    }
  } catch (error) {
    console.error("Error fetching competitors:", error.message);
    $q.notify({ color: "negative", message: "Failed to fetch competitors." });
  } finally {
    $q.loading.hide();
  }
};

// Step 3: Add a new competitor manually
const addCompetitor = async () => {
  try {
    const domain = new URL(`https://${newCompetitorUrl.value.trim()}`).hostname;

    // Fetch company name using Clearbit API
    const response = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${domain}`
    );
    const companyData = await response.json();

    if (!companyData || !companyData[0]?.name) {
      throw new Error("Company name could not be fetched.");
    }

    const newCompetitor = {
      id: uuidv4(),
      name: companyData[0].name,
      url: `https://${domain}`,
      logo: `https://logo.clearbit.com/${domain}`,
    };

    // Insert into companies table
    await supabase.from("companies").upsert([
      {
        company_uuid: newCompetitor.id,
        company_name: newCompetitor.name,
        company_url: newCompetitor.url,
      },
    ]);

    // Insert into competitor_link table
    await supabase.from("competitor_link").insert([
      {
        company_uuid: companyUuid.value,
        competitor_uuid: newCompetitor.id,
      },
    ]);

    // Update local list
    competitors.value.push({
      id: newCompetitor.id,
      name: newCompetitor.name,
      logo: newCompetitor.logo,
    });

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

// Step 4: Navigate to the Generate Content Page
const navigateToGeneratePage = (competitorId) => {
  router.push(`/generate/${competitorId}`);
};

// Modal management
const openAddModal = () => (isModalOpen.value = true);
const closeAddModal = () => {
  isModalOpen.value = false;
  newCompetitorUrl.value = "";
};

// On mounted
onMounted(fetchCompetitors);
</script>

<style scoped>
/* Card hover effect */
.q-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transform: scale(1.03);
  transition: all 0.2s ease-in-out;
}
</style>
