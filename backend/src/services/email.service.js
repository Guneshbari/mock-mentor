const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email service for sending emails using Brevo SMTP
 */
class EmailService {
    constructor() {
        // Create reusable transporter object using Brevo SMTP
        this.transporter = nodemailer.createTransport({
            host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
            port: parseInt(process.env.BREVO_SMTP_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.BREVO_SENDER_EMAIL,
                pass: process.env.BREVO_API_KEY
            }
        });

        this.defaultFrom = {
            name: process.env.BREVO_SENDER_NAME || 'Mock Mentor',
            address: process.env.BREVO_SENDER_EMAIL
        };
    }

    /**
     * Verify SMTP connection configuration
     * @returns {Promise<boolean>} True if connection is successful
     */
    async verifyConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Brevo SMTP server is ready to send emails');
            return true;
        } catch (error) {
            console.error('❌ Brevo SMTP connection error:', error.message);
            return false;
        }
    }

    /**
     * Send a generic email
     * @param {Object} options - Email options
     * @param {string} options.to - Recipient email address
     * @param {string} options.subject - Email subject
     * @param {string} options.text - Plain text version
     * @param {string} options.html - HTML version
     * @returns {Promise<Object>} Email send result
     */
    async sendEmail({ to, subject, text, html }) {
        try {
            const mailOptions = {
                from: this.defaultFrom,
                to,
                subject,
                text,
                html: html || text
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('📧 Email sent successfully:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Error sending email:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send welcome email to new users
     * @param {string} email - User email
     * @param {string} name - User name
     * @returns {Promise<Object>} Email send result
     */
    async sendWelcomeEmail(email, name) {
        const subject = 'Welcome to Mock Mentor! 🎉';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Mock Mentor!</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${name || 'there'}! 👋</h2>
                        <p>We're excited to have you on board! Mock Mentor is your AI-powered interview practice platform that helps you ace your next interview.</p>
                        
                        <h3>What you can do:</h3>
                        <ul>
                            <li>🎯 Practice with AI-powered mock interviews</li>
                            <li>📊 Track your performance and progress</li>
                            <li>💡 Get personalized feedback and improvement tips</li>
                            <li>🏆 Achieve your career goals</li>
                        </ul>
                        
                        <p>Ready to get started?</p>
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">Go to Dashboard</a>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Mock Mentor. All rights reserved.</p>
                        <p>You're receiving this email because you signed up for Mock Mentor.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const text = `Welcome to Mock Mentor, ${name || 'there'}! We're excited to have you on board. Start practicing your interview skills today!`;
        
        return this.sendEmail({ to: email, subject, text, html });
    }

    /**
     * Send interview completion email with feedback
     * @param {string} email - User email
     * @param {string} name - User name
     * @param {Object} sessionData - Interview session data
     * @returns {Promise<Object>} Email send result
     */
    async sendInterviewCompletionEmail(email, name, sessionData) {
        const { jobRole, totalQuestions, overallScore, strengths, improvements } = sessionData;
        
        const subject = `Your ${jobRole} Interview Summary 📋`;
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .score { font-size: 48px; font-weight: bold; color: #667eea; text-align: center; margin: 20px 0; }
                    .section { margin: 20px 0; padding: 15px; background: white; border-radius: 5px; }
                    .section h3 { color: #667eea; margin-top: 0; }
                    .list-item { margin: 8px 0; padding-left: 20px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Interview Complete! 🎉</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${name || 'there'},</p>
                        <p>Great job completing your <strong>${jobRole}</strong> mock interview!</p>
                        
                        <div class="score">${overallScore || 'N/A'}/10</div>
                        <p style="text-align: center; color: #666;">Overall Performance Score</p>
                        
                        <div class="section">
                            <h3>📊 Session Summary</h3>
                            <p><strong>Role:</strong> ${jobRole}</p>
                            <p><strong>Questions Answered:</strong> ${totalQuestions || 0}</p>
                        </div>
                        
                        ${strengths ? `
                        <div class="section">
                            <h3>💪 Your Strengths</h3>
                            <p>${strengths}</p>
                        </div>
                        ` : ''}
                        
                        ${improvements ? `
                        <div class="section">
                            <h3>📈 Areas for Improvement</h3>
                            <p>${improvements}</p>
                        </div>
                        ` : ''}
                        
                        <p>Keep practicing to improve your interview skills!</p>
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">View Full Report</a>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Mock Mentor. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const text = `Interview Complete! Your ${jobRole} interview score: ${overallScore || 'N/A'}/10. ${strengths ? 'Strengths: ' + strengths : ''} ${improvements ? 'Areas for improvement: ' + improvements : ''}`;
        
        return this.sendEmail({ to: email, subject, text, html });
    }

    /**
     * Send session reminder email
     * @param {string} email - User email
     * @param {string} name - User name
     * @returns {Promise<Object>} Email send result
     */
    async sendSessionReminder(email, name) {
        const subject = "Don't forget to practice! 🎯";
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Time to Practice! 💪</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${name || 'there'},</p>
                        <p>We noticed you haven't practiced recently. Remember, consistency is key to acing your interviews!</p>
                        
                        <p>Just 15 minutes of practice can make a huge difference in your confidence and performance.</p>
                        
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/interview/new" class="button">Start Practice Session</a>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Mock Mentor. All rights reserved.</p>
                        <p>Don't want these reminders? Update your preferences in settings.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const text = `Hi ${name || 'there'}, time to practice! Consistency is key to acing your interviews. Start a practice session today!`;
        
        return this.sendEmail({ to: email, subject, text, html });
    }

    /**
     * Send weekly report email
     * @param {string} email - User email
     * @param {string} name - User name
     * @param {Object} reportData - Weekly report data
     * @returns {Promise<Object>} Email send result
     */
    async sendWeeklyReport(email, name, reportData) {
        const { sessionsCompleted, averageScore, topStrength, improvement } = reportData;
        
        const subject = 'Your Weekly Progress Report 📊';
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .stat { text-align: center; padding: 20px; background: white; border-radius: 5px; margin: 10px 0; }
                    .stat-value { font-size: 36px; font-weight: bold; color: #667eea; }
                    .stat-label { color: #666; margin-top: 5px; }
                    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Your Weekly Progress 📊</h1>
                    </div>
                    <div class="content">
                        <p>Hi ${name || 'there'},</p>
                        <p>Here's a summary of your progress this week:</p>
                        
                        <div class="stat">
                            <div class="stat-value">${sessionsCompleted || 0}</div>
                            <div class="stat-label">Practice Sessions Completed</div>
                        </div>
                        
                        <div class="stat">
                            <div class="stat-value">${averageScore || 'N/A'}/10</div>
                            <div class="stat-label">Average Score</div>
                        </div>
                        
                        ${topStrength ? `
                        <p><strong>🌟 Top Strength:</strong> ${topStrength}</p>
                        ` : ''}
                        
                        ${improvement ? `
                        <p><strong>📈 Focus Area:</strong> ${improvement}</p>
                        ` : ''}
                        
                        <p>Keep up the great work! Consistent practice leads to success.</p>
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">View Dashboard</a>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} Mock Mentor. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        const text = `Your weekly progress: ${sessionsCompleted || 0} sessions completed, average score: ${averageScore || 'N/A'}/10. ${topStrength ? 'Top strength: ' + topStrength : ''} ${improvement ? 'Focus area: ' + improvement : ''}`;
        
        return this.sendEmail({ to: email, subject, text, html });
    }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
