<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

const { t } = useI18n()
</script>

<template>
  <div
    class="max-w-lg mx-auto p-6 shadow-lg rounded-lg text-center flex flex-col gap-4 bg-white text-black dark:bg-[#1e1e1e] dark:text-white"
  >
    <h1 class="text-2xl font-bold">{{ t('not_found_title') }}</h1>
    <p>{{ t('not_found_description') }}</p>

    <RouterLink
      to="/"
      class="self-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
    >
      {{ t('not_found_back_home') }}
    </RouterLink>
  </div>
</template>
