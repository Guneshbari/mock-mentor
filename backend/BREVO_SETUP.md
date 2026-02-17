# Quick Start: Brevo SMTP Setup

Follow these steps to enable email functionality in Mock Mentor:

## 1. Get Your Brevo API Key

1. Go to https://www.brevo.com and sign up (or login)
2. Navigate to **SMTP & API** → **API Keys**
3. Create a new API key or copy your existing key

## 2. Verify Sender Email

1. In Brevo dashboard, go to **Senders** → **Add a sender**
2. Add and verify your sender email address (e.g., noreply@yourdomain.com)
3. Complete the email verification process

## 3. Configure Environment Variables

Edit your `backend/.env` file and add:

```env
# Brevo SMTP Configuration
BREVO_API_KEY=your_actual_brevo_api_key_here
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SENDER_EMAIL=your_verified_email@yourdomain.com
BREVO_SENDER_NAME=Mock Mentor
```

**Replace:**

- `your_actual_brevo_api_key_here` with your Brevo API key
- `your_verified_email@yourdomain.com` with your verified sender email

## 4. Test Email Service

Run the test script to verify everything works:

```bash
cd backend
node test-email.js
```

You should see:

- ✅ SMTP connection verified
- ✅ 4 test emails sent successfully
- Check your inbox for the test emails

## 5. Done! 🎉

Emails will now be automatically sent when:

- ✅ User completes an interview session (Interview completion email)

### Future Integration Points

You can also integrate:

- Welcome emails (when users sign up)
- Session reminders (scheduled notifications)
- Weekly reports (batch emails with progress summary)

See `backend/EMAIL_SERVICE.md` for detailed usage and integration examples.

---

## Troubleshooting

**Problem:** "Invalid API key" error

- **Solution:** Double-check your API key in Brevo dashboard

**Problem:** "Sender email not verified" error

- **Solution:** Verify your sender email in Brevo dashboard

**Problem:** Emails not received

- **Solution:** Check spam folder, verify email address is correct

Need help? See the full documentation in `backend/EMAIL_SERVICE.md`
