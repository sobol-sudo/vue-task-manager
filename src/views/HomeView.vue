<script setup lang="ts">
import { ref } from 'vue'
import TaskInput from '@/components/TaskInput.vue'
import TaskFilters from '@/components/TaskFilters.vue'
import { useI18n } from 'vue-i18n'
import TaskList from '@/components/TaskList.vue'
import TaskImportExport from '@/components/TaskImportExport.vue'

const { t } = useI18n()

const filter = ref<'all' | 'active' | 'completed'>('all')
const searchQuery = ref('')
</script>

<template>
  <div
    class="container max-w-lg mx-auto p-6 shadow-lg rounded-lg flex flex-col gap-[10px] bg-white text-black dark:bg-[#1e1e1e] dark:text-white"
  >
    <h1 class="text-2xl font-bold text-center">{{ t('todo_list') }}</h1>

    <TaskImportExport />

    <TaskInput />

    <input
      v-model="searchQuery"
      type="text"
      :placeholder="t('search_placeholder')"
      class="p-2 bg-white text-black dark:bg-[#2a2a2a] dark:text-white border border-gray-600 rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition"
    />

    <TaskFilters v-model="filter" />

    <TaskList :filter="filter" :search-query="searchQuery" />
  </div>
</template>
