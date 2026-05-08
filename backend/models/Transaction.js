// Transaction Model - Comprehensive with Transfers and Receipts
// Finova Backend - Munster, Ireland

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true
  },

  // Transaction Details
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense', 'transfer'],
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be greater than zero']
  },
  currency: {
    type: String,
    default: 'EUR'
  },

  // Categorization
  category: {
    type: String,
    required: true,
    index: true
  },
  subcategory: String,
  tags: [String],

  // Description
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  notes: {
    type: String,
    maxlength: 500
  },

  // Merchant Information
  merchant: {
    name: String,
    location: String,
    category: String
  },

  // Date & Time
  date: {
    type: String, // YYYY-MM-DD format for consistent timezone handling
    required: true,
    index: true
  },
  time: {
    type: String, // HH:mm format
    default: '12:00'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Transfer Specific
  isTransfer: {
    type: Boolean,
    default: false,
    index: true
  },
  transferDetails: {
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    },
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    },
    linkedTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    },
    fee: {
      type: Number,
      default: 0
    }
  },

  // Recurring Transaction
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false,
      index: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
    },
    nextDate: String, // YYYY-MM-DD
    endDate: String, // YYYY-MM-DD (optional)
    lastGenerated: Date,
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction'
    }
  },

  // Receipt/Attachment
  receipts: [{
    url: String,
    filename: String,
    size: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    ocrData: {
      extractedText: String,
      merchantName: String,
      totalAmount: Number,
      date: String,
      confidence: Number
    }
  }],

  // Payment Method
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'check', 'digital_wallet', 'other'],
    default: 'card'
  },

  // Budget Tracking
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget'
  },

  // Status
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled', 'failed'],
    default: 'completed',
    index: true
  },
  isPending: {
    type: Boolean,
    default: false
  },
  clearedDate: Date,

  // AI/ML Features
  aiCategorized: {
    type: Boolean,
    default: false
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  isAnomaly: {
    type: Boolean,
    default: false
  },
  anomalyScore: Number,

  // Import/Sync
  importSource: {
    type: String,
    enum: ['manual', 'csv', 'bank_sync', 'api', 'receipt_ocr'],
    default: 'manual'
  },
  externalId: String, // ID from bank/import source
  importedAt: Date,

  // Metadata
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  modifiedBy: String // Track who made changes
}, {
  timestamps: true
});

// Compound indexes for common queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, account: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, date: -1 });
transactionSchema.index({ user: 1, timestamp: -1 });
transactionSchema.index({ 'recurring.isRecurring': 1, 'recurring.nextDate': 1 });

// Pre-save middleware
transactionSchema.pre('save', function(next) {
  // Set isTransfer flag based on transferDetails
  if (this.transferDetails && (this.transferDetails.toAccount || this.transferDetails.fromAccount)) {
    this.isTransfer = true;
    this.type = 'transfer';
  }

  // Ensure timestamp matches date and time
  if (this.date && this.time) {
    this.timestamp = new Date(`${this.date}T${this.time}:00`);
  }

  next();
});

// Method to create matching transfer transaction
transactionSchema.methods.createMatchingTransfer = async function() {
  if (!this.isTransfer || !this.transferDetails.toAccount) {
    throw new Error('Not a valid transfer transaction');
  }

  const Transaction = mongoose.model('Transaction');
  
  const matchingTransaction = new Transaction({
    user: this.user,
    account: this.transferDetails.toAccount,
    type: 'transfer',
    amount: this.amount,
    currency: this.currency,
    category: 'Transfer',
    description: `Transfer from ${this.account}`,
    date: this.date,
    time: this.time,
    timestamp: this.timestamp,
    isTransfer: true,
    transferDetails: {
      fromAccount: this.account,
      toAccount: this.transferDetails.toAccount,
      linkedTransaction: this._id,
      fee: this.transferDetails.fee || 0
    },
    status: this.status,
    importSource: this.importSource
  });

  await matchingTransaction.save();
  
  // Link back to this transaction
  this.transferDetails.linkedTransaction = matchingTransaction._id;
  await this.save();

  return matchingTransaction;
};

// Static method to get spending by category
transactionSchema.statics.getSpendingByCategory = async function(userId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: 'expense',
        date: { $gte: startDate, $lte: endDate },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    },
    {
      $sort: { total: -1 }
    }
  ];

  return this.aggregate(pipeline);
};

// Static method to get monthly summary
transactionSchema.statics.getMonthlySummary = async function(userId, year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

  const pipeline = [
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        isDeleted: false,
        type: { $ne: 'transfer' }
      }
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ];

  const results = await this.aggregate(pipeline);
  
  const summary = {
    income: 0,
    expense: 0,
    net: 0,
    incomeCount: 0,
    expenseCount: 0
  };

  results.forEach(item => {
    if (item._id === 'income') {
      summary.income = item.total;
      summary.incomeCount = item.count;
    } else if (item._id === 'expense') {
      summary.expense = item.total;
      summary.expenseCount = item.count;
    }
  });

  summary.net = summary.income - summary.expense;

  return summary;
};

// Static method to get daily spending average
transactionSchema.statics.getDailyAverage = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const pipeline = [
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        type: 'expense',
        date: { $gte: startDateStr },
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  
  if (result.length === 0) return 0;
  
  return result[0].total / days;
};

module.exports = mongoose.model('Transaction', transactionSchema);
