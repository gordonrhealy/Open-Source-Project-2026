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

## 🛠️ Running the Web App (Development Mode)

To run the project as a web app:

```bash
git clone <https://github.com/gordonrhealy/Open-Source-Project-2026.git>
cd (File or Folder)
npm install
npm start


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

2. npm run build

3. npx electron-builder

> Written with [StackEdit](https://stackedit.io/).
