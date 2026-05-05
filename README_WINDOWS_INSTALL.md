# Finova Financial Tracker — Windows Installation Guide

This guide explains how to run Finova on Windows and how to build a Windows `.exe` version.

Finova has two parts:

- **Backend:** Node.js + Express API, runs on `http://localhost:3000`
- **Frontend:** React + Vite web app, runs on `http://localhost:5173` in development mode
- **Database:** MongoDB, either local MongoDB or MongoDB Atlas cloud database

---

## 1. Requirements

Install these before running the project:

### Required

1. **Node.js LTS**
   - Install from: <https://nodejs.org/>
   - During installation, keep **npm** selected.

2. **MongoDB**
   Choose one:
   - **Local MongoDB Community Server** on your PC, or
   - **MongoDB Atlas** cloud database connection string.

3. **Internet connection**
   - Needed the first time you run the project because `npm install` downloads dependencies.

---

## 2. Project Folder Structure

Keep the files like this:

```text
FINOVA_PROJECT/
├── start.bat
├── build-windows-exe.bat
├── README_WINDOWS_INSTALL.md
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── ...
└── frontend/
    ├── package.json
    ├── index.html
    ├── src/
    └── ...
```

Do **not** move `start.bat` or `build-windows-exe.bat` into the backend or frontend folder. They must stay in the main project root folder.

---

## 3. First-Time Setup

### Step 1 — Extract the ZIP

Extract the project ZIP anywhere, for example:

```text
C:\Users\YourName\Desktop\FINOVA_PROJECT
```

### Step 2 — Configure Backend Environment

The starter script automatically creates this file if it does not exist:

```text
backend\.env
```

It is copied from:

```text
backend\.env.example
```

Open `backend\.env` and check these values:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/finova
JWT_SECRET=change-this-to-a-long-random-secret
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

For local MongoDB, keep:

```env
MONGODB_URI=mongodb://localhost:27017/finova
```

For MongoDB Atlas, replace it with your Atlas connection string:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/finova
```

Also change `JWT_SECRET` to a long random value before sharing or deploying the app.

---

## 4. Run the Project Automatically

Double-click:

```text
start.bat
```

What it does:

1. Checks if Node.js and npm are installed.
2. Creates `backend\.env` from `.env.example` if missing.
3. Tries to start the local MongoDB Windows service if it exists.
4. Installs backend dependencies if `backend\node_modules` is missing.
5. Installs frontend dependencies if `frontend\node_modules` is missing.
6. Opens two terminal windows:
   - **Finova Backend**
   - **Finova Frontend**
7. Opens the frontend in your browser.

After it starts, open:

```text
http://localhost:5173
```

Backend health check:

```text
http://localhost:3000/health
```

---

## 5. Stop the Project

Close both terminal windows, or press:

```text
Ctrl + C
```

inside each terminal window.

---

## 6. Manual Run Commands

Use these only if you do not want to use `start.bat`.

### Backend

```bat
cd backend
npm install
npm start
```

Backend runs at:

```text
http://localhost:3000
```

### Frontend

Open a second terminal:

```bat
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

## 7. Build a Windows EXE

Double-click:

```text
build-windows-exe.bat
```

What it does:

1. Installs frontend dependencies.
2. Builds the React frontend using Vite.
3. Copies the built frontend files into `backend\public`.
4. Installs backend dependencies.
5. Installs `pkg` as a backend dev dependency.
6. Creates:

```text
release\Finova.exe
release\Start-Finova-EXE.bat
release\.env
```

To run the packaged version, double-click:

```text
release\Start-Finova-EXE.bat
```

Then open:

```text
http://localhost:3000
```

In EXE mode, the backend serves both the API and the frontend from the same address.

---

## 8. Important EXE Notes

The EXE does **not** include MongoDB. You still need one of these:

- Local MongoDB running on the same PC, or
- MongoDB Atlas connection string inside `release\.env`

If the EXE opens but the app cannot login/register or save data, check MongoDB first.

---

## 9. Common Problems and Fixes

### Problem: `node is not recognized`

Node.js is not installed or was not added to PATH.

Fix:

1. Install Node.js LTS.
2. Restart your PC.
3. Run `start.bat` again.

### Problem: MongoDB connection failed

The backend cannot connect to MongoDB.

Fix for local MongoDB:

```bat
net start MongoDB
```

Or open Windows Services and start **MongoDB Server**.

Fix for MongoDB Atlas:

1. Open `backend\.env` or `release\.env`.
2. Check `MONGODB_URI`.
3. Make sure your IP address is allowed in MongoDB Atlas Network Access.

### Problem: Port already in use

Another app is using port `3000` or `5173`.

Fix:

1. Close old Finova terminal windows.
2. Restart your PC if needed.
3. Run `start.bat` again.

### Problem: Frontend opens but API requests fail

Make sure the backend terminal says it is running on:

```text
http://localhost:3000
```

Also check `backend\.env`:

```env
CORS_ORIGIN=http://localhost:5173
```

### Problem: EXE build fails during `pkg`

Try this:

```bat
cd backend
rmdir /s /q node_modules
npm install
npm install --save-dev pkg
cd ..
build-windows-exe.bat
```

If packaging still fails because of native modules, use `start.bat`. The normal BAT version is the most reliable way to run the full development project.

---

## 10. Recommended Distribution

For normal users or classmates, share the full project folder with:

```text
start.bat
backend\
frontend\
README_WINDOWS_INSTALL.md
```

For a packaged version, share:

```text
release\Finova.exe
release\Start-Finova-EXE.bat
release\.env
README_WINDOWS_INSTALL.md
```

Remember: the packaged version still needs MongoDB.

---

## 11. Quick Start Summary

For development:

```text
Double-click start.bat
Open http://localhost:5173
```

For EXE build:

```text
Double-click build-windows-exe.bat
Double-click release\Start-Finova-EXE.bat
Open http://localhost:3000
```

---

# Added Settings and AI Feature Guide

This build now includes a new top navigation with **Dashboard**, **Settings**, and **AI Search**.

## Settings Menu

Inside the app, open **Settings** to use:

1. **Light/Dark/System Theme**
   - Choose Light mode, Dark mode, or System default.

2. **Language Selection**
   - Choose English, Bangla, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, or Arabic.

3. **Currency Selection**
   - Choose EUR, USD, GBP, BDT, INR, JPY, AUD, CAD, CHF, or CNY.
   - The dashboard amount display updates based on the selected currency symbol.

4. **Location and Timezone**
   - Save city, country, and timezone such as `Europe/Dublin` or `Asia/Dhaka`.

5. **Export CSV or PDF**
   - Export all transactions as CSV.
   - Export a simple financial summary report as PDF.

6. **Import CSV and AI Receipt Assistant**
   - Paste CSV data and import transactions.
   - Paste receipt text or upload `.txt`, `.csv`, or `.json` receipt files.
   - Finova detects likely amount, category, date, merchant/description, payment method, and confidence.

7. **Password Change**
   - Users can change their password from the Security section.

## AI Search

Open **AI Search** to ask natural-language questions about your transactions.

Examples:

```text
biggest expense
food spending
transport this month
cash payments
latest income
```

The app searches your own transaction history and returns matching transactions, totals, and smart finance signals.

## Important Note About Receipt AI

The included receipt assistant uses local rule-based AI-style detection. It does not send receipt data to any external AI provider. It works best when you paste receipt text or upload text-based receipt files.

For true camera/photo/PDF receipt scanning, the next upgrade should add OCR with a service such as Tesseract.js, Google Vision, Azure Vision, or OpenAI Vision.
