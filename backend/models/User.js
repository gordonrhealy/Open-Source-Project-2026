// User Model - Comprehensive with OAuth, preferences, and security
// Finova Backend - Munster Technological University, Ireland

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  // Basic Information
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: function() {
      // Password required only if no OAuth providers
      return !this.oauthProviders || this.oauthProviders.length === 0;
    },
    minlength: 8
  },

  // OAuth Integration
  oauthProviders: [{
    provider: {
      type: String,
      enum: ['google', 'github', 'facebook', 'apple'],
      required: true
    },
    providerId: {
      type: String,
      required: true
    },
    email: String,
    displayName: String,
    profilePhoto: String,
    accessToken: String, // Encrypted in production
    refreshToken: String, // Encrypted in production
    connectedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Profile Information
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    dateOfBirth: Date,
    avatar: String, // URL to profile picture
    bio: String,
    location: {
      country: String,
      city: String,
      timezone: {
        type: String,
        default: 'UTC'
      }
    }
  },

  // Preferences
  preferences: {
    currency: {
      type: String,
      default: 'EUR',
      enum: ['EUR', 'USD', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'BDT']
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ar', 'bn']
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY',
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']
    },
    firstDayOfWeek: {
      type: Number,
      default: 1, // Monday
      min: 0,
      max: 6
    },
    notifications: {
      email: {
        budgetAlerts: { type: Boolean, default: true },
        goalMilestones: { type: Boolean, default: true },
        weeklyReports: { type: Boolean, default: true },
        unusualActivity: { type: Boolean, default: true },
        billReminders: { type: Boolean, default: true }
      },
      push: {
        enabled: { type: Boolean, default: false },
        budgetAlerts: { type: Boolean, default: true },
        goalMilestones: { type: Boolean, default: true }
      }
    }
  },

  // Security
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String,
    biometricEnabled: {
      type: Boolean,
      default: false
    },
    lastPasswordChange: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    sessionTokens: [{
      token: String,
      device: String,
      ipAddress: String,
      createdAt: { type: Date, default: Date.now },
      expiresAt: Date
    }]
  },

  // Subscription & Features
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'pro', 'premium'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    autoRenew: {
      type: Boolean,
      default: false
    },
    features: {
      maxAccounts: { type: Number, default: 3 },
      aiInsights: { type: Boolean, default: false },
      advancedAnalytics: { type: Boolean, default: false },
      receiptOCR: { type: Boolean, default: false },
      customCategories: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false }
    }
  },

  // AI Preferences
  aiPreferences: {
    enableInsights: {
      type: Boolean,
      default: true
    },
    insightFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    categories: [{
      name: String,
      keywords: [String],
      icon: String,
      color: String
    }],
    savingGoalPreferences: {
      riskTolerance: {
        type: String,
        enum: ['conservative', 'moderate', 'aggressive'],
        default: 'moderate'
      },
      autoSuggest: {
        type: Boolean,
        default: true
      }
    }
  },

  // Metadata
  verified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationExpires: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
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

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'oauthProviders.provider': 1, 'oauthProviders.providerId': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.security.lastPasswordChange = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // Reset attempts if lock has expired
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { 'security.loginAttempts': 1 },
      $unset: { 'security.lockUntil': 1 }
    });
  }
  
  // Increment attempts
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.security.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 'security.lockUntil': Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { 'security.loginAttempts': 0 },
    $unset: { 'security.lockUntil': 1 }
  });
};

// Method to add OAuth provider
userSchema.methods.addOAuthProvider = function(providerData) {
  // Check if provider already exists
  const existingProvider = this.oauthProviders.find(
    p => p.provider === providerData.provider && p.providerId === providerData.providerId
  );
  
  if (!existingProvider) {
    this.oauthProviders.push({
      provider: providerData.provider,
      providerId: providerData.providerId,
      email: providerData.email,
      displayName: providerData.displayName,
      profilePhoto: providerData.profilePhoto,
      accessToken: providerData.accessToken,
      refreshToken: providerData.refreshToken,
      connectedAt: Date.now()
    });
  }
  
  return this.save();
};

// Method to get safe user object (without sensitive data)
userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.security;
  delete obj.oauthProviders;
  delete obj.verificationToken;
  delete obj.passwordResetToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
