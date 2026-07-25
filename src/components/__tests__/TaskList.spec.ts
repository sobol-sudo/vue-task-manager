import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TaskList from '@/components/TaskList.vue'
import { createTestI18n } from '@/__tests__/testI18n'
import appI18n from '@/lang/i18n'
import type { Task } from '@/types'

const messages = appI18n.global.getLocaleMessage('en')

/**
 * These tests drive the real store rather than a testing Pinia: the list is
 * filled by `fetchTasks` on mount, exactly as it is in the browser, so the
 * component and the store are checked together.
 */
const mountList = async (
  tasks: Partial<Task>[],
  props: { filter: 'all' | 'active' | 'completed'; searchQuery: string } = {
    filter: 'all',
    searchQuery: '',
  },
) => {
  const pinia = createPinia()
  setActivePinia(pinia)

  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => tasks })),
  )

  const wrapper = mount(TaskList, {
    props,
    global: { plugins: [pinia, createTestI18n('en')] },
  })
  await flushPromises()

  return wrapper
}

// `TaskList` appends a page when the window is scrolled near the bottom. jsdom
// reports a zero-height body, so the component's own threshold is already met
// and dispatching the event is enough to request the next page.
const scrollToBottom = async (wrapper: { vm: { $nextTick: () => Promise<unknown> } }) => {
  window.dispatchEvent(new Event('scroll'))
  await wrapper.vm.$nextTick()
}

const numberedTasks = (count: number): Partial<Task>[] =>
  Array.from({ length: count }, (_, index) => ({
    // Two digits so that no task name is a substring of another one.
    id: index + 1,
    text: `Task ${String(index + 1).padStart(2, '0')}`,
    completed: false,
    priority: 'low' as const,
  }))

describe('TaskList.vue', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  /**
   * The list is paginated, so a task is not necessarily on screen just because
   * it is in the store — the reason the e2e suite could not find a task it had
   * just created once the backend held more than a page of them. Anything that
   * changes the page size, drops the scroll handler or reorders the list has to
   * be a deliberate change, not a silent one.
   */
  it('renders one page of tasks and appends the next one on scroll', async () => {
    const wrapper = await mountList(numberedTasks(40))

    expect(wrapper.findAll('li')).toHaveLength(15)
    expect(wrapper.text()).toContain('Task 01')
    expect(wrapper.text()).toContain('Task 15')
    expect(wrapper.text()).not.toContain('Task 16')
    expect(wrapper.text()).not.toContain('Task 40')

    await scrollToBottom(wrapper)
    expect(wrapper.findAll('li')).toHaveLength(30)
    expect(wrapper.text()).toContain('Task 16')
    expect(wrapper.text()).not.toContain('Task 40')

    await scrollToBottom(wrapper)
    expect(wrapper.findAll('li')).toHaveLength(40)
    expect(wrapper.text()).toContain('Task 40')

    // Reaching the end is not an error, and it does not keep growing.
    await scrollToBottom(wrapper)
    expect(wrapper.findAll('li')).toHaveLength(40)
  })

  it('narrows the list by the active filter and the search query', async () => {
    const tasks: Partial<Task>[] = [
      { id: 1, text: 'Write the release notes', completed: false, priority: 'medium' },
      { id: 2, text: 'Ship the release', completed: true, priority: 'high' },
      { id: 3, text: 'Buy milk', completed: false, priority: 'low' },
    ]

    const wrapper = await mountList(tasks)
    expect(wrapper.findAll('li')).toHaveLength(3)

    await wrapper.setProps({ filter: 'active' })
    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.text()).not.toContain('Ship the release')

    await wrapper.setProps({ filter: 'completed' })
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.text()).toContain('Ship the release')

    // Search is case-insensitive and matches anywhere in the task text.
    await wrapper.setProps({ filter: 'all', searchQuery: 'RELEASE' })
    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.text()).not.toContain('Buy milk')

    await wrapper.setProps({ searchQuery: 'nothing matches this' })
    expect(wrapper.findAll('li')).toHaveLength(0)
    expect(wrapper.text()).toContain(messages.no_tasks)
  })

  /**
   * An empty list means three different things, and for a while the component
   * said the same thing for all of them. The worst case was the first load: the
   * store is empty while the request is in flight, so every visitor was told
   * their search had found nothing before they had typed anything.
   *
   * The fetch is resolved by hand here rather than after a timer, so the
   * in-flight moment is a fixed point in the test instead of a race with it.
   */
  it('tells the three empty states apart', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    let deliverTasks: (tasks: Partial<Task>[]) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            deliverTasks = (tasks) => resolve({ ok: true, json: async () => tasks })
          }),
      ),
    )

    const wrapper = mount(TaskList, {
      props: { filter: 'all', searchQuery: '' },
      global: { plugins: [pinia, createTestI18n('en')] },
    })

    // Still loading: nothing is known yet, so nothing may be claimed.
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain(messages.loading_tasks)
    expect(wrapper.text()).not.toContain(messages.no_tasks)
    expect(wrapper.text()).not.toContain(messages.no_tasks_yet)

    // Loaded, and there is genuinely nothing stored.
    deliverTasks([])
    await flushPromises()
    expect(wrapper.text()).toContain(messages.no_tasks_yet)
    expect(wrapper.text()).not.toContain(messages.no_tasks)
    expect(wrapper.text()).not.toContain(messages.loading_tasks)

    // Loaded, tasks exist, and the search matched none of them.
    const withTasks = await mountList([
      { id: 1, text: 'Buy milk', completed: false, priority: 'low' },
    ])
    await withTasks.setProps({ searchQuery: 'nothing matches this' })
    expect(withTasks.text()).toContain(messages.no_tasks)
    expect(withTasks.text()).not.toContain(messages.no_tasks_yet)
  })
})
