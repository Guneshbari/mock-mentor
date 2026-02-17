# Brevo SMTP Email Service

This document explains how to use the Brevo SMTP email service in the Mock Mentor backend.

## Setup

### 1. Install Dependencies

The required dependency `nodemailer` has already been installed.

### 2. Configure Environment Variables

Add the following variables to your `.env` file:

```env
# Brevo SMTP Configuration
BREVO_API_KEY=your_actual_brevo_api_key
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Mock Mentor
```

**Important Notes:**

- Replace `your_actual_brevo_api_key` with your actual Brevo API key
- Replace `noreply@yourdomain.com` with a verified sender email from your Brevo account
- For SMTP, the password is your Brevo API key (not a separate SMTP password)

### 3. Verify Brevo Account

Before sending emails, ensure:

1. You have a Brevo account (https://www.brevo.com)
2. Your sender email is verified in Brevo
3. Your API key has SMTP permissions

## Usage

### Import the Service

```javascript
const emailService = require("./services/email.service");
```

### Available Methods

#### 1. Verify Connection

```javascript
const isConnected = await emailService.verifyConnection();
if (isConnected) {
  console.log("Email service is ready");
}
```

#### 2. Send Welcome Email

```javascript
await emailService.sendWelcomeEmail("user@example.com", "John Doe");
```

#### 3. Send Interview Completion Email

```javascript
const sessionData = {
  jobRole: "Software Engineer",
  totalQuestions: 10,
  overallScore: 8.5,
  strengths: "Strong technical knowledge",
  improvements: "Practice behavioral questions",
};

await emailService.sendInterviewCompletionEmail(
  "user@example.com",
  "John Doe",
  sessionData,
);
```

#### 4. Send Session Reminder

```javascript
await emailService.sendSessionReminder("user@example.com", "John Doe");
```

#### 5. Send Weekly Report

```javascript
const reportData = {
  sessionsCompleted: 5,
  averageScore: 8.2,
  topStrength: "Problem solving",
  improvement: "Time management",
};

await emailService.sendWeeklyReport("user@example.com", "John Doe", reportData);
```

#### 6. Send Custom Email

```javascript
await emailService.sendEmail({
  to: "user@example.com",
  subject: "Custom Subject",
  text: "Plain text version",
  html: "<h1>HTML version</h1>",
});
```

## Testing

Run the test script to verify your email configuration:

```bash
node test-email.js
```

This will:

1. Verify SMTP connection
2. Send 4 test emails (welcome, completion, reminder, weekly report)
3. Display results in the console

## Integration Examples

### Profile Service (Send Welcome Email)

```javascript
// In profile.service.js
const emailService = require("./email.service");

async function createUserProfile(userId, profileData) {
  // ... existing code ...

  // Send welcome email
  if (profileData.email) {
    await emailService.sendWelcomeEmail(profileData.email, profileData.name);
  }

  return profile;
}
```

### Interview Service (Send Completion Email)

```javascript
// In interview.service.js
const emailService = require("./email.service");

async function endSession(sessionId, userId) {
  // ... generate feedback ...

  // Get user email
  const user = await getUser(userId);

  // Send completion email
  if (user.email && user.emailNotifications) {
    const sessionData = {
      jobRole: session.jobRole,
      totalQuestions: session.totalQuestions,
      overallScore: feedback.overallScore,
      strengths: feedback.strengths,
      improvements: feedback.improvements,
    };

    await emailService.sendInterviewCompletionEmail(
      user.email,
      user.name,
      sessionData,
    );
  }

  return session;
}
```

## Email Templates

All emails include:

- Professional HTML design with gradient headers
- Responsive layout (mobile-friendly)
- Consistent branding
- Plain text fallback
- Unsubscribe information

### Customization

To customize email templates:

1. Open `src/services/email.service.js`
2. Find the method you want to customize (e.g., `sendWelcomeEmail`)
3. Modify the HTML template in the method

## Troubleshooting

### Common Issues

**1. "Invalid API key" error**

- Verify your `BREVO_API_KEY` in `.env` is correct
- Check that the API key has SMTP permissions in Brevo dashboard

**2. "Sender email not verified" error**

- Go to Brevo dashboard → Senders → Add a sender
- Verify your sender email address

**3. Emails not being received**

- Check spam/junk folder
- Verify recipient email is valid
- Check Brevo dashboard for delivery status

**4. Connection timeout**

- Verify `BREVO_SMTP_HOST` and `BREVO_SMTP_PORT` are correct
- Check firewall settings (port 587 should be open)

### Rate Limits

Brevo free plan includes:

- 300 emails per day
- Monitor usage in Brevo dashboard

## Best Practices

1. **Respect User Preferences**
   - Always check `emailNotifications` preference before sending emails
   - Provide easy unsubscribe options

2. **Error Handling**
   - Wrap email sends in try-catch blocks
   - Log errors but don't fail the main operation

   ```javascript
   try {
     await emailService.sendWelcomeEmail(email, name);
   } catch (error) {
     console.error("Failed to send welcome email:", error);
     // Continue with the main operation
   }
   ```

3. **Production Considerations**
   - Use a queue system (e.g., Bull, BullMQ) for sending emails asynchronously
   - Implement retry logic for failed sends
   - Monitor email delivery rates

## Security Notes

- Never commit your `.env` file with real API keys
- Rotate API keys periodically
- Use different API keys for development and production
- Keep sender email addresses professional and branded
