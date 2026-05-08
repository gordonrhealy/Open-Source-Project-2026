// Goal Model - Savings Goals and Milestones
// Finova Backend - Munster, Ireland

const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Goal Details
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  type: {
    type: String,
    required: true,
    enum: ['savings', 'debt_payoff', 'emergency_fund', 'investment', 'custom'],
    default: 'savings'
  },

  // Target
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'EUR'
  },

  // Timeline
  targetDate: {
    type: Date,
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },

  // Progress
  progress: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    remaining: {
      type: Number,
      default: 0
    },
    daysRemaining: {
      type: Number,
      default: 0
    }
  },

  // Linked Account
  linkedAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },

  // Auto-contribution
  autoContribute: {
    enabled: {
      type: Boolean,
      default: false
    },
    amount: {
      type: Number,
      default: 0
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'biweekly', 'monthly'],
      default: 'monthly'
    },
    nextContribution: Date
  },

  // Milestones
  milestones: [{
    percentage: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    reached: {
      type: Boolean,
      default: false
    },
    reachedDate: Date,
    message: String
  }],

  // Visual
  icon: {
    type: String,
    default: 'target'
  },
  color: {
    type: String,
    default: '#10B981'
  },
  imageUrl: String,

  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active',
    index: true
  },
  completedDate: Date,

  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },

  // Metadata
  notes: String,
  isPublic: {
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
  }
}, {
  timestamps: true
});

// Indexes
goalSchema.index({ user: 1, status: 1 });
goalSchema.index({ user: 1, targetDate: 1 });

// Virtual for progress calculations
goalSchema.virtual('isOverdue').get(function() {
  return this.targetDate < new Date() && this.status === 'active';
});

// Method to update progress
goalSchema.methods.updateProgress = function() {
  this.progress.remaining = this.targetAmount - this.currentAmount;
  this.progress.percentage = (this.currentAmount / this.targetAmount) * 100;
  
  const now = new Date();
  const timeDiff = this.targetDate - now;
  this.progress.daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  // Check and update milestones
  this.milestones.forEach(milestone => {
    if (!milestone.reached && this.progress.percentage >= milestone.percentage) {
      milestone.reached = true;
      milestone.reachedDate = new Date();
    }
  });

  // Check if goal is completed
  if (this.currentAmount >= this.targetAmount && this.status === 'active') {
    this.status = 'completed';
    this.completedDate = new Date();
  }
};

// Method to add contribution
goalSchema.methods.addContribution = async function(amount) {
  this.currentAmount += amount;
  this.updateProgress();
  return this.save();
};

// Pre-save hook
goalSchema.pre('save', function(next) {
  this.updateProgress();
  next();
});

// Static method to get active goals
goalSchema.statics.getActiveGoals = async function(userId) {
  return this.find({ 
    user: userId, 
    status: 'active' 
  }).sort({ priority: -1, targetDate: 1 });
};

// Static method to get goal summary
goalSchema.statics.getSummary = async function(userId) {
  const goals = await this.find({ user: userId });

  return {
    total: goals.length,
    active: goals.filter(g => g.status === 'active').length,
    completed: goals.filter(g => g.status === 'completed').length,
    totalTarget: goals.reduce((sum, g) => sum + g.targetAmount, 0),
    totalSaved: goals.reduce((sum, g) => sum + g.currentAmount, 0),
    overdue: goals.filter(g => g.isOverdue).length
  };
};

module.exports = mongoose.model('Goal', goalSchema);
