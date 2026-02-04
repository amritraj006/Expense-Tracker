// Expense Tracker Application
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const transactionForm = document.getElementById('transaction-form');
    const editForm = document.getElementById('edit-form');
    const transactionList = document.getElementById('transaction-list');
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    const monthSelect = document.getElementById('month-select');
    const clearAllBtn = document.getElementById('clear-all');
    const exportCsvBtn = document.getElementById('export-csv');
    const editModal = document.getElementById('edit-modal');
    const closeModalBtns = document.querySelectorAll('.modal-close');
    
    // Summary Elements
    const totalBalanceEl = document.getElementById('total-balance');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const transactionCountEl = document.getElementById('transaction-count');
    const emptyMessageEl = document.getElementById('empty-message');
    
    // Report Elements
    const incomeBarEl = document.getElementById('income-bar');
    const expenseBarEl = document.getElementById('expense-bar');
    const incomeValueEl = document.getElementById('income-value');
    const expenseValueEl = document.getElementById('expense-value');
    const incomeTotalEl = document.getElementById('income-total');
    const expenseTotalEl = document.getElementById('expense-total');
    const monthlyChartEl = document.querySelector('.chart-container');
    const chartEmptyEl = document.getElementById('chart-empty');
    
    // Quick Stats Elements
    const todayStatEl = document.getElementById('today-stat');
    const weekStatEl = document.getElementById('week-stat');
    const categoryStatEl = document.getElementById('category-stat');
    const avgStatEl = document.getElementById('avg-stat');
    
    // State
    let transactions = JSON.parse(localStorage.getItem('expenseTrackerTransactions')) || [];
    let currentMonthFilter = 'all';
    let editingTransactionId = null;
    
    // Initialize
    init();
    
    function init() {
        // Set current date
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
        
        // Set current year in footer
        document.getElementById('current-year').textContent = now.getFullYear();
        
        // Set today's date as default in edit form
        document.getElementById('edit-date').value = now.toISOString().split('T')[0];
        
        // Load and display data
        updateTransactionsDisplay();
        updateSummary();
        updateReports();
        updateQuickStats();
        populateMonthSelector();
        
        // Event Listeners
        transactionForm.addEventListener('submit', addTransaction);
        editForm.addEventListener('submit', saveEditedTransaction);
        searchInput.addEventListener('input', updateTransactionsDisplay);
        filterSelect.addEventListener('change', updateTransactionsDisplay);
        monthSelect.addEventListener('change', function() {
            currentMonthFilter = this.value;
            updateTransactionsDisplay();
            updateReports();
            updateQuickStats();
        });
        clearAllBtn.addEventListener('click', clearAllTransactions);
        exportCsvBtn.addEventListener('click', exportToCSV);
        
        // Modal close buttons
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                editModal.style.display = 'none';
            });
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === editModal) {
                editModal.style.display = 'none';
            }
        });
    }
    
    // Add Transaction
    function addTransaction(e) {
        e.preventDefault();
        
        const description = document.getElementById('description').value.trim();
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        
        if (!description || isNaN(amount)) {
            alert('Please enter a valid description and amount');
            return;
        }
        
        const newTransaction = {
            id: Date.now(),
            description,
            amount,
            category,
            date: new Date().toISOString().split('T')[0]
        };
        
        transactions.unshift(newTransaction);
        saveToLocalStorage();
        
        updateTransactionsDisplay();
        updateSummary();
        updateReports();
        updateQuickStats();
        populateMonthSelector();
        
        // Reset form
        transactionForm.reset();
        document.getElementById('description').focus();
        
        // Show success message
        showNotification(`${amount > 0 ? 'Income' : 'Expense'} added successfully!`);
    }
    
    // Update Transactions Display
    function updateTransactionsDisplay() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterType = filterSelect.value;
        
        // Filter transactions
        let filteredTransactions = transactions.filter(transaction => {
            // Search filter
            const matchesSearch = transaction.description.toLowerCase().includes(searchTerm) ||
                                 transaction.category.toLowerCase().includes(searchTerm);
            
            // Type filter
            let matchesType = true;
            if (filterType === 'income') {
                matchesType = transaction.amount > 0;
            } else if (filterType === 'expense') {
                matchesType = transaction.amount < 0;
            }
            
            // Month filter
            let matchesMonth = true;
            if (currentMonthFilter !== 'all') {
                const transactionDate = new Date(transaction.date);
                const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                matchesMonth = transactionMonth === currentMonthFilter;
            }
            
            return matchesSearch && matchesType && matchesMonth;
        });
        
        // Update transaction count
        transactionCountEl.textContent = filteredTransactions.length;
        
        // Show/hide empty message
        if (filteredTransactions.length === 0) {
            emptyMessageEl.style.display = 'block';
            transactionList.innerHTML = '';
        } else {
            emptyMessageEl.style.display = 'none';
            
            // Display transactions
            transactionList.innerHTML = filteredTransactions.map(transaction => {
                const type = transaction.amount > 0 ? 'income' : 'expense';
                const typeIcon = transaction.amount > 0 ? 'fa-arrow-up' : 'fa-arrow-down';
                const formattedDate = formatDate(transaction.date);
                const formattedAmount = formatCurrency(transaction.amount);
                const category = transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1);
                
                return `
                    <div class="transaction-item ${type}" data-id="${transaction.id}">
                        <div class="transaction-icon">
                            <i class="fas ${typeIcon}"></i>
                        </div>
                        <div class="transaction-content">
                            <div class="transaction-header">
                                <span class="transaction-title">${transaction.description}</span>
                                <span class="transaction-amount">${formattedAmount}</span>
                            </div>
                            <div class="transaction-footer">
                                <span class="transaction-category">${category}</span>
                                <span class="transaction-date">${formattedDate}</span>
                            </div>
                        </div>
                        <div class="transaction-actions">
                            <button class="action-btn edit" onclick="openEditModal(${transaction.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn delete" onclick="deleteTransaction(${transaction.id})" title="Delete">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
    
    // Update Summary
    function updateSummary() {
        let totalIncome = 0;
        let totalExpense = 0;
        
        // Filter transactions by month if needed
        let filteredTransactions = transactions;
        if (currentMonthFilter !== 'all') {
            filteredTransactions = transactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                return transactionMonth === currentMonthFilter;
            });
        }
        
        filteredTransactions.forEach(transaction => {
            if (transaction.amount > 0) {
                totalIncome += transaction.amount;
            } else {
                totalExpense += Math.abs(transaction.amount);
            }
        });
        
        const totalBalance = totalIncome - totalExpense;
        
        totalBalanceEl.textContent = formatCurrency(totalBalance);
        totalIncomeEl.textContent = formatCurrency(totalIncome);
        totalExpenseEl.textContent = formatCurrency(totalExpense);
    }
    
    // Update Quick Stats
    function updateQuickStats() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        let todayExpense = 0;
        let weekExpense = 0;
        let categoryTotals = {};
        let totalExpense = 0;
        let monthCount = 0;
        let monthlyTotals = {};
        
        // Filter transactions by month if needed
        let filteredTransactions = transactions;
        if (currentMonthFilter !== 'all') {
            filteredTransactions = transactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                return transactionMonth === currentMonthFilter;
            });
        }
        
        filteredTransactions.forEach(transaction => {
            if (transaction.amount < 0) {
                const amount = Math.abs(transaction.amount);
                const date = new Date(transaction.date);
                const dateStr = date.toISOString().split('T')[0];
                const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
                
                // Today's expense
                if (dateStr === today) {
                    todayExpense += amount;
                }
                
                // This week's expense
                if (date >= oneWeekAgo) {
                    weekExpense += amount;
                }
                
                // Category totals
                if (!categoryTotals[transaction.category]) {
                    categoryTotals[transaction.category] = 0;
                }
                categoryTotals[transaction.category] += amount;
                
                // Monthly totals for average
                if (!monthlyTotals[monthKey]) {
                    monthlyTotals[monthKey] = 0;
                    monthCount++;
                }
                monthlyTotals[monthKey] += amount;
                totalExpense += amount;
            }
        });
        
        // Find top category
        let topCategory = '-';
        let maxAmount = 0;
        for (const [category, amount] of Object.entries(categoryTotals)) {
            if (amount > maxAmount) {
                maxAmount = amount;
                topCategory = category.charAt(0).toUpperCase() + category.slice(1);
            }
        }
        
        // Calculate average monthly expense
        const avgMonthly = monthCount > 0 ? totalExpense / monthCount : 0;
        
        // Update DOM
        todayStatEl.textContent = formatCurrency(todayExpense, true);
        weekStatEl.textContent = formatCurrency(weekExpense, true);
        categoryStatEl.textContent = topCategory;
        avgStatEl.textContent = formatCurrency(avgMonthly, true);
    }
    
    // Delete Transaction
    function deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            const transaction = transactions.find(t => t.id === id);
            transactions = transactions.filter(t => t.id !== id);
            saveToLocalStorage();
            
            updateTransactionsDisplay();
            updateSummary();
            updateReports();
            updateQuickStats();
            
            showNotification(`Deleted ${transaction.description} (${formatCurrency(transaction.amount)})`);
        }
    }
    
    // Open Edit Modal
    function openEditModal(id) {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;
        
        editingTransactionId = id;
        
        // Fill edit form with transaction data
        document.getElementById('edit-description').value = transaction.description;
        document.getElementById('edit-amount').value = Math.abs(transaction.amount);
        document.getElementById('edit-category').value = transaction.category;
        document.getElementById('edit-date').value = transaction.date;
        
        // Show modal
        editModal.style.display = 'flex';
    }
    
    // Save Edited Transaction
    function saveEditedTransaction(e) {
        e.preventDefault();
        
        const description = document.getElementById('edit-description').value.trim();
        const amountInput = document.getElementById('edit-amount').value;
        const category = document.getElementById('edit-category').value;
        const date = document.getElementById('edit-date').value;
        
        if (!description || !amountInput || !date) {
            alert('Please fill all fields correctly');
            return;
        }
        
        let amount = parseFloat(amountInput);
        const originalTransaction = transactions.find(t => t.id === editingTransactionId);
        
        // Preserve the sign of the original transaction
        if (originalTransaction.amount < 0 && amount > 0) {
            amount = -amount;
        }
        
        if (isNaN(amount)) {
            alert('Please enter a valid amount');
            return;
        }
        
        // Update transaction
        transactions = transactions.map(transaction => {
            if (transaction.id === editingTransactionId) {
                return { ...transaction, description, amount, category, date };
            }
            return transaction;
        });
        
        saveToLocalStorage();
        updateTransactionsDisplay();
        updateSummary();
        updateReports();
        updateQuickStats();
        populateMonthSelector();
        
        // Close modal
        editModal.style.display = 'none';
        editingTransactionId = null;
        
        showNotification('Transaction updated successfully!');
    }
    
    // Clear All Transactions
    function clearAllTransactions() {
        if (transactions.length === 0) {
            alert('No transactions to clear');
            return;
        }
        
        if (confirm('Are you sure you want to clear ALL transactions? This action cannot be undone.')) {
            transactions = [];
            saveToLocalStorage();
            updateTransactionsDisplay();
            updateSummary();
            updateReports();
            updateQuickStats();
            populateMonthSelector();
            
            showNotification('All transactions cleared!');
        }
    }
    
    // Update Reports
    function updateReports() {
        updateComparisonChart();
        updateMonthlyExpenseChart();
    }
    
    // Update Comparison Chart
    function updateComparisonChart() {
        let income = 0;
        let expense = 0;
        
        // Filter transactions by month if needed
        let filteredTransactions = transactions;
        if (currentMonthFilter !== 'all') {
            filteredTransactions = transactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                return transactionMonth === currentMonthFilter;
            });
        }
        
        filteredTransactions.forEach(transaction => {
            if (transaction.amount > 0) {
                income += transaction.amount;
            } else {
                expense += Math.abs(transaction.amount);
            }
        });
        
        // Calculate percentages for bar heights
        const total = income + expense;
        let incomePercent = 0;
        let expensePercent = 0;
        
        if (total > 0) {
            incomePercent = (income / total) * 100;
            expensePercent = (expense / total) * 100;
        }
        
        // Update bars
        incomeBarEl.style.height = `${incomePercent}%`;
        expenseBarEl.style.height = `${expensePercent}%`;
        
        // Update values
        incomeValueEl.textContent = formatCurrency(income, true);
        expenseValueEl.textContent = formatCurrency(expense, true);
        incomeTotalEl.textContent = formatCurrency(income);
        expenseTotalEl.textContent = formatCurrency(expense);
    }
    
    // Update Monthly Expense Chart
    function updateMonthlyExpenseChart() {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Group expenses by month
        const monthlyExpenses = {};
        
        // Initialize all months with zero
        const currentYear = new Date().getFullYear();
        for (let i = 0; i < 12; i++) {
            const monthKey = `${currentYear}-${String(i).padStart(2, '0')}`;
            monthlyExpenses[monthKey] = {
                year: currentYear,
                month: i,
                total: 0
            };
        }
        
        // Filter transactions by month if needed
        let filteredTransactions = transactions;
        if (currentMonthFilter !== 'all') {
            // If specific month selected, show daily breakdown
            const [year, month] = currentMonthFilter.split('-').map(Number);
            const daysInMonth = new Date(year, month, 0).getDate();
            const dailyExpenses = {};
            
            // Initialize all days
            for (let day = 1; day <= daysInMonth; day++) {
                dailyExpenses[day] = 0;
            }
            
            // Add expenses
            filteredTransactions.forEach(transaction => {
                if (transaction.amount < 0) {
                    const date = new Date(transaction.date);
                    if (date.getFullYear() === year && date.getMonth() + 1 === month) {
                        const day = date.getDate();
                        dailyExpenses[day] += Math.abs(transaction.amount);
                    }
                }
            });
            
            // Create daily chart
            const days = Object.keys(dailyExpenses).sort((a, b) => a - b);
            const maxExpense = Math.max(...Object.values(dailyExpenses));
            
            if (maxExpense === 0) {
                chartEmptyEl.style.display = 'flex';
                monthlyChartEl.innerHTML = '';
                return;
            }
            
            chartEmptyEl.style.display = 'none';
            monthlyChartEl.innerHTML = days.map(day => {
                const expense = dailyExpenses[day];
                const heightPercent = maxExpense > 0 ? (expense / maxExpense) * 100 : 0;
                
                return `
                    <div class="chart-bar">
                        <div class="bar-column" style="height: ${heightPercent}%">
                            <div class="bar-column-value">${formatCurrency(expense, true)}</div>
                        </div>
                        <div class="bar-column-label">${day}</div>
                    </div>
                `;
            }).join('');
            
            return;
        }
        
        // Group by month for "All Months" view
        filteredTransactions.forEach(transaction => {
            if (transaction.amount < 0) {
                const date = new Date(transaction.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
                
                if (!monthlyExpenses[monthKey]) {
                    monthlyExpenses[monthKey] = {
                        year: date.getFullYear(),
                        month: date.getMonth(),
                        total: 0
                    };
                }
                
                monthlyExpenses[monthKey].total += Math.abs(transaction.amount);
            }
        });
        
        // Get last 12 months
        const sortedMonths = Object.values(monthlyExpenses)
            .filter(m => m.year === currentYear)
            .sort((a, b) => a.month - b.month)
            .slice(0, 12);
        
        // Find max expense for scaling
        const maxExpense = Math.max(...sortedMonths.map(m => m.total), 1);
        
        if (maxExpense === 0) {
            chartEmptyEl.style.display = 'flex';
            monthlyChartEl.innerHTML = '';
            return;
        }
        
        chartEmptyEl.style.display = 'none';
        monthlyChartEl.innerHTML = sortedMonths.map(monthData => {
            const monthName = monthNames[monthData.month];
            const expense = monthData.total;
            const heightPercent = (expense / maxExpense) * 100;
            
            return `
                <div class="chart-bar">
                    <div class="bar-column" style="height: ${heightPercent}%">
                        <div class="bar-column-value">${formatCurrency(expense, true)}</div>
                    </div>
                    <div class="bar-column-label">${monthName}</div>
                </div>
            `;
        }).join('');
    }
    
    // Populate Month Selector
    function populateMonthSelector() {
        // Get unique months from transactions
        const monthSet = new Set();
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            monthSet.add(`${monthKey}|${monthName}`);
        });
        
        // Convert to array and sort by date (newest first)
        const monthOptions = Array.from(monthSet)
            .map(item => {
                const [key, name] = item.split('|');
                return { key, name };
            })
            .sort((a, b) => {
                const [aYear, aMonth] = a.key.split('-').map(Number);
                const [bYear, bMonth] = b.key.split('-').map(Number);
                
                if (aYear !== bYear) return bYear - aYear;
                return bMonth - aMonth;
            });
        
        // Update month select dropdown
        const currentValue = monthSelect.value;
        
        // Clear existing options except "All Months"
        monthSelect.innerHTML = '<option value="all">All Months</option>';
        
        // Add month options
        monthOptions.forEach(month => {
            const option = document.createElement('option');
            option.value = month.key;
            option.textContent = month.name;
            monthSelect.appendChild(option);
        });
        
        // Restore selected value if it still exists
        if (currentValue && Array.from(monthSelect.options).some(opt => opt.value === currentValue)) {
            monthSelect.value = currentValue;
        } else {
            monthSelect.value = 'all';
            currentMonthFilter = 'all';
        }
    }
    
    // Export to CSV
    function exportToCSV() {
        if (transactions.length === 0) {
            alert('No transactions to export');
            return;
        }
        
        // Create CSV content
        const headers = ['Date', 'Description', 'Category', 'Amount', 'Type'];
        const csvRows = [headers.join(',')];
        
        // Filter transactions by month if needed
        let filteredTransactions = transactions;
        if (currentMonthFilter !== 'all') {
            filteredTransactions = transactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                const transactionMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
                return transactionMonth === currentMonthFilter;
            });
        }
        
        filteredTransactions.forEach(transaction => {
            const type = transaction.amount > 0 ? 'Income' : 'Expense';
            const formattedDate = formatDate(transaction.date, 'csv');
            const formattedAmount = Math.abs(transaction.amount).toFixed(2);
            const category = transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1);
            
            // Escape commas and quotes in description
            const escapedDescription = transaction.description.includes(',') || transaction.description.includes('"') 
                ? `"${transaction.description.replace(/"/g, '""')}"` 
                : transaction.description;
            
            csvRows.push([
                formattedDate,
                escapedDescription,
                category,
                formattedAmount,
                type
            ].join(','));
        });
        
        const csvContent = csvRows.join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const fileName = currentMonthFilter === 'all' 
            ? `expense-tracker-${dateStr}.csv`
            : `expense-tracker-${currentMonthFilter}.csv`;
        
        a.href = url;
        a.download = fileName;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification(`Exported ${filteredTransactions.length} transactions to CSV`);
    }
    
    // Utility Functions
    function formatCurrency(amount, short = false) {
        const absAmount = Math.abs(amount);
        const formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: short ? 0 : 2
        }).format(absAmount);
        
        return amount < 0 ? `-${formatted}` : formatted;
    }
    
    function formatDate(dateString, format = 'display') {
        const date = new Date(dateString);
        
        if (format === 'csv') {
            return date.toISOString().split('T')[0];
        }
        
        const now = new Date();
        const today = now.toDateString();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString();
        
        if (date.toDateString() === today) {
            return 'Today';
        } else if (date.toDateString() === yesterday) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    }
    
    function saveToLocalStorage() {
        localStorage.setItem('expenseTrackerTransactions', JSON.stringify(transactions));
    }
    
    function showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            font-size: 14px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
        
        // Add animation styles
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Make functions available globally for onclick handlers
    window.deleteTransaction = deleteTransaction;
    window.openEditModal = openEditModal;
});