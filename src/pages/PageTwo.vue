<template>
  <q-page>
    <div class="q-pa-md">
      <q-list>
        <q-item bordered v-for="entry in entries" :key="entry.id">
          <q-item-section>
            <q-item-label :class="useAmountColourClass(entry.value)">{{
              entry.name
            }}</q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-item-label caption :class="useAmountColourClass(entry.value)">
              {{ currencyTest(entry.value) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-page>
</template>

<script setup>
defineOptions({
  name: "PageTwo",
});

import { ref, computed, watch } from "vue";
import { useAmountColourClass } from "src/use/useAmountColourClass";

const entries = ref([
  {
    id: "1",
    name: "Ice Cream",
    value: 4,
  },
  {
    id: "2",
    name: "Bananas",
    value: 7,
  },
  {
    id: "3",
    name: "Apples",
    value: 2,
  },
  {
    id: "4",
    name: "Oranges",
    value: -8,
  },
]);

// Adjust Currency

function currencyTest(amount) {
  // format: + $ 4,999.99 | - $ 999.00

  if (amount > 0) {
    amount = amount + ":)";
  } else if (amount < 0) {
    amount = amount + ":(";
  }

  return amount;
}

const totalSum = computed(() =>
  entries.value.reduce((sum, entry) => sum + entry.value, 0)
);

watch(totalSum, (newVal) => {
  emit("updateTotalSum", newVal);
});

const emit = defineEmits(["updateTotalSum"]);
</script>
