# Finova - Comprehensive Financial Management Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

> A modern, full-stack personal finance tracker with AI-powered insights, multi-account support, and comprehensive budgeting tools.

**Created by Mofazzal Hossain & Gordan Healy**  
**Munster Technological University, Ireland**

---

## 🎯 Overview

Finova is an open-source financial management platform designed to help users take control of their personal finances. Built with modern technologies and best practices, it combines powerful features with an intuitive user experience.

### Key Features

- 🔐 **Secure Authentication**: OAuth 2.0 (Google, GitHub) + traditional email/password
- 💳 **Multi-Account Management**: Track checking, savings, credit cards, cash, and investments
- 🤖 **AI-Powered Insights**: Machine learning-driven spending analysis and forecasting
- 📊 **Advanced Analytics**: Beautiful charts, trends, and financial forecasting
- 💰 **Smart Budgeting**: Category-based budgets with real-time tracking and alerts
- 🎯 **Goal Tracking**: Set and monitor savings goals with visual progress indicators
- 📸 **Receipt Management**: Upload and OCR-process receipts
- 📥 **Data Import/Export**: CSV/Excel import, PDF export
- 🔔 **Smart Notifications**: Bill reminders, budget alerts, weekly summaries
- 📱 **Multi-Platform**: Web, Desktop (Windows/macOS/Linux), Mobile (Android/iOS)

---

## 🏗️ Architecture

### Tech Stack

**Backend**
- Node.js v18+ with Express
- MongoDB with Mongoose ODM
- Redis for caching and session management
- Passport.js for OAuth authentication
- JWT for API authentication
- Bull for job queuing
- Winston for logging

**Frontend**
- React 18 with Vite
- Redux Toolkit for state management
- TailwindCSS for styling
- Chart.js & D3.js for visualizations
- Framer Motion for animations

**AI/ML Services**
- Python Flask microservice
- TensorFlow for deep learning
- Scikit-learn for classical ML
- spaCy for NLP

**Infrastructure**
- Docker for containerization
- GitHub Actions for CI/CD
- AWS S3 for receipt storage
- Redis for caching

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Web    │  │ Desktop  │  │  Mobile  │  │   API    │   │
│  │  (React) │  │(Electron)│  │(Capacitor)│  │ Clients  │   │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘   │
└────────┼────────────┼──────────────┼─────────────┼─────────┘
         │            │              │             │
         └────────────┴──────────────┴─────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │         API Gateway / Load Balancer     │
         └────────────────────┬────────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │          Express.js API Server          │
         │  ┌──────────────────────────────────┐   │
         │  │  Routes & Controllers            │   │
         │  │  - Auth (OAuth 2.0, JWT)         │   │
         │  │  - Accounts & Transactions       │   │
         │  │  - Budgets & Goals               │   │
         │  │  - AI Insights & Analytics       │   │
         │  │  - Receipts & Import/Export      │   │
         │  └──────────────┬───────────────────┘   │
         └─────────────────┼───────────────────────┘
                           │
      ┌────────────────────┼────────────────────┐
      │                    │                    │
┌─────▼─────┐      ┌──────▼──────┐     ┌──────▼──────┐
│  MongoDB  │      │    Redis    │     │  AI Service │
│ (Primary  │      │  (Sessions  │     │   (Flask)   │
│   DB)     │      │  & Caching) │     │  - TF.js    │
│           │      │             │     │  - Sklearn  │
└───────────┘      └─────────────┘     │  - spaCy    │
                                        └─────────────┘
                                              │
                                        ┌─────▼─────┐
                                        │  AWS S3   │
                                        │ (Receipts)│
                                        └───────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 6.0
- Redis >= 7.0
- npm or yarn
- (Optional) Python 3.9+ for AI features

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/finova.git
   cd finova
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **AI Service Setup** (Optional)
   ```bash
   cd ai-service
   pip install -r requirements.txt
   python app.py
   ```

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/finova
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# OAuth - GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# AI Service
AI_SERVICE_URL=http://localhost:5000

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_BUCKET_NAME=finova-receipts
AWS_REGION=eu-west-1

# Frontend
CORS_ORIGIN=http://localhost:5173
```

### Running the Application

**Development Mode:**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - AI Service (optional)
cd ai-service && python app.py
```

**Production Build:**
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm run build && npm run preview
```

Access the application at `http://localhost:5173`

---

## 📚 Core Features

### 1. User Authentication

#### OAuth 2.0 Integration
- **Google OAuth**: Sign in with Google account
- **GitHub OAuth**: Sign in with GitHub account
- **Account Linking**: Link multiple OAuth providers to one account
- **Secure Token Management**: JWT with refresh token rotation
- **PKCE Support**: Proof Key for Code Exchange for mobile clients

#### Traditional Authentication
- Email/password with bcrypt hashing (cost factor 12)
- Password reset via email
- Two-factor authentication (2FA)
- Biometric authentication support (mobile)

### 2. Multi-Account Management

Track unlimited accounts across different types:
- **Checking Accounts**: Day-to-day spending
- **Savings Accounts**: Emergency funds, goals
- **Credit Cards**: Track balances, limits, utilization
- **Cash**: Physical money tracking
- **Investments**: Stocks, bonds, retirement accounts
- **Loans**: Mortgages, student loans, personal loans

#### Features:
- Real-time balance tracking
- Account-to-account transfers
- Low balance alerts
- Credit utilization monitoring
- Net worth calculations

### 3. Transaction Management

#### Core Features:
- Income and expense tracking
- Recurring transactions (subscriptions, salary)
- Transaction categorization (15+ default categories)
- Custom tags and notes
- Merchant information
- Receipt attachments
- CSV/Excel import

#### Advanced Features:
- AI-powered auto-categorization
- Duplicate detection
- Bulk editing
- Search and filtering
- Export to CSV/PDF

### 4. AI-Powered Insights

#### Spending Analysis:
- Pattern detection using K-means clustering
- Category breakdown and trends
- Anomaly detection for unusual spending
- Comparative analysis (month-over-month, year-over-year)

#### Forecasting:
- Expense prediction using LSTM neural networks
- Income projection
- Budget recommendations
- Savings optimization

#### Personalized Recommendations:
- Spending reduction suggestions
- Emergency fund guidance
- Investment allocation advice
- Debt payoff strategies

### 5. Budgeting System

- **Category Budgets**: Set monthly/weekly limits per category
- **Real-time Tracking**: Live progress bars
- **Smart Alerts**: 80% and 100% threshold notifications
- **Budget Rollover**: Carry unused budget to next period
- **Historical Comparison**: Track budget performance over time

### 6. Goal Tracking

- **Savings Goals**: Emergency fund, vacation, down payment
- **Visual Progress**: Charts and milestones
- **Automated Contributions**: Schedule automatic transfers
- **Goal Sharing**: Share progress with family (optional)
- **Deadline Reminders**: Stay on track with notifications

### 7. Analytics & Reporting

- **Dashboard**: Overview of finances at a glance
- **Spending Trends**: Interactive charts (pie, bar, line, area)
- **Income vs Expense**: Monthly comparisons
- **Net Worth Tracking**: See your wealth grow over time
- **Custom Reports**: Generate reports for any date range
- **Export Options**: PDF, CSV, Excel

### 8. Receipt Management

- **Upload**: Drag-and-drop or camera capture
- **OCR Processing**: Automatic text extraction
- **Auto-categorization**: AI-powered category detection
- **Cloud Storage**: Secure S3 storage
- **Search**: Find receipts by merchant, amount, date

### 9. Notifications

- **Budget Alerts**: When approaching or exceeding limits
- **Bill Reminders**: Never miss a payment
- **Goal Milestones**: Celebrate progress
- **Weekly Summaries**: Spending recap every Sunday
- **Unusual Activity**: Anomaly detection alerts
- **Custom Notifications**: Set your own triggers

---

## 🔐 Security

### Authentication & Authorization
- JWT with short-lived access tokens (15 min)
- Refresh token rotation
- OAuth 2.0 with PKCE for mobile
- Session management via Redis
- IP-based rate limiting

### Data Protection
- Passwords hashed with bcrypt (cost 12)
- Sensitive data encrypted at rest
- HTTPS enforced in production
- CORS properly configured
- Helmet.js security headers
- Input validation and sanitization

### Account Security
- Account lockout after 5 failed login attempts
- Password strength requirements
- Two-factor authentication (TOTP)
- Biometric authentication (mobile)
- Session timeout
- Device tracking

---

## 📱 Multi-Platform Support

### Web Application
- Modern React SPA
- Progressive Web App (PWA)
- Offline support
- Responsive design (mobile-first)
- Dark/light theme

### Desktop Application (Electron)
- Windows (exe, portable)
- macOS (dmg, pkg)
- Linux (AppImage, deb, rpm)
- Native notifications
- System tray integration

### Mobile Application (Capacitor)
- Android (APK, AAB)
- iOS (IPA)
- Biometric authentication
- Push notifications
- Camera integration for receipts

---

## 🤖 AI/ML Features

### Machine Learning Models

1. **Transaction Categorization** (spaCy NLP)
   - Automatic category assignment based on merchant/description
   - Confidence scoring
   - Continuous learning from user corrections

2. **Spending Pattern Analysis** (K-means Clustering)
   - Identify spending habits
   - Group similar transactions
   - Detect trends and seasonality

3. **Expense Forecasting** (LSTM Neural Network)
   - Predict future monthly expenses
   - Confidence intervals
   - Trend analysis

4. **Anomaly Detection** (Statistical Analysis)
   - Flag unusual transactions
   - Detect potential fraud
   - Budget deviation alerts

5. **Savings Recommendations** (Rule-based + ML)
   - Personalized savings tips
   - Category-specific optimization
   - Emergency fund guidance

---

## 📊 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login with email/password
POST   /api/auth/refresh           Refresh access token
POST   /api/auth/logout            Logout and invalidate tokens
GET    /api/auth/google            Initiate Google OAuth
GET    /api/auth/google/callback   Google OAuth callback
GET    /api/auth/github            Initiate GitHub OAuth
GET    /api/auth/github/callback   GitHub OAuth callback
POST   /api/auth/forgot-password   Request password reset
POST   /api/auth/reset-password    Reset password with token
```

### Account Endpoints

```
GET    /api/accounts               Get all user accounts
POST   /api/accounts               Create new account
GET    /api/accounts/:id           Get account by ID
PUT    /api/accounts/:id           Update account
DELETE /api/accounts/:id           Delete account
GET    /api/accounts/summary       Get account summary
```

### Transaction Endpoints

```
GET    /api/transactions           Get all transactions
POST   /api/transactions           Create transaction
GET    /api/transactions/:id       Get transaction by ID
PUT    /api/transactions/:id       Update transaction
DELETE /api/transactions/:id       Delete transaction
POST   /api/transactions/transfer  Create account transfer
GET    /api/transactions/summary   Get spending summary
```

### AI Insights Endpoints

```
GET    /api/insights/spending-patterns         Analyze spending patterns
GET    /api/insights/forecast                  Forecast future expenses
GET    /api/insights/savings-recommendations   Get savings tips
GET    /api/insights/anomalies                 Detect unusual spending
```

Full API documentation: [API.md](docs/API.md)

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run test:ui

# E2E tests
npm run test:e2e
```

---

## 📦 Deployment

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Access at http://localhost:3000
```

### Cloud Deployment

#### Heroku
```bash
heroku create finova-app
heroku addons:create mongolab
heroku addons:create heroku-redis
git push heroku main
```

#### AWS / Azure / GCP
See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed cloud deployment guides.

---

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- ESLint configuration included
- Run `npm run lint` before committing
- Follow existing code patterns
- Add tests for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

**Mofazzal Hossain**
- GitHub: [@mofazzalhossain]
- Email: mofazzal@umail.ucc.ie

**Gordan Healy**
- GitHub: [@gordanhealy]
- Email: gordan@umail.ucc.ie

**Institution**: Munster Technological University, Ireland

---

## 🙏 Acknowledgments

- MTU School of Computer Science and IT
- Open Source Software Module Instructors
- Contributors and testers from the MTU student community
- All open source libraries and frameworks used in this project

---

## 📧 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Email: finova-support@ucc.ie
- Documentation: [docs/](docs/)

---

**Built with ❤️ in Munster, Ireland**


---

## Windows One-Click Start and EXE Build

This package includes:

- `start.bat` — starts backend and frontend automatically on Windows.
- `build-windows-exe.bat` — builds the React frontend and creates `release\Finova.exe`.
- `README_WINDOWS_INSTALL.md` — full Windows installation and packaging instructions.

For Windows setup, read `README_WINDOWS_INSTALL.md` first.
