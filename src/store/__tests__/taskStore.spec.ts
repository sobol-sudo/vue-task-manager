import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTaskStore } from '@/store/taskStore'

type RecordedRequest = { url: string; method: string; body?: string }

/**
 * Outside development mode the store persists through the REST API, which is
 * the mode these tests exercise (`import.meta.env.MODE` is `test` under Vitest).
 */
const stubFetch = (recorded: RecordedRequest[], { ok = true } = {}) => {
  let nextId = 100

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, options?: RequestInit) => {
      const method = options?.method ?? 'GET'
      recorded.push({ url: String(url), method, body: options?.body as string | undefined })

      if (!ok) return { ok: false, json: async () => ({}) }

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
})
