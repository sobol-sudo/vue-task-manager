interface BackendTask {
  id: number | string
  text: string
}

describe('To-Do App', () => {
  // The production build these tests run against persists through a shared REST
  // backend, so every run works with its own task names and removes what it
  // created — from the backend directly, in an `afterEach`, so a failed
  // assertion cannot orphan records either. Runs stay independent of each other
  // and of whatever the backend already holds, and leave no test data behind.
  const apiUrl = String(Cypress.env('apiUrl') ?? '')

  // `npm run test:e2e:dev` drives the dev server, which persists to
  // localStorage instead; Cypress clears that between tests on its own, so only
  // a production build's REST backend has to be cleaned up here.
  const usesRestBackend =
    Cypress.env('persistence') !== 'local' && apiUrl !== '' && apiUrl !== 'local'

  const createdTasks: string[] = []

  const uniqueTask = (name: string) => {
    const text = `${name} ${Date.now()}`
    createdTasks.push(text)

    return text
  }

  const addTask = (text: string) => {
    cy.get('[data-testid="task-input"]').type(text)
    cy.get(`[data-testid="add-task__btn"]`).should('exist').should('be.visible').click()
  }

  const isRendered = ($tasks: JQuery<HTMLElement>, text: string) =>
    $tasks.toArray().some((task) => task.innerText.includes(text))

  /**
   * `TaskList` renders 15 tasks at a time and appends new ones at the end, so a
   * task created during a run sits one page further down for every 15 tasks the
   * backend already held. Scrolling once only ever reaches the second page, so
   * keep pulling in pages until the task shows up — that is what makes the
   * helper independent of how many tasks the backend already holds. A list
   * short enough to fit on one page is matched on the first check, without
   * scrolling at all.
   */
  const seeTask = (text: string) => {
    cy.get('li').should('exist')

    const revealTask = (): void => {
      cy.get('li').then(($tasks) => {
        if (isRendered($tasks, text)) return

        const renderedBefore = $tasks.length
        cy.scrollTo('bottom', { ensureScrollable: false })

        // The browser dispatches the scroll event asynchronously, so the next
        // page is not in the DOM yet when the following command runs — wait for
        // it. Every pass either finds the task or renders another page, and the
        // list is finite, so this terminates: once neither can happen the whole
        // list is on screen without the task, and this assertion reports that
        // instead of looping forever.
        cy.get('li').should(($rendered) => {
          expect(
            isRendered($rendered, text) || $rendered.length > renderedBefore,
            `"${text}" to be rendered, or another page of tasks to load`,
          ).to.equal(true)
        })

        revealTask()
      })
    }

    revealTask()
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

  // Deleting through the persistence layer rather than the UI means a test that
  // failed halfway — before, or instead of, reaching its own removal step —
  // still hands the backend back exactly as it found it.
  afterEach(() => {
    const leftovers = createdTasks.splice(0)
    if (!usesRestBackend || leftovers.length === 0) return

    cy.request<BackendTask[]>(`${apiUrl}/tasks`).then(({ body }) => {
      body
        .filter((task) => leftovers.includes(task.text))
        .forEach((task) => {
          cy.request({
            method: 'DELETE',
            url: `${apiUrl}/tasks/${task.id}`,
            failOnStatusCode: false,
          })
        })
    })
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

    // Reach the toggle through the row rather than through the task text:
    // `cy.contains` yields whichever element it prefers, which is not
    // necessarily the one carrying the state.
    cy.contains(task).closest('li').find('[data-testid="toggle-btn"]').as('toggle')
    cy.get('@toggle').click()
    cy.get('@toggle').should('have.class', 'line-through')
    cy.get('@toggle').should('have.attr', 'aria-pressed', 'true')

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
