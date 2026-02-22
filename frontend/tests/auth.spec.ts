import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

test.describe('Authentication and Onboarding Flow', () => {
    const testEmail = 'e2e_tester@example.com';
    const testPassword = 'Password123!';
    const testFullName = 'E2E Tester';

    test.beforeAll(async () => {
        // Run the setup script to create/reset the test user
        const scriptPath = path.resolve(__dirname, '../../backend/scripts/setup-e2e-user.js');
        console.log('Running test user setup script...');
        try {
            execSync(`node "${scriptPath}"`, { 
                cwd: path.resolve(__dirname, '../../backend'),
                stdio: 'inherit' 
            });
        } catch (error) {
            console.error('Failed to setup test user', error);
            throw error;
        }
    });

    test('should log in, complete onboarding, and redirect to dashboard', async ({ page }) => {
        // Listen to console to debug frontend errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`Browser Error: ${msg.text()}`);
            }
        });

        // 1. Log In (First time, onboarding not done)
        await page.goto('/login');
        await page.fill('input[id="email"]', testEmail);
        await page.fill('input[id="password"]', testPassword);
        await page.click('button[type="submit"]');

        // Wait for redirect to onboarding
        await expect(page).toHaveURL(/.*\/onboarding/);

        // 2. Onboarding - Step 1
        await expect(page.locator('h1')).toContainText("Let's Get You Started");
        await page.click('text="Student"');
        await page.click('button:has-text("Continue")');

        // Onboarding - Step 2
        await expect(page.locator('h2')).toContainText("How many years of experience");
        await page.click('text="0-1 years"');
        await page.click('button:has-text("Continue")');

        // Onboarding - Step 3
        await expect(page.locator('h2')).toContainText("What are your goals?");
        await page.click('text="Land First Job"');
        await page.click('button:has-text("Get Started")');

        // Wait for redirect to dashboard
        await expect(page).toHaveURL(/.*\/dashboard/);

        // 3. Verify Dashboard
        await expect(page.locator('h1')).toContainText(`Welcome back, ${testFullName.split(' ')[0]}`);

        // 4. Log out
        // Click on the user avatar dropdown
        await page.click('button:has(.rounded-full)');
        await page.click('text="Log out"');

        // Wait for redirect to home
        await expect(page).toHaveURL(/.*\/$/);
        
        // 5. Log in again
        await page.goto('/login');
        await page.fill('input[id="email"]', testEmail);
        await page.fill('input[id="password"]', testPassword);
        await page.click('button[type="submit"]');

        // Should go straight to dashboard because onboarding is done
        await expect(page).toHaveURL(/.*\/dashboard/);
    });
});
