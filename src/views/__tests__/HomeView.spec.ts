import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomeView from '@/views/HomeView.vue'
import { createTestI18n } from '@/__tests__/testI18n'
import appI18n from '@/lang/i18n'

const messages = {
  en: appI18n.global.getLocaleMessage('en'),
  ru: appI18n.global.getLocaleMessage('ru'),
}

const mountHome = async (locale: 'en' | 'ru') => {
  const pinia = createPinia()
  setActivePinia(pinia)

  const wrapper = mount(HomeView, {
    global: { plugins: [pinia, createTestI18n(locale)] },
  })
  await flushPromises()

  return wrapper
}

describe('HomeView.vue', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => [] })),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  /**
   * The heading used to be written straight into the template, so switching the
   * interface to Russian translated everything on the page except its title.
   * Every string the page shows has to come from the catalogue.
   */
  it('translates its heading, the search box and the filters', async () => {
    const english = await mountHome('en')
    expect(english.get('h1').text()).toBe(messages.en.todo_list)

    const russian = await mountHome('ru')
    expect(russian.get('h1').text()).toBe(messages.ru.todo_list)
    expect(russian.get('input[type="text"]').attributes('placeholder')).toBe(
      messages.ru.search_placeholder,
    )
    expect(russian.text()).toContain(messages.ru.components.task_filter.completed)
    expect(russian.text()).toContain(messages.ru.export)
  })
})
