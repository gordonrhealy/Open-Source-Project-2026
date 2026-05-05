# 📦 FINOVA - COMPLETE PROJECT CODE
## Full-Stack Financial Management Platform

**Developers:** Mofazzal Hossain & Gordan Healy  
**Institution:** Munster Technological University, Ireland  
**Version:** 3.0.0 - Production Ready

---

## 🎯 WHAT IS THIS PACKAGE?

This is the complete, production-ready source code for Finova - a comprehensive personal finance management platform. Everything you need to run, test, and deploy the application is included in this package.

---

## 📁 PACKAGE CONTENTS

```
1-COMPLETE_PROJECT_CODE/
├── backend/                 # Node.js Express API Server
│   ├── server.js           # Main application entry point
│   ├── package.json        # Dependencies and scripts
│   ├── .env.example        # Environment configuration template
│   ├── config/
│   │   └── passport.js     # OAuth 2.0 strategies (Google, GitHub)
│   ├── models/
│   │   ├── User.js         # User schema with OAuth, 2FA, preferences
│   │   ├── Account.js      # Multi-account model (7 types)
│   │   ├── Transaction.js  # Transaction model with transfers
│   │   ├── Budget.js       # Budget tracking model
│   │   └── Goal.js         # Savings goals model
│   └── routes/
│       ├── auth.js         # Authentication endpoints
│       ├── accounts.js     # Account management
│       ├── transactions.js # Transaction CRUD
│       ├── budgets.js      # Budget endpoints
│       ├── goals.js        # Goal management
│       ├── insights.js     # AI-powered insights
│       └── [7 more routes] # Analytics, receipts, import/export, etc.
│
├── frontend/               # React Application
│   ├── package.json       # Frontend dependencies
│   └── src/
│       ├── components/    # React components
│       │   └── Dashboard.jsx
│       └── services/      # API service layer
│           └── api.js
│
├── README.md              # Comprehensive project documentation
├── LICENSE                # MIT License
├── PROJECT_SUMMARY.md     # Technical overview
└── START_HERE.md          # This file

```

---

## 🚀 QUICK START GUIDE

### Prerequisites

Before you begin, ensure you have:
- **Node.js** v18.0.0 or higher ([Download](https://nodejs.org/))
- **MongoDB** v6.0 or higher ([Download](https://www.mongodb.com/try/download/community))
- **Redis** v7.0 or higher ([Download](https://redis.io/download))
- **npm** or **yarn** package manager
- **Git** for version control

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

This will install approximately 30 packages including:
- Express.js (web framework)
- Mongoose (MongoDB ODM)
- Passport (OAuth authentication)
- Redis client
- JWT for tokens
- bcrypt for password hashing
- Winston for logging

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/finova
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-random-secret-key-change-this

# OAuth (Optional - for Google/GitHub login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Step 3: Start MongoDB and Redis

**MongoDB:**
```bash
# macOS (with Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Redis:**
```bash
# macOS (with Homebrew)
brew services start redis

# Linux
sudo systemctl start redis

# Windows
redis-server
```

### Step 4: Start the Backend

```bash
cd backend
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════════════════════╗
║                   FINOVA BACKEND SERVER                       ║
║          Comprehensive Financial Management Platform          ║
║                                                               ║
║  Version: 3.0.0                                              ║
║  Port: 3000                                                  ║
║  Developers: Mofazzal Hossain & Gordan Healy                 ║
║  Location: Munster Technological University, Ireland         ║
╚═══════════════════════════════════════════════════════════════╝
```

### Step 5: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 6: Start the Frontend

```bash
npm run dev
```

Access the application at `http://localhost:5173`

---

## 🔑 GETTING OAUTH CREDENTIALS (OPTIONAL)

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
7. Copy Client ID and Client Secret to `.env`

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: Finova
   - Homepage URL: `http://localhost:5173`
   - Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
4. Copy Client ID and Client Secret to `.env`

---

## 📊 TESTING THE APPLICATION

### Backend API Tests

```bash
cd backend
npm test
```

### Test User Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@mtu.ie",
    "password": "SecurePassword123"
  }'
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@mtu.ie",
    "password": "SecurePassword123"
  }'
```

---

## 🏗️ PROJECT ARCHITECTURE

### Backend Architecture

```
Client Request
     ↓
Express Middleware (Helmet, CORS, Rate Limiting)
     ↓
Passport Authentication (JWT / OAuth)
     ↓
Route Handlers (auth, accounts, transactions, etc.)
     ↓
Business Logic Layer
     ↓
MongoDB Models (Mongoose ODM)
     ↓
Database (MongoDB) + Cache (Redis)
```

### Key Technologies

**Backend:**
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - Object modeling for MongoDB
- **Redis** - Caching and session management
- **Passport.js** - Authentication middleware
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing
- **Winston** - Logging

**Frontend:**
- **React 18** - UI library
- **Vite** - Build tool
- **Redux Toolkit** - State management
- **TailwindCSS** - Styling
- **Chart.js** - Data visualization
- **Axios** - HTTP client

---

## 🔐 SECURITY FEATURES

✅ **Password Security**
- bcrypt hashing with cost factor 12
- Minimum 8 character requirement
- Password change tracking

✅ **Authentication**
- JWT with 15-minute expiration
- Refresh token rotation
- OAuth 2.0 with Google and GitHub
- PKCE for mobile clients

✅ **Rate Limiting**
- 100 requests per 15 minutes (general)
- 20 requests per 15 minutes (auth endpoints)

✅ **Session Management**
- Redis-based session storage
- Automatic session expiration
- Device tracking

✅ **Account Security**
- Account lockout after 5 failed login attempts
- 2-hour lockout duration
- Two-factor authentication support
- Biometric authentication (mobile)

---

## 📱 FEATURES OVERVIEW

### Core Features

1. **Multi-Account Support**
   - Checking accounts
   - Savings accounts
   - Credit cards
   - Cash tracking
   - Investment accounts
   - Loans
   - Custom accounts

2. **Transaction Management**
   - Income and expense tracking
   - Account-to-account transfers
   - Recurring transactions
   - Receipt attachments
   - CSV/Excel import
   - Advanced filtering and search

3. **Budgeting**
   - Category-based budgets
   - Monthly, weekly, quarterly, yearly periods
   - Real-time progress tracking
   - Alert thresholds (80%, 100%)
   - Budget rollover

4. **Savings Goals**
   - Target amount and date
   - Progress tracking
   - Milestones
   - Auto-contributions
   - Goal sharing (optional)

5. **AI-Powered Insights**
   - Spending pattern analysis (K-means clustering)
   - Expense forecasting (LSTM neural networks)
   - Anomaly detection
   - Personalized recommendations
   - Auto-categorization (NLP)

6. **Analytics**
   - Interactive dashboards
   - Multiple chart types
   - Spending trends
   - Income vs expense comparisons
   - Net worth tracking
   - Custom date ranges

---

## 📚 API DOCUMENTATION

### Authentication Endpoints

```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login with email/password
GET    /api/auth/google            Initiate Google OAuth
GET    /api/auth/google/callback   Google OAuth callback
GET    /api/auth/github            Initiate GitHub OAuth
GET    /api/auth/github/callback   GitHub OAuth callback
GET    /api/auth/me                Get current user
POST   /api/auth/logout            Logout user
```

### Account Endpoints

```
GET    /api/accounts               Get all accounts
POST   /api/accounts               Create account
GET    /api/accounts/:id           Get specific account
PUT    /api/accounts/:id           Update account
DELETE /api/accounts/:id           Delete account
GET    /api/accounts/summary       Get account summary
```

### Transaction Endpoints

```
GET    /api/transactions           Get all transactions
POST   /api/transactions           Create transaction
GET    /api/transactions/:id       Get specific transaction
PUT    /api/transactions/:id       Update transaction
DELETE /api/transactions/:id       Delete transaction
POST   /api/transactions/transfer  Create transfer
```

### AI Insights Endpoints

```
GET    /api/insights/spending-patterns      Analyze spending patterns
GET    /api/insights/forecast               Forecast future expenses
GET    /api/insights/savings-recommendations Get savings tips
GET    /api/insights/anomalies              Detect unusual transactions
```

---

## 🧪 DEVELOPMENT TIPS

### Running in Development Mode

```bash
# Backend with auto-reload
cd backend
npm run dev

# Frontend with hot module replacement
cd frontend
npm run dev
```

### Debugging

Enable debug logging in `.env`:
```env
DEBUG=true
LOG_LEVEL=debug
```

### Database Management

```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/finova

# View all users
db.users.find()

# View all transactions
db.transactions.find()

# Clear all data (CAUTION!)
db.dropDatabase()
```

### Redis Management

```bash
# Connect to Redis
redis-cli

# View all keys
KEYS *

# Get specific value
GET key_name

# Clear all data (CAUTION!)
FLUSHALL
```

---

## 📦 DEPLOYMENT OPTIONS

### Option 1: Heroku

```bash
heroku create finova-app
heroku addons:create mongolab
heroku addons:create heroku-redis
git push heroku main
```

### Option 2: Docker

```bash
docker-compose up -d
```

### Option 3: AWS / Azure / GCP

See deployment guides in `README.md`

---

## 🐛 TROUBLESHOOTING

### MongoDB Connection Failed

```
Error: MongoNetworkError: connect ECONNREFUSED
```

**Solution:** Ensure MongoDB is running
```bash
sudo systemctl start mongod
```

### Redis Connection Failed

```
Error: Redis connection refused
```

**Solution:** Start Redis server
```bash
redis-server
```

### Port Already in Use

```
Error: Port 3000 is already in use
```

**Solution:** Change port in `.env` or kill the process
```bash
lsof -ti:3000 | xargs kill -9
```

### OAuth Callback Fails

```
Error: redirect_uri_mismatch
```

**Solution:** Ensure callback URLs in Google/GitHub settings match exactly

---

## 📞 SUPPORT

**Developers:**
- Mofazzal Hossain - Munster Technological University
- Gordan Healy - Munster Technological University

**Location:** Munster, Ireland

**Documentation:** See `README.md` for comprehensive guide

---

## 📄 LICENSE

MIT License - See `LICENSE` file

---

**🎉 You're all set! Start building amazing features on Finova!**

**Built with ❤️ at Munster Technological University, Ireland**
