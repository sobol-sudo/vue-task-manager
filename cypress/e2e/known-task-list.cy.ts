interface SeedTask {
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
}

/**
 * `to-do-app.cy.ts` drives the app against its real persistence layer and so
 * has to work with whatever the backend already holds. These tests need the
 * opposite: a list of an exactly known size and content, which is the only way
 * to check pagination, filtering and a destructive import without depending on
 * — or damaging — a backend anyone can write to.
 *
 * The persistence layer is therefore replaced for the duration of each test.
 * Against a production build that means stubbing the REST calls, so no request
 * leaves the browser; against the dev server (`npm run test:e2e:dev`) the app
 * reads localStorage, which Cypress clears between tests. Either way the tests
 * are repeatable and leave nothing behind.
 */
describe('The task list, on a known set of tasks', () => {
  const usesRestBackend = Cypress.env('persistence') !== 'local'

  const seededTasks = (count: number, completedEvery = 0): SeedTask[] =>
    Array.from({ length: count }, (_, index) => ({
      id: String(index + 1),
      // Two digits, so that no task name is a substring of another one.
      text: `Task ${String(index + 1).padStart(2, '0')}`,
      completed: completedEvery > 0 && (index + 1) % completedEvery === 0,
      priority: 'low',
    }))

  /** Load the app with exactly `tasks` in place of the real persistence layer. */
  const openWith = (tasks: SeedTask[]) => {
    if (!usesRestBackend) {
      return cy.visit('/', {
        onBeforeLoad: (win) => win.localStorage.setItem('tasks', JSON.stringify(tasks)),
      })
    }

    // A minimal stand-in for the REST backend, so that changes made in the UI
    // survive a reload exactly as they would in production. Ids are handed out
    // as strings, the way the real backend does.
    const stored = tasks.map((task) => ({ ...task }))
    let nextId = stored.length + 1

    cy.intercept('GET', '**/tasks', (request) => request.reply(stored))

    cy.intercept('POST', '**/tasks', (request) => {
      const created = { ...request.body, id: String(nextId++) }
      stored.push(created)
      request.reply(201, created)
    })

    cy.intercept('PUT', '**/tasks/*', (request) => {
      const id = request.url.split('/').pop()
      const index = stored.findIndex((task) => task.id === id)
      if (index === -1) return request.reply(404, {})

      stored[index] = { ...stored[index], ...request.body, id: stored[index].id }
      request.reply(stored[index])
    })

    cy.intercept('DELETE', '**/tasks/*', (request) => {
      const id = request.url.split('/').pop()
      const index = stored.findIndex((task) => task.id === id)
      if (index === -1) return request.reply(404, {})

      request.reply(stored.splice(index, 1)[0])
    })

    return cy.visit('/')
  }

  beforeEach(() => {
    // Small enough that a single page of tasks is already scrollable, so the
    // scroll below is a real one rather than a no-op on a short page.
    cy.viewport(500, 500)
  })

  /**
   * The list renders 15 tasks at a time. Anything that changes the page size,
   * drops the scroll handler or reorders the list leaves tasks unreachable —
   * they are in the store, and simply never drawn.
   */
  it('shows one page of tasks and reveals the rest on scroll', () => {
    openWith(seededTasks(40))

    cy.get('li').should('have.length', 15)
    cy.contains('Task 16').should('not.exist')

    cy.scrollTo('bottom')
    cy.get('li').should('have.length', 30)
    cy.contains('Task 16').should('be.visible')
    cy.contains('Task 40').should('not.exist')

    cy.scrollTo('bottom')
    cy.get('li').should('have.length', 40)
    cy.contains('Task 40').should('be.visible')
  })

  it('narrows the list by the active filter and the search box', () => {
    // Every third task is completed: 3, 6, 9 and 12 of twelve.
    openWith(seededTasks(12, 3))

    cy.get('li').should('have.length', 12)

    cy.get('.filter-buttons').contains('button', 'Active').click()
    cy.get('li').should('have.length', 8)
    cy.contains('Task 03').should('not.exist')

    cy.get('.filter-buttons').contains('button', 'Completed').click()
    cy.get('li').should('have.length', 4)
    cy.contains('Task 03').should('be.visible')

    cy.get('.filter-buttons').contains('button', 'All').click()
    // Search is case-insensitive and matches part of a task's text: "Task 1"
    // reaches 10, 11 and 12, and not 01.
    cy.get('input[type="text"]').type('TASK 1')
    cy.get('li').should('have.length', 3)
    cy.contains('Task 12').should('be.visible')
    cy.contains('Task 01').should('not.exist')

    cy.get('input[type="text"]').clear()
    cy.get('input[type="text"]').type('nothing matches this')
    cy.get('li').should('have.length', 0)
    cy.contains('No tasks found').should('be.visible')
  })

  /**
   * Import replaces the whole list and has to persist it: an import that only
   * updates the screen looks like it worked and is gone after a reload.
   */
  it('replaces the stored list with an imported file', () => {
    openWith(seededTasks(3))
    cy.get('li').should('have.length', 3)

    const imported = [
      { id: 101, text: 'Restored from a backup', completed: false, priority: 'high' },
      { id: 102, text: 'Also restored', completed: true, priority: 'low' },
    ]

    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from(JSON.stringify(imported)),
        fileName: 'tasks.json',
        mimeType: 'application/json',
      },
      { force: true },
    )

    cy.get('li').should('have.length', 2)
    cy.contains('Restored from a backup').should('be.visible')
    cy.contains('Task 01').should('not.exist')

    cy.reload()
    cy.get('li').should('have.length', 2)
    cy.contains('Restored from a backup').should('be.visible')
    cy.contains('Task 01').should('not.exist')
  })
})
