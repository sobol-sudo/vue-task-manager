<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const filter = defineModel<'all' | 'active' | 'completed'>()
</script>

<template>
  <!--
    `aria-pressed` carries the same information as the `.active` highlight, which
    is otherwise the only thing saying which filter is on.
  -->
  <div class="filter-buttons flex justify-between mb-4">
    <button
      type="button"
      @click="filter = 'all'"
      :aria-pressed="filter === 'all'"
      :class="{ active: filter === 'all' }"
      class="cursor-pointer px-4 py-2 rounded-md border border-gray-400 dark:border-gray-600 bg-gray-200 text-black dark:bg-gray-700 dark:text-white transition outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {{ t('components.task_filter.all') }}
    </button>
    <button
      type="button"
      @click="filter = 'active'"
      :aria-pressed="filter === 'active'"
      :class="{ active: filter === 'active' }"
      class="cursor-pointer px-4 py-2 rounded-md border border-gray-400 dark:border-gray-600 bg-gray-200 text-black dark:bg-gray-700 dark:text-white transition outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {{ t('components.task_filter.active') }}
    </button>
    <button
      type="button"
      @click="filter = 'completed'"
      :aria-pressed="filter === 'completed'"
      :class="{ active: filter === 'completed' }"
      class="cursor-pointer px-4 py-2 rounded-md border border-gray-400 dark:border-gray-600 bg-gray-200 text-black dark:bg-gray-700 dark:text-white transition outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {{ t('components.task_filter.completed') }}
    </button>
  </div>
</template>

<style scoped>
.filter-buttons button.active {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.filter-buttons button:hover {
  background-color: #65a0e0;
  color: white;
}

.dark .filter-buttons button.active {
  background-color: #2563eb;
  color: white;
  border-color: #2563eb;
}

.dark .filter-buttons button:hover {
  background-color: #1d4ed8;
}
</style>
