# 🚀 HOW TO RUN FINOVA PROJECT
## Step-by-Step Installation Guide

**Project:** Finova - Personal Finance Tracker  
**Developers:** Mofazzal Hossain & Gordan Healy  
**University:** Munster Technological University, Ireland

---

## 📋 PREREQUISITES

Before starting, install these on your computer:

### 1. Node.js (Required)
- **Download:** https://nodejs.org/
- **Version needed:** 18.0.0 or higher
- **Test installation:** Open terminal/command prompt and type:
  ```bash
  node --version
  ```
  Should show: v18.0.0 or higher

### 2. MongoDB (Required)
- **Download:** https://www.mongodb.com/try/download/community
- **OR use MongoDB Atlas (cloud):** https://www.mongodb.com/cloud/atlas
- **Test installation:**
  ```bash
  mongod --version
  ```

### 3. Redis (Required)
- **Windows:** Download from https://github.com/microsoftarchive/redis/releases
- **macOS:** 
  ```bash
  brew install redis
  ```
- **Linux:** 
  ```bash
  sudo apt-get install redis-server
  ```
- **Test installation:**
  ```bash
  redis-cli --version
  ```

### 4. Git (Optional, for version control)
- **Download:** https://git-scm.com/downloads

---

## 🔧 INSTALLATION STEPS

### Step 1: Extract the ZIP File
1. Extract `FINOVA_PROJECT_CODE.zip` to your desired location
2. You should see folders: `backend/` and `frontend/`

### Step 2: Backend Setup

#### 2.1 Navigate to Backend Folder
```bash
cd backend
```

#### 2.2 Install Dependencies
```bash
npm install
```

This will install all required packages. Wait 2-5 minutes for completion.

**You should see:**
- ✓ packages installed
- No error messages

#### 2.3 Configure Environment Variables
```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

#### 2.4 Edit .env File
Open `.env` in any text editor (Notepad, VS Code, etc.) and update:

```env
# Basic Configuration (REQUIRED)
NODE_ENV=development
PORT=3000

# Database (REQUIRED)
MONGODB_URI=mongodb://localhost:27017/finova
REDIS_URL=redis://localhost:6379

# Security (REQUIRED - Change this!)
JWT_SECRET=change-this-to-random-string-mtu-finova-2026
JWT_EXPIRE=7d

# OAuth (OPTIONAL - for Google/GitHub login)
# Leave empty if not using OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# Frontend URL
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

**IMPORTANT:** Change `JWT_SECRET` to any random string for security!

### Step 3: Start MongoDB

#### Option A: Local MongoDB
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

#### Option B: MongoDB Atlas (Cloud)
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env` with your connection string

### Step 4: Start Redis

```bash
# Windows
redis-server

# macOS
brew services start redis

# Linux
sudo systemctl start redis
```

### Step 5: Start Backend Server

```bash
# Make sure you're in backend folder
cd backend

# Start the server
npm run dev
```

**You should see:**
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

MongoDB Connected - Finova Database
Redis Client Connected
```

**✅ Backend is running at:** http://localhost:3000

### Step 6: Frontend Setup (New Terminal)

Open a **NEW terminal/command prompt** (keep backend running)

#### 6.1 Navigate to Frontend Folder
```bash
cd frontend
```

#### 6.2 Install Dependencies
```bash
npm install
```

Wait 2-5 minutes for completion.

#### 6.3 Start Frontend Server
```bash
npm run dev
```

**You should see:**
```
  VITE v5.0.10  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**✅ Frontend is running at:** http://localhost:5173

### Step 7: Access the Application

1. Open your web browser
2. Go to: **http://localhost:5173**
3. You should see Finova login/register page

---

## 🎉 SUCCESS! YOUR APP IS RUNNING!

You should now see:
- **Backend:** Running on http://localhost:3000
- **Frontend:** Running on http://localhost:5173

---

## 🧪 TEST THE APPLICATION

### Test 1: Create an Account

1. Go to http://localhost:5173
2. Click "Register" or "Sign Up"
3. Fill in:
   - Username: testuser
   - Email: test@mtu.ie
   - Password: SecurePass123
4. Click "Create Account"

### Test 2: Login

1. Login with your created account
2. You should see the dashboard

### Test 3: Add an Account

1. Click "Accounts" in menu
2. Click "Add Account"
3. Fill in:
   - Name: My Checking Account
   - Type: Checking
   - Initial Balance: 1000
4. Save

### Test 4: Add a Transaction

1. Click "Transactions" in menu
2. Click "Add Transaction"
3. Fill in:
   - Type: Expense
   - Amount: 50
   - Category: Food & Dining
   - Description: Grocery shopping
   - Date: Today
4. Save

---

## 🔧 TROUBLESHOOTING

### Problem: "Port 3000 already in use"

**Solution:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

OR change port in `.env`:
```env
PORT=3001
```

### Problem: "Cannot connect to MongoDB"

**Solutions:**
1. Check MongoDB is running:
   ```bash
   # Test connection
   mongo
   ```

2. Check MongoDB status:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS
   brew services list
   
   # Linux
   sudo systemctl status mongod
   ```

3. Use MongoDB Atlas (cloud) instead

### Problem: "Redis connection refused"

**Solutions:**
1. Start Redis:
   ```bash
   # Windows
   redis-server
   
   # macOS
   brew services start redis
   
   # Linux
   sudo systemctl start redis
   ```

2. Check Redis is running:
   ```bash
   redis-cli ping
   ```
   Should return: `PONG`

### Problem: "Module not found" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Problem: Frontend shows blank page

**Solutions:**
1. Check browser console (F12) for errors
2. Ensure backend is running
3. Check CORS_ORIGIN in .env matches frontend URL
4. Clear browser cache (Ctrl+Shift+Delete)

---

## 📱 OPTIONAL: OAuth Setup (Google/GitHub Login)

### Google OAuth Setup

1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
7. Copy Client ID and Client Secret
8. Add to `.env`:
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```
9. Restart backend server

### GitHub OAuth Setup

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: Finova
   - Homepage URL: http://localhost:5173
   - Authorization callback URL: http://localhost:3000/api/auth/github/callback
4. Copy Client ID and Client Secret
5. Add to `.env`:
   ```env
   GITHUB_CLIENT_ID=your-client-id-here
   GITHUB_CLIENT_SECRET=your-client-secret-here
   ```
6. Restart backend server

---

## 🚀 PRODUCTION DEPLOYMENT

### Deploy to Heroku

```bash
# Install Heroku CLI
# Download from: https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create app
heroku create finova-app

# Add MongoDB
heroku addons:create mongolab

# Add Redis
heroku addons:create heroku-redis

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Open app
heroku open
```

### Deploy to AWS/Azure/GCP
See full deployment guide in `README.md`

---

## 📊 PROJECT STRUCTURE

```
backend/
├── server.js              # Main application entry
├── package.json           # Dependencies
├── .env.example           # Environment template
├── .env                   # Your configuration (DO NOT COMMIT)
├── config/
│   └── passport.js       # OAuth configuration
├── models/
│   ├── User.js           # User schema
│   ├── Account.js        # Account schema
│   ├── Transaction.js    # Transaction schema
│   ├── Budget.js         # Budget schema
│   └── Goal.js           # Goal schema
└── routes/
    ├── auth.js           # Authentication routes
    ├── accounts.js       # Account routes
    ├── transactions.js   # Transaction routes
    ├── insights.js       # AI insights routes
    └── ... (12 total)

frontend/
├── package.json          # Dependencies
├── src/
│   ├── components/       # React components
│   └── services/         # API services
└── ...
```

---

## 🎓 NEED HELP?

**Developers:**
- Mofazzal Hossain - Munster Technological University
- Gordan Healy - Munster Technological University

**Documentation:**
- Full README.md in project root
- API documentation in docs/
- Technical guide in PROJECT_SUMMARY.md

---

## ✅ CHECKLIST

Before running:
- [ ] Node.js installed (v18+)
- [ ] MongoDB installed and running
- [ ] Redis installed and running
- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] JWT_SECRET changed from default

Running:
- [ ] Backend server running (port 3000)
- [ ] Frontend server running (port 5173)
- [ ] Can access http://localhost:5173
- [ ] Can register new account
- [ ] Can login successfully

---

## 🎉 YOU'RE READY TO GO!

Your Finova financial tracker is now running!

**What to do next:**
1. Explore the dashboard
2. Add accounts
3. Track transactions
4. Set budgets
5. Create savings goals
6. View AI insights

**Built at Munster Technological University, Ireland 🇮🇪**
