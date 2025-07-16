import { Page } from '@playwright/test'

export async function mockAuthentication(page: Page) {
  // Mock authentication by setting cookies or localStorage
  // This is a placeholder - implement based on your auth system
  await page.addInitScript(() => {
    localStorage.setItem('auth-token', 'mock-token')
    localStorage.setItem('user', JSON.stringify({
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test User'
    }))
  })
}

export async function waitForLoadingToFinish(page: Page) {
  // Wait for any loading indicators to disappear
  await page.waitForSelector('.v-progress-circular', { state: 'hidden', timeout: 10000 }).catch(() => {})
  await page.waitForSelector('.v-skeleton-loader', { state: 'hidden', timeout: 10000 }).catch(() => {})
}

export async function selectFromDropdown(page: Page, dropdownSelector: string, optionText: string) {
  // Click dropdown
  await page.click(dropdownSelector)
  
  // Wait for menu to open
  await page.waitForSelector('.v-menu__content', { state: 'visible' })
  
  // Click option
  await page.click(`.v-list-item:has-text("${optionText}")`)
}

export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [field, value] of Object.entries(formData)) {
    const input = page.locator(`input[name="${field}"], textarea[name="${field}"]`)
    await input.fill(value)
  }
}

export async function checkToast(page: Page, message: string) {
  const toast = page.locator('.v-snackbar__content').filter({ hasText: message })
  await toast.waitFor({ state: 'visible', timeout: 5000 })
  return toast
}

export async function closeDialog(page: Page) {
  // Try multiple ways to close dialog
  const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel"), .v-dialog button[aria-label="Close"]')
  if (await closeButton.isVisible()) {
    await closeButton.click()
  } else {
    // Press escape as fallback
    await page.keyboard.press('Escape')
  }
}

export async function waitForApiResponse(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(response => 
    (typeof urlPattern === 'string' ? response.url().includes(urlPattern) : urlPattern.test(response.url())) &&
    response.status() === 200
  )
}