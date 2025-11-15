// User Model for TutorNest
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    // Basic Information
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['student', 'tutor', 'parent', 'admin'],
        default: 'student'
    },
    
    // Profile Information
    avatar: {
        type: String,
        default: null
    },
    phoneNumber: {
        type: String,
        default: null
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
        default: 'prefer_not_to_say'
    },
    bio: {
        type: String,
        maxlength: 500,
        default: ''
    },
    
    // Location
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    timezone: {
        type: String,
        default: 'America/New_York'
    },
    
    // Preferences
    language: {
        type: String,
        default: 'en'
    },
    preferredSubjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    learningGoals: [{
        goal: String,
        targetDate: Date,
        completed: {
            type: Boolean,
            default: false
        }
    }],
    
    // Tutor-Specific Fields (if role === 'tutor')
    tutorProfile: {
        isVerified: {
            type: Boolean,
            default: false
        },
        hourlyRate: {
            type: Number,
            min: 0
        },
        subjects: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject'
        }],
        qualifications: [{
            degree: String,
            institution: String,
            year: Number
        }],
        experience: {
            years: Number,
            description: String
        },
        availability: [{
            dayOfWeek: {
                type: Number,
                min: 0,
                max: 6
            },
            startTime: String,
            endTime: String
        }],
        languages: [String],
        specializations: [String],
        rating: {
            average: {
                type: Number,
                default: 0,
                min: 0,
                max: 5
            },
            count: {
                type: Number,
                default: 0
            }
        },
        totalSessions: {
            type: Number,
            default: 0
        },
        totalStudents: {
            type: Number,
            default: 0
        },
        responseTime: {
            type: Number, // in minutes
            default: 60
        },
        introVideo: String,
        certificates: [{
            name: String,
            issuer: String,
            date: Date,
            documentUrl: String
        }]
    },
    
    // Student-Specific Fields
    studentProfile: {
        gradeLevel: {
            type: String,
            enum: ['elementary', 'middle_school', 'high_school', 'college', 'adult']
        },
        school: String,
        parentEmail: String, // For minors
        learningStyle: {
            type: String,
            enum: ['visual', 'auditory', 'kinesthetic', 'reading_writing']
        },
        specialNeeds: [String],
        academicGoals: String
    },
    
    // Account Status
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    
    // Security
    passwordResetToken: String,
    passwordResetExpires: Date,
    twoFactorSecret: String,
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    
    // Subscription
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'premium', 'elite'],
            default: 'free'
        },
        startDate: Date,
        endDate: Date,
        autoRenew: {
            type: Boolean,
            default: true
        },
        paymentMethod: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'PaymentMethod'
        }
    },
    
    // Analytics
    lastLogin: Date,
    loginCount: {
        type: Number,
        default: 0
    },
    totalMinutesLearned: {
        type: Number,
        default: 0
    },
    learningStreak: {
        current: {
            type: Number,
            default: 0
        },
        longest: {
            type: Number,
            default: 0
        },
        lastSessionDate: Date
    },
    
    // Notifications
    notificationPreferences: {
        email: {
            sessionReminders: { type: Boolean, default: true },
            newMessages: { type: Boolean, default: true },
            promotions: { type: Boolean, default: false },
            weeklyReport: { type: Boolean, default: true }
        },
        push: {
            sessionReminders: { type: Boolean, default: true },
            newMessages: { type: Boolean, default: true },
            promotions: { type: Boolean, default: false }
        },
        sms: {
            sessionReminders: { type: Boolean, default: false },
            urgentNotifications: { type: Boolean, default: true }
        }
    },
    
    // Social
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    blockedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // Referrals
    referralCode: {
        type: String,
        unique: true,
        sparse: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    referralCount: {
        type: Number,
        default: 0
    },
    referralCredits: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'tutorProfile.subjects': 1 });
userSchema.index({ 'tutorProfile.rating.average': -1 });
userSchema.index({ 'tutorProfile.hourlyRate': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate referral code
userSchema.methods.generateReferralCode = function() {
    this.referralCode = this.firstName.toLowerCase() + Math.random().toString(36).substring(2, 8);
    return this.referralCode;
};

// Method to check if account is locked
userSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = async function() {
    // Reset attempts if lock has expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    const maxAttempts = 5;
    const lockTime = 2 * 60 * 60 * 1000; // 2 hours
    
    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
        updates.$set = { lockUntil: Date.now() + lockTime };
    }
    
    return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
    return this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 }
    });
};

// Static method to find tutors by subject
userSchema.statics.findTutorsBySubject = function(subjectId, filters = {}) {
    const query = {
        role: 'tutor',
        'tutorProfile.subjects': subjectId,
        'tutorProfile.isVerified': true,
        isActive: true
    };
    
    if (filters.minRating) {
        query['tutorProfile.rating.average'] = { $gte: filters.minRating };
    }
    
    if (filters.maxPrice) {
        query['tutorProfile.hourlyRate'] = { $lte: filters.maxPrice };
    }
    
    if (filters.language) {
        query['tutorProfile.languages'] = filters.language;
    }
    
    return this.find(query)
        .select('-password -emailVerificationToken -passwordResetToken')
        .populate('tutorProfile.subjects')
        .sort({ 'tutorProfile.rating.average': -1 });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
