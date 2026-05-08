# Finova New Settings + AI Features

This version adds a modern Settings menu and premium-style finance features on top of the Windows start/EXE-ready build.

## New Features Added

### 1. Settings Menu
Open **Settings** from the top navigation inside the dashboard.

You can now control:

- **Theme:** Light mode, Dark mode, or System default.
- **Language:** English, Bangla, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Arabic.
- **Currency:** EUR, USD, GBP, BDT, INR, JPY, AUD, CAD, CHF, CNY.
- **Location:** City and country.
- **Timezone:** Example: `Europe/Dublin`, `Asia/Dhaka`, `America/New_York`.

Settings are saved in MongoDB against the logged-in user account.

### 2. Export Data
Inside **Settings > Export & Import**, users can export:

- `finova-transactions.csv`
- `finova-report.pdf`

The CSV includes all transaction rows. The PDF includes a financial summary and latest transactions.

### 3. CSV Import
Inside **Settings > Export & Import**, paste CSV data using this format:

```csv
date,type,category,description,amount,currency,notes
2026-05-05,expense,Food & Dining,Coffee,4.50,EUR,Imported
2026-05-05,income,Salary,Monthly salary,1200,EUR,Imported
```

If the category is missing, Finova tries to auto-detect it from the description.

### 4. AI Receipt Assistant
Inside **Settings > AI Receipt Assistant**, users can paste receipt text or upload `.txt`, `.csv`, or `.json` receipt files.

Example receipt text:

```text
TESCO
Date 05/05/2026
Total €24.80
Paid by card
```

Finova detects:

- Amount
- Expense category
- Description / merchant
- Date
- Payment method
- Confidence score

After review, click **Save as Expense** to add it to transactions.

Note: This is local rule-based AI-style parsing. It does not send data to OpenAI or any external AI API. For real image/PDF OCR, add an OCR service later, such as Tesseract.js, Google Vision, Azure Vision, or OpenAI Vision.

### 5. Password Change
Inside **Settings > Security**, users can change their password securely by entering:

- Current password
- New password

The backend validates the old password and hashes the new password before saving.

### 6. AI Search Command Center
Open **AI Search** from the top navigation.

Users can ask natural language questions like:

- `biggest expense`
- `food spending`
- `transport this month`
- `cash payments`
- `latest income`
- `subscriptions`

Finova searches the logged-in user's own transactions and returns matching results with totals.

### 7. Premium Signals
The AI Search page also shows modern product-style finance signals:

- Cashflow Health
- Runway Trend
- Average Expense
- Transactions Analysed

These make the app feel closer to a premium personal finance product.

## New Backend API Routes

The server now includes these additional routes:

- `GET /api/settings`
- `PUT /api/settings`
- `POST /api/auth/change-password`
- `GET /api/export/csv`
- `GET /api/export/pdf`
- `POST /api/import/csv`
- `POST /api/receipts/analyze`
- `POST /api/receipts/save`

## How to Run

### Development Mode

```bat
start.bat
```

This starts:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

### Build Windows EXE

```bat
build-windows-exe.bat
```

The generated EXE appears in:

```text
release\Finova.exe
```

MongoDB is still required on the computer that runs Finova.

## Recommended Future Upgrades

For a more advanced, investor-grade product, add these later:

1. Real OCR for receipt image/PDF scanning.
2. Bank account sync using Plaid, TrueLayer, Salt Edge, or local bank APIs.
3. AI monthly financial report generation.
4. Recurring bill detection.
5. Spending anomaly alerts.
6. Multi-user team/family finance spaces.
7. Cloud backup and encrypted sync.
8. Mobile app companion.


## Added in the Modern Product Upgrade

A new **Smart Hub** tab has been added with forecasted spending, projected savings, recurring payment detection, budget pressure alerts, anomaly detection, category momentum, and local AI-style financial recommendations. See `README_MODERN_PRODUCT_FEATURES.md` for details.
