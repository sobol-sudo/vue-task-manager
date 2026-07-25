describe('To-Do App', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('adds a new task', () => {
    cy.get('[data-testid="task-input"]').type('Buy milk')

    cy.get(`[data-testid="add-task__btn"]`).should('exist').should('be.visible').click()

    cy.contains('Buy milk').should('exist')
  })

  it('toggles the task status', () => {
    cy.get('[data-testid="task-input"]').type('Do a workout')
    cy.get(`[data-testid="add-task__btn"]`).should('exist').should('be.visible').click()

    cy.contains('Do a workout').click()
    cy.contains('Do a workout').should('have.class', 'line-through')
  })

  it('removes a task', () => {
    cy.get('[data-testid="task-input"]').type('Buy bread')

    cy.get(`[data-testid="add-task__btn"]`).should('exist').should('be.visible').click()

    cy.contains('Buy bread').should('exist')

    cy.contains('Buy bread')
      .should('exist')
      .closest('li')
      .find('.delete-btn')
      .should('exist')
      .should('be.visible')
      .click()

    cy.contains('Buy bread').should('not.exist')
  })

  it('keeps tasks after a page reload', () => {
    cy.get('[data-testid="task-input"]').type('Learn Cypress')
    cy.get(`[data-testid="add-task__btn"]`).should('exist').should('be.visible').click()

    cy.reload()

    cy.contains('Learn Cypress').should('exist')
  })
})
