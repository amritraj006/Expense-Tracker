# 💰 Expense Tracker Web App

A clean, modern, and fully responsive **Expense Tracker** built using **HTML, CSS, and Vanilla JavaScript**.  
This project uses **DOM Manipulation** and **LocalStorage** to manage transactions and persist data even after page refresh.

---

## 🚀 Features

### ✅ Transaction Management (CRUD)
- Add income and expense transactions
- Edit existing transactions
- Delete transactions
- Clear all transactions with confirmation

### 📌 Summary Section
- Total Balance
- Total Income
- Total Expense

### 🔍 Search & Filter
- Search transactions by description
- Filter transactions:
  - All
  - Income
  - Expense

### 📊 Reports & Graphs (No Libraries)
- Monthly Expense Bar Chart (custom chart using HTML/CSS)
- Income vs Expense Comparison Graph
- Month selector to view transactions & reports for a specific month

### 📥 CSV Export
- Download all transactions as a CSV report
- CSV includes:
  - Date
  - Description
  - Amount
  - Type (Income / Expense)

### 💾 Persistent Storage
- Transactions are stored in **LocalStorage**
- Data remains saved even after refreshing or reopening the browser

---

## 🛠️ Technologies Used

- **HTML5**
- **CSS3**
- **Vanilla JavaScript (ES6+)**
- **DOM Manipulation**
- **LocalStorage**
- **CRUD Operations**
- **Form Validation**
- **Responsive UI (Flexbox/Grid)**
- **Custom Charts & Graphs (without libraries)**
- **CSV Export (Blob API)**

---

## 📂 Project StructureExpense Tracker
Expense-Tracker/ │── index.html │── style.css │── script.js │── README.md

---

## ⚙️ How to Run the Project

1. Download or clone this repository
2. Open the folder
3. Run the project by opening `index.html` in any browser

---

## 📌 How It Works

- **Income** → Enter a positive amount (example: `5000`)
- **Expense** → Enter a negative amount (example: `-300`)
- Balance is automatically calculated as:

  ---

## ✨ Future Improvements (Optional)

- Add category system (Food, Travel, Rent, Shopping, etc.)
- Add budget limit with alerts
- Add PDF export report
- Add dark mode toggle

---

## 📜 License

This project is open-source and free to use for learning and personal projects.
