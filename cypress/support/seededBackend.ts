/// <reference types="cypress" />

export interface SeedTask {
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
}

/**
 * Open the app with an exactly known list in place of its real persistence
 * layer, so a spec can assert on counts and contents without depending on — or
 * writing to — the backend the live demo shares with everyone.
 *
 * Against a production build that means stubbing the REST calls, so no request
 * leaves the browser; against the dev server (`npm run test:e2e:dev`) the app
 * reads localStorage, which Cypress clears between tests. Either way the tests
 * are repeatable and leave nothing behind.
 */
export const openWith = (
  tasks: SeedTask[],
  { path = '/', failOnStatusCode = true }: { path?: string; failOnStatusCode?: boolean } = {},
) => {
  if (Cypress.env('persistence') === 'local') {
    return cy.visit(path, {
      failOnStatusCode,
      onBeforeLoad: (win) => win.localStorage.setItem('tasks', JSON.stringify(tasks)),
    })
  }

  // A minimal stand-in for the REST backend, so that changes made in the UI
  // survive a reload exactly as they would in production. Ids are handed out as
  // strings, the way the real backend does.
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

  return cy.visit(path, { failOnStatusCode })
}

export const seededTasks = (count: number, completedEvery = 0): SeedTask[] =>
  Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    // Two digits, so that no task name is a substring of another one.
    text: `Task ${String(index + 1).padStart(2, '0')}`,
    completed: completedEvery > 0 && (index + 1) % completedEvery === 0,
    priority: 'low',
  }))
