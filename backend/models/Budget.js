// Budget Model - Category-based Budget Tracking
// Finova Backend - Munster, Ireland

const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Budget Details
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'EUR'
  },

  // Time Period
  period: {
    type: String,
    required: true,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: String, // YYYY-MM-DD
    required: true
  },
  endDate: {
    type: String, // YYYY-MM-DD
    required: true
  },

  // Tracking
  spent: {
    type: Number,
    default: 0
  },
  remaining: {
    type: Number,
    default: 0
  },
  percentageUsed: {
    type: Number,
    default: 0
  },

  // Alerts
  alerts: {
    enabled: {
      type: Boolean,
      default: true
    },
    thresholds: {
      warning: {
        type: Number,
        default: 80, // 80% of budget
        alerted: { type: Boolean, default: false }
      },
      critical: {
        type: Number,
        default: 100, // 100% of budget
        alerted: { type: Boolean, default: false }
      }
    }
  },

  // Rollover
  rollover: {
    enabled: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      default: 0
    }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isRecurring: {
    type: Boolean,
    default: true
  },

  // Metadata
  notes: String,
  color: String,
  icon: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
budgetSchema.index({ user: 1, category: 1, startDate: 1 });
budgetSchema.index({ user: 1, isActive: 1 });

// Calculate remaining and percentage
budgetSchema.methods.updateProgress = function() {
  this.remaining = this.amount - this.spent;
  this.percentageUsed = (this.spent / this.amount) * 100;

  // Check alert thresholds
  if (this.alerts.enabled) {
    if (this.percentageUsed >= this.alerts.thresholds.warning.value && 
        !this.alerts.thresholds.warning.alerted) {
      // Trigger warning alert
      this.alerts.thresholds.warning.alerted = true;
    }
    if (this.percentageUsed >= this.alerts.thresholds.critical.value && 
        !this.alerts.thresholds.critical.alerted) {
      // Trigger critical alert
      this.alerts.thresholds.critical.alerted = true;
    }
  }
};

// Pre-save hook
budgetSchema.pre('save', function(next) {
  this.remaining = this.amount - this.spent;
  this.percentageUsed = this.amount > 0 ? (this.spent / this.amount) * 100 : 0;
  next();
});

// Static method to get user's active budgets
budgetSchema.statics.getActiveBudgets = async function(userId) {
  return this.find({ 
    user: userId, 
    isActive: true 
  }).sort({ category: 1 });
};

// Static method to check if budget exists for category
budgetSchema.statics.existsForCategory = async function(userId, category, startDate, endDate) {
  return this.findOne({
    user: userId,
    category,
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
    isActive: true
  });
};

module.exports = mongoose.model('Budget', budgetSchema);
