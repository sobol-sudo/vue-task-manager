import { createI18n } from 'vue-i18n'
import appI18n from '@/lang/i18n'

/**
 * A vue-i18n plugin for component tests, built around the catalogue the app
 * actually ships. Assertions then compare rendered text with the real strings
 * instead of a test-local copy that silently drifts out of sync.
 *
 * It is a separate instance rather than the app's own: switching the locale on
 * the shared singleton would leak into every other test in the run.
 */
export const createTestI18n = (locale: 'en' | 'ru' = 'en') =>
  createI18n({
    legacy: false,
    locale,
    fallbackLocale: 'en',
    messages: {
      en: appI18n.global.getLocaleMessage('en'),
      ru: appI18n.global.getLocaleMessage('ru'),
    },
  })
