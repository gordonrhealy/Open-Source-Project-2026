# 🪙 Finova — Personal Finance Tracker

A full-stack personal finance tracker with MongoDB, JWT authentication, and rich analytics.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript, Chart.js |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT + bcrypt |

---

## 📁 Project Structure

```
finova/
├── server.js              # Main Express server
├── package.json           # Dependencies
├── .env.example           # Environment variables template
├── models/
│   ├── User.js            # User schema (bcrypt hashed passwords)
│   ├── Transaction.js     # Transaction schema
│   └── Budget.js          # Budget schema
├── routes/
│   ├── auth.js            # Register, Login, /me, Settings
│   ├── transactions.js    # CRUD + filters + summary
│   └── budgets.js         # Budget CRUD
├── middleware/
│   └── auth.js            # JWT verification middleware
└── public/
    └── index.html         # Full SPA frontend
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+ 
- MongoDB (local or MongoDB Atlas)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/finova   # or your Atlas connection string
JWT_SECRET=replace_with_a_long_random_secret
PORT=3000
```

### 3. Start the server

Development (auto-restart):
```bash
npm run dev
```

Production:
```bash
npm start
```

### 4. Open in browser
```
http://localhost:3000
```

---

## 🌐 Using MongoDB Atlas (Cloud)

1. Create a free account at [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a cluster → Get connection string
3. Replace `MONGODB_URI` in `.env`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/finova
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| PATCH | `/api/auth/settings` | Update profile |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List (with filters: type, category, from, to, search) |
| POST | `/api/transactions` | Create transaction |
| PATCH | `/api/transactions/:id` | Edit transaction |
| DELETE | `/api/transactions/:id` | Delete one |
| DELETE | `/api/transactions` | Delete all (user's) |
| GET | `/api/transactions/summary` | Aggregated stats |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | List budgets |
| POST | `/api/budgets` | Upsert budget |
| DELETE | `/api/budgets/:id` | Delete budget |

---

## ✨ Features

- **Secure Auth** — JWT tokens (7-day expiry) + bcrypt password hashing
- **Dashboard** — Income, expenses, balance, savings rate, top category, daily average, this-month snapshot
- **Add Entry** — Income & expense forms with category, date, note, recurring flag
- **Transaction History** — Search, filter by type/category/month, sort, paginated (20/page), edit & delete
- **Analytics** — Donut chart, pie chart, monthly bar chart, cumulative line chart, spending heatmap
- **Budgets** — Per-category monthly limits with live progress bars + alerts at 80% and 100%
- **Settings** — Email, currency selector (8 currencies), danger zone
- **Export CSV** — One-click export of all transactions
- **Responsive** — Works on mobile, tablet, desktop, and wide screens
- **Auto Login** — JWT persisted in localStorage, restored on reload

---

## 📜 License
MIT
