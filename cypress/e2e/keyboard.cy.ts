import { openWith, seededTasks } from '../support/seededBackend'

/**
 * A control that only answers to a mouse is invisible to anyone using a
 * keyboard or a screen reader, and nothing about it looks wrong in a
 * screenshot — which is how this app shipped with two of them: Import was a
 * `<label>` wrapped around a `display: none` file input, and completing a task
 * was a click handler on a bare `<li>`. Both were clickable and neither was in
 * the tab order, so the destructive half of a task row worked from the keyboard
 * while the reversible half did not.
 *
 * These checks need a real browser: reachability depends on layout (an element
 * inside `display: none` is skipped whatever its `tabindex` says), and jsdom
 * does no layout at all, so the unit suite cannot see any of it.
 */
describe('Keyboard operation', () => {
  /**
   * The browser's own rule for the tab order: a positive-or-zero `tabIndex`, not
   * disabled, and actually laid out. `offsetParent` is null for anything inside
   * a `display: none` subtree, which is exactly what hid the file input.
   */
  const isReachableByTab = (element: HTMLElement) =>
    element.tabIndex >= 0 && !element.hasAttribute('disabled') && element.offsetParent !== null

  it('leaves no control on the task page out of the tab order', () => {
    openWith(seededTasks(3))
    cy.get('li').should('have.length', 3)

    const controls: [string, string][] = [
      ['every navigation link', 'nav a'],
      ['the export button', '[data-testid="export-btn"]'],
      ['the import button', '[data-testid="import-btn"]'],
      ['the task field', '[data-testid="task-input"]'],
      ['the priority select', '.task-form select'],
      ['the add button', '[data-testid="add-task__btn"]'],
      ['the search box', 'input[type="text"]'],
      ['every filter', '.filter-buttons button'],
      ["every task's completion toggle", '[data-testid="toggle-btn"]'],
      ["every task's delete button", '[data-testid="delete-btn"]'],
    ]

    controls.forEach(([label, selector]) => {
      cy.get(selector)
        .should('exist')
        .each(($element) => {
          expect(
            isReachableByTab($element[0]),
            `${label} (${selector}) to be reachable with Tab`,
          ).to.equal(true)
        })
    })
  })

  /**
   * Reachability is only half of it: the toggle also has to be something the
   * browser activates on Enter and Space, which is what a native `<button>`
   * buys and a focusable `<div>` does not. `cy.focus()` refuses an element that
   * cannot hold focus, so the first line fails outright on a bare `<li>`.
   */
  it('completes a task from the keyboard, and stores the result', () => {
    openWith(seededTasks(3))

    cy.get('[data-testid="toggle-btn"]').first().as('toggle')
    cy.get('@toggle').should('match', 'button').and('have.attr', 'aria-pressed', 'false')

    cy.get('@toggle').focus()
    cy.get('@toggle').should('have.focus')
    cy.focused().click()

    // The strike-through is the visual half of the state; `aria-pressed` is the
    // half a screen reader gets, and it used to be missing entirely.
    cy.get('@toggle').should('have.attr', 'aria-pressed', 'true')
    cy.get('@toggle').should('have.class', 'line-through')

    cy.reload()
    cy.get('[data-testid="toggle-btn"]').first().should('have.attr', 'aria-pressed', 'true')
  })
})
