import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '@/store/taskStore'

type RecordedRequest = { url: string; method: string; body?: string }

/**
 * Outside development mode the store persists through the REST API, which is
 * the mode these tests exercise (`import.meta.env.MODE` is `test` under Vitest).
 *
 * `failing` rejects a single HTTP method while the rest of the backend keeps
 * working, so "the store ignored a failed request" can be told apart from "the
 * store never sent one".
 */
const stubFetch = (recorded: RecordedRequest[], { ok = true, failing = '' } = {}) => {
  let nextId = 100

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, options?: RequestInit) => {
      const method = options?.method ?? 'GET'
      recorded.push({ url: String(url), method, body: options?.body as string | undefined })

      if (!ok || method === failing) return { ok: false, json: async () => ({}) }

      if (method === 'POST') {
        const body = JSON.parse((options?.body as string) ?? '{}')
        // The backend hands ids back as strings.
        return { ok: true, json: async () => ({ ...body, id: String(nextId++) }) }
      }

      return { ok: true, json: async () => ({}) }
    }),
  )
}

describe('taskStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('persists imported tasks instead of only holding them in memory', async () => {
    const requests: RecordedRequest[] = []
    stubFetch(requests)

    const store = useTaskStore()
    store.tasks = [{ id: 1, text: 'Old task', completed: false, priority: 'low' }]

    await store.importTasks([
      { id: 7, text: 'Imported A', completed: false, priority: 'high' },
      { id: 8, text: 'Imported B', completed: true, priority: 'medium' },
    ])

    expect(requests.filter((request) => request.method === 'DELETE')).toHaveLength(1)
    expect(requests.filter((request) => request.method === 'POST')).toHaveLength(2)
    expect(store.tasks.map((task) => task.text)).toEqual(['Imported A', 'Imported B'])
    expect(store.tasks.map((task) => task.priority)).toEqual(['high', 'medium'])
    expect(store.tasks.every((task) => typeof task.id === 'number')).toBe(true)
  })

  it('does not keep imported tasks in state when the backend rejects them', async () => {
    const requests: RecordedRequest[] = []
    stubFetch(requests, { ok: false })

    const store = useTaskStore()
    await store.importTasks([{ id: 7, text: 'Imported A', completed: false, priority: 'high' }])

    expect(store.tasks).toEqual([])
  })

  it('normalizes ids returned by the API to numbers', async () => {
    const requests: RecordedRequest[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        requests.push({ url: String(url), method: 'GET' })

        return {
          ok: true,
          json: async () => [{ id: '2', text: 'Server task', completed: false, priority: 'high' }],
        }
      }),
    )

    const store = useTaskStore()
    await store.fetchTasks()

    expect(store.tasks[0].id).toBe(2)
    expect(store.tasks[0].priority).toBe('high')
  })

  it('falls back to a valid priority when the source data has none', async () => {
    const requests: RecordedRequest[] = []
    stubFetch(requests)

    const store = useTaskStore()
    await store.importTasks([{ id: 7, text: 'Imported A' }])

    expect(store.tasks[0].priority).toBe('low')
    expect(store.tasks[0].completed).toBe(false)
  })

  // The three tests below all guard the same rule: state is only updated once
  // the backend has confirmed the change. Updating it first looks fine on
  // screen and quietly reverts on the next reload, which is the hardest kind of
  // bug to notice by hand.
  it('leaves the list untouched when the backend rejects a new task', async () => {
    const requests: RecordedRequest[] = []
    stubFetch(requests, { failing: 'POST' })

    const store = useTaskStore()
    store.tasks = [{ id: 1, text: 'Existing task', completed: false, priority: 'low' }]

    await store.addTask({ text: 'Rejected task', completed: false, priority: 'high' })

    expect(requests.filter((request) => request.method === 'POST')).toHaveLength(1)
    expect(store.tasks.map((task) => task.text)).toEqual(['Existing task'])
  })

  it('keeps a task the backend refused to delete', async () => {
    const requests: RecordedRequest[] = []
    stubFetch(requests, { failing: 'DELETE' })

    const store = useTaskStore()
    store.tasks = [{ id: 1, text: 'Stubborn task', completed: false, priority: 'low' }]

    await store.removeTask(1)

    expect(requests.filter((request) => request.method === 'DELETE')).toHaveLength(1)
    expect(store.tasks.map((task) => task.text)).toEqual(['Stubborn task'])
  })

  it('does not mark a task completed when the update request fails', async () => {
    const requests: RecordedRequest[] = []
    stubFetch(requests, { failing: 'PUT' })

    const store = useTaskStore()
    store.tasks = [{ id: 1, text: 'Task to toggle', completed: false, priority: 'low' }]

    await store.toggleTask(1)

    expect(requests.filter((request) => request.method === 'PUT')).toHaveLength(1)
    expect(store.tasks[0].completed).toBe(false)
  })

  /**
   * The backend hands ids back as strings, and every lookup in the store
   * compares them strictly. A task added during a session therefore has to be
   * usable straight away, without a reload to re-read and re-normalize it.
   */
  it('removes a freshly added task even though the backend returned a string id', async () => {
    const requests: RecordedRequest[] = []
    stubFetch(requests)

    const store = useTaskStore()
    await store.addTask({ text: 'Fresh task', completed: false, priority: 'medium' })

    const created = store.tasks[0]
    expect(created.id).toBe(100)

    await store.removeTask(created.id)

    expect(
      requests.some((request) => request.method === 'DELETE' && request.url.endsWith('/tasks/100')),
    ).toBe(true)
    expect(store.tasks).toEqual([])
  })
})
