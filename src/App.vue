<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { onMounted, ref } from 'vue'

const { t } = useI18n()

const theme = ref<'light' | 'dark'>(
  localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ? 'dark'
    : 'light',
)
const applyTheme = () => {
  document.documentElement.classList.toggle('dark', theme.value === 'dark')
  localStorage.setItem('theme', theme.value)
}
onMounted(() => {
  applyTheme()
})
</script>

<template>
  <nav class="flex justify-center gap-4 p-4 bg-[#eee] dark:bg-[#252525]">
    <RouterLink to="/" class="nav-link text-[#000] hover:underline dark:text-white">
      {{ t('home') }}
    </RouterLink>
    <RouterLink to="/settings" class="nav-link text-[#000] hover:underline dark:text-white">
      {{ t('settings') }}
    </RouterLink>
    <RouterLink to="/about" class="nav-link text-[#000] hover:underline dark:text-white">
      {{ t('about') }}
    </RouterLink>
  </nav>

  <RouterView />
</template>

<style scoped>
.nav-link {
  padding: 0.25rem 0.6rem;
  border-radius: 0.375rem;
  transition:
    background-color 0.2s,
    color 0.2s;
}

/*
  The router already marks the current link and sets `aria-current="page"` on
  it; nothing styled that class, so all three links looked identical on every
  route and the navigation never said where you were.
*/
.nav-link.router-link-exact-active {
  background-color: #007bff;
  color: #fff;
  text-decoration: none;
}

.dark .nav-link.router-link-exact-active {
  background-color: #2563eb;
  color: #fff;
}

.nav-link:focus-visible {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}
</style>
