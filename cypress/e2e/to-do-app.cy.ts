describe('To-Do App', () => {
  // The production build these tests run against persists through a shared REST
  // backend, so every run works with its own task names and removes what it
  // created. Repeated runs stay independent and leave no test data behind.
  const uniqueTask = (name: string) => `${name} ${Date.now()}`

  const addTask = (text: string) => {
    cy.get('[data-testid="task-input"]').type(text)
    cy.get(`[data-testid="add-task__btn"]`).should('exist').should('be.visible').click()
  }

  // The list renders 15 tasks at a time and new tasks are appended at the end,
  // so scroll to pull in the next batch when the backend already holds more
  // than a page of tasks. A short list does not scroll, which is fine.
  const seeTask = (text: string) => {
    cy.get('li').should('exist')
    cy.scrollTo('bottom', { ensureScrollable: false })
    cy.contains(text).should('exist')
  }

  const removeTask = (text: string) => {
    cy.contains(text)
      .should('exist')
      .closest('li')
      .find('.delete-btn')
      .should('exist')
      .should('be.visible')
      .click()

    cy.contains(text).should('not.exist')
  }

  beforeEach(() => {
    cy.visit('/')
  })

  it('adds a new task', () => {
    const task = uniqueTask('Buy milk')

    addTask(task)
    seeTask(task)

    removeTask(task)
  })

  it('toggles the task status', () => {
    const task = uniqueTask('Do a workout')

    addTask(task)
    seeTask(task)

    cy.contains(task).click()
    cy.contains(task).should('have.class', 'line-through')

    removeTask(task)
  })

  it('removes a task', () => {
    const task = uniqueTask('Buy bread')

    addTask(task)
    seeTask(task)

    removeTask(task)
  })

  it('keeps tasks after a page reload', () => {
    const task = uniqueTask('Learn Cypress')

    addTask(task)
    cy.reload()
    seeTask(task)

    removeTask(task)
  })
})
