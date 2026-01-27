# Contributing to Mock Mentor

Thank you for your interest in contributing to Mock Mentor! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/mock-mentor.git
   cd mock-mentor
   ```
3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 Development Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Add your GEMINI_API_KEY or GROQ_API_KEY to .env
node src/server.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🎯 Project Structure

```
mock-mentor/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── blocks/          # Composable AI blocks
│   │   │   ├── ai.service.js    # Main AI orchestration
│   │   │   └── interview.service.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── app/                      # Next.js app directory
│   ├── components/              # React components
│   └── package.json
└── README.md
```

## 🔧 Making Changes

### Code Style
- **Backend**: Follow Node.js best practices, use camelCase
- **Frontend**: Follow React/TypeScript conventions
- **Formatting**: Use consistent indentation (2 spaces)
- **Comments**: Add JSDoc comments for functions

### Commit Messages
Follow conventional commits:
```
feat: add new interview type
fix: resolve audio transcription issue
docs: update API documentation
refactor: improve question generation logic
test: add evaluation block tests
```

### Testing

Before submitting:
1. Test the full interview flow manually
2. Verify audio mode works (if modified)
3. Check both light and dark modes
4. Ensure no console errors

## 📝 Pull Request Process

1. **Update documentation** if you changed functionality
2. **Test thoroughly** - run through complete interview
3. **Update README.md** if you added features
4. **Create descriptive PR title and description**
5. **Link any related issues**

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Manual testing completed
- [ ] No console errors or warnings
- [ ] Responsive design maintained

## 🐛 Reporting Bugs

Use GitHub Issues with the following information:

**Bug Report Template:**
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Node version: [e.g., 18.17.0]
```

## ✨ Feature Requests

Use GitHub Issues with:
- Clear description of the feature
- Use case / why it's needed
- Proposed implementation (optional)
- Mockups or examples (if applicable)

## 🎨 Areas for Contribution

### High Priority
- [ ] Add more interview types (System Design, Coding)
- [ ] Implement user authentication
- [ ] Add interview history/persistence
- [ ] Export reports as PDF
- [ ] Multi-language support

### Good First Issues
- [ ] Improve error messages
- [ ] Add loading states
- [ ] Enhance UI animations
- [ ] Add tooltips for features
- [ ] Improve mobile responsiveness

### Advanced Features
- [ ] Performance analytics dashboard
- [ ] Interview scheduling
- [ ] Share interview reports
- [ ] Collaborative interviews
- [ ] Custom question banks

## 🧪 Testing Guidelines

### Manual Testing Checklist
- [ ] Start interview with all interview types (HR, Technical, Behavioral)
- [ ] Test with different experience levels (Fresh, Junior, Senior)
- [ ] Verify adaptive questioning (questions reference previous answers)
- [ ] Test audio mode (record and transcribe)
- [ ] Check final report generation
- [ ] Verify all UI components render correctly
- [ ] Test dark mode toggle

## 📚 Code Documentation

### Adding New Blocks

When adding a new composable block:

```javascript
/**
 * NewBlock
 * Responsibility: Brief description of what this block does
 */
class NewBlock {
    constructor(dependencies) {
        // Initialize
    }

    /**
     * Execute the block logic
     * @param {object} context - Input context
     * @returns {Promise<object>} Result
     */
    async execute(context) {
        // Implementation
    }
}

module.exports = NewBlock;
```

### API Endpoints

Document new endpoints in README.md:
```markdown
### `POST /api/new-endpoint`
Description

**Request:**
...

**Response:**
...
```

## 🤝 Code Review Process

1. Maintainers will review your PR within 3-5 days
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be acknowledged in releases

## 📧 Questions?

- Open a GitHub Discussion for general questions
- Tag maintainers in issues for specific questions
- Check existing issues before creating new ones

## 🏆 Recognition

Contributors will be:
- Listed in releases
- Mentioned in CHANGELOG.md
- Added to README.md contributors section (if significant contribution)

---

Thank you for contributing to Mock Mentor! 🎉
