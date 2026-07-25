<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const theme = ref<'light' | 'dark'>(
  localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? 'dark'
    : 'light',
)

const language = ref<'ru' | 'en'>((localStorage.getItem('language') as 'ru' | 'en') || 'en')

const applyTheme = () => {
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
  localStorage.setItem('theme', theme.value)
}

const changeLanguage = () => {
  localStorage.setItem('language', language.value)
  locale.value = language.value
  document.documentElement.lang = language.value
}

watch(theme, applyTheme)
watch(language, changeLanguage)
</script>

<template>
  <div
    class="max-w-lg mx-auto p-6 shadow-lg rounded-lg flex flex-col gap-4 bg-white text-[#000] dark:bg-[#1e1e1e] dark:text-white"
  >
    <h1 class="text-2xl font-bold text-center">{{ t('settings') }}</h1>

    <label class="flex gap-2 items-center justify-between">
      <span>{{ t('theme') }}</span>
      <select v-model="theme" class="p-2 border rounded-md dark:bg-[#1e1e1e]">
        <option value="dark">{{ t('dark') }}</option>
        <option value="light">{{ t('light') }}</option>
      </select>
    </label>

    <label class="flex gap-2 items-center justify-between">
      <span>{{ t('language') }}</span>
      <select v-model="language" class="p-2 border rounded-md dark:bg-[#1e1e1e]">
        <option value="ru">{{ t('russian') }}</option>
        <option value="en">{{ t('english') }}</option>
      </select>
    </label>
  </div>
</template>
