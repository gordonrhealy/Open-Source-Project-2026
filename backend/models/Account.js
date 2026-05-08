// Account Model - Multi-Account Support
// Finova Backend - Munster, Ireland

const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Account Details
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  type: {
    type: String,
    required: true,
    enum: ['checking', 'savings', 'credit', 'cash', 'investment', 'loan', 'other'],
    default: 'checking'
  },
  currency: {
    type: String,
    required: true,
    default: 'EUR'
  },

  // Balance Tracking
  balance: {
    current: {
      type: Number,
      default: 0,
      required: true
    },
    available: {
      type: Number, // Available balance (current - pending)
      default: 0
    },
    pending: {
      type: Number, // Pending transactions
      default: 0
    }
  },

  // Initial Setup
  initialBalance: {
    type: Number,
    default: 0,
    required: true
  },
  initialBalanceDate: {
    type: Date,
    default: Date.now
  },

  // Account Metadata
  institutionName: String, // Bank/Credit Card company name
  accountNumber: {
    last4: String, // Last 4 digits only (for security)
    masked: String // e.g., "****1234"
  },
  icon: {
    type: String,
    default: 'wallet'
  },
  color: {
    type: String,
    default: '#3B82F6'
  },

  // Features & Settings
  settings: {
    includeInTotals: {
      type: Boolean,
      default: true
    },
    excludeFromBudgets: {
      type: Boolean,
      default: false
    },
    hideBalance: {
      type: Boolean,
      default: false
    },
    lowBalanceAlert: {
      enabled: { type: Boolean, default: false },
      threshold: { type: Number, default: 100 }
    },
    overdraftProtection: {
      enabled: { type: Boolean, default: false },
      limit: { type: Number, default: 0 }
    }
  },

  // Credit Account Specific
  creditLimit: {
    type: Number,
    default: null
  },
  creditUtilization: {
    type: Number, // Percentage
    default: 0
  },
  paymentDueDate: Date,
  minimumPayment: Number,
  apr: Number, // Annual Percentage Rate

  // Investment Account Specific
  investmentDetails: {
    broker: String,
    accountType: String, // IRA, 401k, Brokerage, etc.
    holdings: [{
      symbol: String,
      name: String,
      quantity: Number,
      costBasis: Number,
      currentValue: Number,
      lastUpdated: Date
    }]
  },

  // Auto-sync (for future bank integration)
  autoSync: {
    enabled: { type: Boolean, default: false },
    provider: String,
    accountId: String,
    lastSynced: Date,
    syncFrequency: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'manual'],
      default: 'manual'
    }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isClosed: {
    type: Boolean,
    default: false
  },
  closedDate: Date,

  // Notes
  notes: String,

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastTransactionDate: Date
}, {
  timestamps: true
});

// Indexes
accountSchema.index({ user: 1, createdAt: -1 });
accountSchema.index({ user: 1, type: 1 });
accountSchema.index({ user: 1, isActive: 1 });

// Virtual for total transactions
accountSchema.virtual('transactions', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'account'
});

// Method to update balance
accountSchema.methods.updateBalance = async function(amount, type = 'current') {
  if (type === 'current') {
    this.balance.current += amount;
  } else if (type === 'available') {
    this.balance.available += amount;
  } else if (type === 'pending') {
    this.balance.pending += amount;
  }

  // Update credit utilization for credit cards
  if (this.type === 'credit' && this.creditLimit) {
    const usedCredit = this.creditLimit - this.balance.current;
    this.creditUtilization = (usedCredit / this.creditLimit) * 100;
  }

  this.lastTransactionDate = Date.now();
  return this.save();
};

// Method to calculate available balance
accountSchema.methods.calculateAvailableBalance = function() {
  return this.balance.current - this.balance.pending;
};

// Pre-save middleware
accountSchema.pre('save', function(next) {
  // Calculate available balance
  this.balance.available = this.calculateAvailableBalance();
  
  // Update credit utilization for credit accounts
  if (this.type === 'credit' && this.creditLimit) {
    const usedCredit = this.creditLimit - this.balance.current;
    this.creditUtilization = Math.max(0, (usedCredit / this.creditLimit) * 100);
  }
  
  next();
});

// Static method to get user's total net worth
accountSchema.statics.calculateNetWorth = async function(userId) {
  const accounts = await this.find({ 
    user: userId, 
    isActive: true,
    'settings.includeInTotals': true
  });

  return accounts.reduce((total, account) => {
    if (account.type === 'credit' || account.type === 'loan') {
      return total - Math.abs(account.balance.current);
    }
    return total + account.balance.current;
  }, 0);
};

// Static method to get account summary
accountSchema.statics.getSummary = async function(userId) {
  const accounts = await this.find({ user: userId, isActive: true });

  const summary = {
    totalAccounts: accounts.length,
    checking: 0,
    savings: 0,
    credit: 0,
    cash: 0,
    investment: 0,
    netWorth: 0,
    totalAssets: 0,
    totalLiabilities: 0
  };

  accounts.forEach(account => {
    const balance = account.balance.current;

    if (account.type === 'credit' || account.type === 'loan') {
      summary.totalLiabilities += Math.abs(balance);
      summary.credit += Math.abs(balance);
    } else {
      summary.totalAssets += balance;
      if (account.type === 'checking') summary.checking += balance;
      else if (account.type === 'savings') summary.savings += balance;
      else if (account.type === 'cash') summary.cash += balance;
      else if (account.type === 'investment') summary.investment += balance;
    }
  });

  summary.netWorth = summary.totalAssets - summary.totalLiabilities;

  return summary;
};

module.exports = mongoose.model('Account', accountSchema);
