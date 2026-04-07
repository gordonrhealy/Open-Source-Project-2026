# Open-Source-Project-2026
Financial Tracker Web app
Prototype Code for for web app
to visually record financial data
and display in a pie chart.
Includes login facility.
Also includes main.js and package.json, needed to make a .exe version of app
# Financial Tracker Web App

A simple, lightweight financial tracking application built as a web app and packaged into a Windows executable using Electron. It allows users to record income and expenses, view totals, and manage their personal finances in an intuitive interface.

---

## 📌 Features

- Add income and expense entries with descriptions and amounts  
- Automatic calculation of totals and balance  
- Clean, responsive UI  
- Local data storage (no external database required unless configured)  
- Packaged as a standalone `.exe` for Windows using Electron  

---

## 🚀 Tech Stack

- **Frontend:** HTML, CSS, JavaScript  
- **Backend (if applicable):** Node.js  
- **Packaging:** Electron  
- **Development Environment:** Visual Studio Code  

---

## 🛠️ Running the App Locally

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your system
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/gordonrhealy/Open-Source-Project-2026.git
   cd Open-Source-Project-2026
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start MongoDB (if it isn't already running):
   ```bash
   mongod
   ```

4. Start the backend server (in one terminal):
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:3000`.

5. Open `graph.html` in your browser, or run the Electron desktop app (in another terminal):
   ```bash
   npm start
   ```

---

## 🛠️ Building the Windows Executable Yourself

You can package the Financial Tracker into a standalone Windows `.exe` using Electron. This lets the app run on any Windows machine without needing Node.js, a browser, or development tools.

### Prerequisites
- Node.js installed on your system
- All project dependencies installed (`npm install`)
- Electron and your chosen builder configured in `package.json`

### Build Steps

1. Install all project dependencies:
   ```bash
   npm install
   ```

2. Build the executable:
   ```bash
   npm run build
   ```

> Written with [StackEdit](https://stackedit.io/).
