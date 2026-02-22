import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

test.describe('Interview Session Flow', () => {
    test.setTimeout(120000); // 120 seconds for API generation

    const testEmail = 'interview_tester@example.com';
    const testPassword = 'Password123!';

    test.beforeAll(async () => {
        // Run the setup script to create the interview test user
        const scriptPath = path.resolve(__dirname, '../../backend/scripts/setup-interview-tester.js');
        console.log('Running interview test user setup script...');
        try {
            execSync(`node "${scriptPath}"`, { 
                cwd: path.resolve(__dirname, '../../backend'),
                stdio: 'inherit' 
            });
        } catch (error) {
            console.error('Failed to setup interview test user', error);
            throw error;
        }
    });

    test('should configure and start an interview session, and submit an answer', async ({ page }) => {
        // 1. Log In (Should go to Dashboard since onboarding is true)
        await page.goto('/login');
        await page.fill('input[id="email"]', testEmail);
        await page.fill('input[id="password"]', testPassword);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

        // 2. Start new session
        await page.click('text="Start New Session"');
        await expect(page).toHaveURL(/.*\/interview-setup/);

        // 3. Configure Interview
        // Role
        await page.click('text="Choose your target role"');
        await page.click('text="Frontend Developer"');

        // Experience
        await page.click('text="Select your experience level"');
        await page.click('text="Fresh Graduate / Entry Level"');

        // Type
        await page.click('text="Technical"');

        // Skills
        await page.fill('input[placeholder="Type a skill and press Enter"]', 'React');
        await page.press('input[placeholder="Type a skill and press Enter"]', 'Enter');

        // Resume
        await page.fill('textarea[placeholder*="Paste your resume"]', 'I am a passionate frontend developer with 1 year of experience in React, Next.js, and TypeScript building beautiful web applications.');

        // 4. Start Interview
        await page.click('button:has-text("Start Interview Session")');

        // Wait for redirect to actual interview page
        await expect(page).toHaveURL(/.*\/interview/, { timeout: 15000 });

        // 5. Submit an Answer
        await expect(page.locator('text="Your Response"').first()).toBeVisible({ timeout: 10000 });
        
        // Enter answer
        await page.fill('textarea[placeholder*="Type your detailed answer"]', 'React is a JavaScript library for building user interfaces. It uses a virtual DOM for performance.');
        
        // Click submit
        await page.click('button:has-text("Submit Answer")');

        // Expect progress to update or an evaluation to appear
        // Ensure progress is now 2
        await expect(page.locator('.interview-progress-tracker span.text-primary').first()).toContainText('2 /', { timeout: 30000 });
    });
});
