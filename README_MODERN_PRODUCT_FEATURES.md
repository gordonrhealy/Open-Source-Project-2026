# Finova Modern Product Upgrade

This version keeps the Settings features you requested and adds a new **Smart Hub** that makes the app feel closer to a modern consumer-finance product.

## Are the previous Settings features relevant?

Yes, but they are baseline features. A polished finance app should have dark mode, language, currency, timezone, export/import, receipt import, and password change. These are necessary for usability and trust, but they do not make the product feel premium by themselves.

The new features below add the premium layer: automation, prediction, alerts, and intelligent discovery.

## Newly Added Features

### 1. Smart Hub

A new top navigation tab named **Smart Hub** was added.

It includes:

- Forecasted month-end expense
- Projected savings
- Daily expense burn rate
- Total smart alerts
- AI Financial Copilot recommendations
- Recurring payment detector
- Budget pressure alerts
- Unusual transaction/anomaly detection
- Category momentum comparison

### 2. Forecast Engine

The backend now calculates your current monthly income, current expenses, average daily spending, projected month-end expense, and projected savings.

This helps the user answer:

- “Will I overspend this month?”
- “How much am I likely to save?”
- “Is my daily spending pace safe?”

### 3. Recurring Payment Detector

Finova now scans the last 90 days of expenses and detects repeating patterns such as:

- Subscriptions
- Rent
- Utilities
- Recurring transport cost
- Repeated card/wallet payments

The detector estimates:

- Frequency: weekly, biweekly, monthly, quarterly, or yearly
- Median amount
- Next expected date
- Confidence score

### 4. Smart Alerts

Finova now creates alert cards for:

- Budgets reaching 70% or higher usage
- Budgets over 100%
- Transactions that are unusually high compared with the user's normal category spending

### 5. Category Momentum

The Smart Hub compares this month against the previous month and shows which categories are increasing or decreasing fastest.

This helps users quickly identify lifestyle creep and spending behavior changes.

### 6. AI Financial Copilot

The app now generates local AI-style recommendations based on actual financial activity, such as:

- Projected overspending
- Budget pressure
- Recurring payments
- Unusual expenses
- Largest current expense

This works without requiring an external AI API key.

## Updated Files

### Frontend

- `frontend/src/components/Dashboard.jsx`
  - Added Smart Hub tab
  - Added forecast cards
  - Added recurring detector UI
  - Added smart alert cards
  - Added category momentum cards
  - Added AI Financial Copilot section

- `frontend/src/services/api.js`
  - Added `insightsApi.getSmart()`

### Backend

- `backend/routes/insights.js`
  - Replaced placeholder route with real smart insights logic
  - Added forecasting
  - Added recurring detection
  - Added anomaly detection
  - Added budget alerts
  - Added category momentum

## How to Use

1. Start MongoDB.
2. Run the app using:

```bat
start.bat
```

3. Login or register.
4. Add income, expenses, and budgets.
5. Open the **Smart Hub** tab.

The Smart Hub becomes more useful as more transactions are added.

## Important Notes

- The current AI features are rule-based/local intelligence, not connected to paid AI APIs.
- Receipt detection currently works best with pasted receipt text or text-like receipt files.
- Image receipt OCR would require adding an OCR service such as Tesseract, Google Vision, Azure Vision, or OpenAI vision APIs.
- Bank sync is not included yet because it requires financial API provider integration and compliance work.

## Recommended Future Premium Features

These are good next-step features if you want to make Finova feel even more like a high-end product:

1. Bank account sync through Plaid, TrueLayer, Salt Edge, or Nordigen/GoCardless Bank Account Data.
2. Real OCR from receipt images and PDFs.
3. Goal-based savings planner.
4. Shared family/team wallet.
5. Monthly AI report email.
6. Spending heatmap calendar.
7. Subscription cancellation tracker.
8. Predictive cashflow chart.
9. Credit/debt payoff planner.
10. Mobile app with offline-first sync.
