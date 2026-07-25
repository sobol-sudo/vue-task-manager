import { openWith } from '../support/seededBackend'

/**
 * Everything outside the task list itself: the three routes, the fallback for
 * anything else, and the two settings that are supposed to outlive the tab.
 * None of it was covered before, and all of it fails silently — a missing
 * catch-all route renders a blank page under the header rather than an error,
 * and a settings switch that stops persisting still looks like it worked until
 * the next reload.
 *
 * The list is stubbed empty so that nothing leaves the browser; these tests
 * pass with the backend switched off.
 */
describe('Navigation and settings', () => {
  /**
   * The router has always set `aria-current` and `router-link-exact-active` on
   * the link for the current route; for a while nothing styled that class, so
   * all three links looked identical everywhere and the navigation never said
   * where you were. Comparing what the browser actually paints is what catches
   * that — asserting on the class alone passes against the broken build.
   *
   * The highlight fades in over 0.2s, so the comparison has to be retried
   * rather than sampled once: read a moment too early and every link is still
   * the colour it was.
   */
  const expectCurrentLinkToStandOut = (href: string) => {
    cy.get('nav a').should(($links) => {
      const links = $links.toArray().map((link) => ({
        href: link.getAttribute('href'),
        marked: link.classList.contains('router-link-exact-active'),
        background: link.ownerDocument.defaultView!.getComputedStyle(link).backgroundColor,
      }))

      const current = links.filter((link) => link.marked)
      expect(
        current.map((link) => link.href),
        'exactly the current route is marked',
      ).to.deep.equal([href])

      links
        .filter((link) => !link.marked)
        .forEach((other) => {
          expect(
            current[0].background,
            `the link to ${href} to be drawn differently from the one to ${other.href}`,
          ).to.not.equal(other.background)
        })
    })

    cy.get(`nav a[href="${href}"]`).should('have.attr', 'aria-current', 'page')
  }

  it('reaches every route from the navigation and marks the one you are on', () => {
    openWith([])

    cy.get('[data-testid="task-input"]').should('exist')
    expectCurrentLinkToStandOut('/')

    cy.get('nav a[href="/settings"]').click()
    cy.location('pathname').should('equal', '/settings')
    cy.get('[data-testid="theme-select"]').should('exist')
    cy.get('[data-testid="language-select"]').should('exist')
    expectCurrentLinkToStandOut('/settings')

    cy.get('nav a[href="/about"]').click()
    cy.location('pathname').should('equal', '/about')
    cy.contains('Alex Sobol').should('be.visible')
    expectCurrentLinkToStandOut('/about')

    cy.get('nav a[href="/"]').click()
    cy.location('pathname').should('equal', '/')
    cy.get('[data-testid="task-input"]').should('exist')
    expectCurrentLinkToStandOut('/')
  })

  /**
   * The host rewrites every unknown path to `index.html`, so without a catch-all
   * route a mistyped or stale link answers 200 and draws the header and footer
   * around nothing at all — no message, no way back.
   */
  it('shows the 404 view for an unknown deep link, and gets home from it', () => {
    openWith([], { path: '/settings/not-a-real-page', failOnStatusCode: false })

    cy.contains('404').should('be.visible')
    cy.get('[data-testid="task-input"]').should('not.exist')

    cy.contains('a', 'Back to the task list').click()
    cy.location('pathname').should('equal', '/')
    cy.get('[data-testid="task-input"]').should('exist')
  })

  /**
   * Theme and language are both written to `localStorage` and read back at
   * start-up, so the only assertion that means anything is the one made after a
   * reload. Note that no Russian string appears here: the check is that the
   * interface stopped saying what it said in English, which stays true whatever
   * the catalogue is changed to.
   */
  it('applies the theme and the language, and remembers both across a reload', () => {
    openWith([])

    cy.get('h1')
      .invoke('text')
      .then((englishHeading) => {
        cy.get('nav a[href="/settings"]').click()

        // Both directions: the theme is seeded from the operating system's
        // `prefers-color-scheme`, so checking only the value this machine
        // happens to start on would pass without the switch doing anything.
        cy.get('[data-testid="theme-select"]').select('light')
        cy.get('html').should('not.have.class', 'dark')
        cy.window().then((win) => expect(win.localStorage.getItem('theme')).to.equal('light'))

        cy.get('[data-testid="theme-select"]').select('dark')
        cy.get('html').should('have.class', 'dark')
        cy.window().then((win) => expect(win.localStorage.getItem('theme')).to.equal('dark'))

        cy.get('[data-testid="language-select"]').select('ru')
        cy.get('html').should('have.attr', 'lang', 'ru')
        cy.window().then((win) => expect(win.localStorage.getItem('language')).to.equal('ru'))

        cy.reload()

        cy.get('html').should('have.class', 'dark').and('have.attr', 'lang', 'ru')
        cy.get('nav a[href="/"]').click()
        cy.get('h1').should('not.have.text', englishHeading)
      })
  })
})
