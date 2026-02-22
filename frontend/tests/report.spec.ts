import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

test.describe('Report Generation Flow', () => {
    test.setTimeout(300000); // 5 minutes since we answer 5 questions dynamically using the AI

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

    test('should complete a full 5-question interview and generate a report', async ({ page }) => {
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
        await page.click('text="Choose your target role"');
        await page.click('text="Frontend Developer"');

        await page.click('text="Select your experience level"');
        await page.click('text="Fresh Graduate / Entry Level"');

        await page.click('text="Technical"');

        await page.fill('input[placeholder="Type a skill and press Enter"]', 'React');
        await page.press('input[placeholder="Type a skill and press Enter"]', 'Enter');

        await page.fill('textarea[placeholder*="Paste your resume"]', 'I am a passionate frontend developer with 1 year of experience in React.');

        // 4. Start Interview
        await page.click('button:has-text("Start Interview Session")');

        await expect(page).toHaveURL(/.*\/interview/, { timeout: 15000 });

        // 5. Answer all questions
        for (let i = 1; i <= 5; i++) {
            console.log(`Answering question ${i}...`);
            await expect(page.locator('text="Your Response"').first()).toBeVisible({ timeout: 15000 });
            
            await page.fill('textarea[placeholder*="Type your detailed answer"]', 'I always use functional components and hooks for state management. This is a standard technical answer to satisfy the AI evaluation.');
            await page.click('button:has-text("Submit Answer")');

            if (i < 5) {
                // Wait for the step to increment
                await expect(page.locator('.interview-progress-tracker span.text-primary').first()).toContainText(`${i + 1} /`, { timeout: 60000 });
            }
        }

        // 6. Verify Report Page loads
        await expect(page).toHaveURL(/.*\/report/, { timeout: 90000 }); // The final report takes longer to generate
        // 7. Verify Report Content
        await expect(page.locator('text="Performance Report"').first()).toBeVisible({ timeout: 15000 });
        await expect(page.locator('text="Overall Score"').first()).toBeVisible();
    });
});
