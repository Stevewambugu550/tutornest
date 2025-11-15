// Tutor Routes with Vetting System
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Get all verified tutors with filters
router.get('/search', async (req, res) => {
  try {
    const {
      subject,
      minPrice,
      maxPrice,
      rating,
      availability,
      language,
      specialNeeds,
      page = 1,
      limit = 20,
      sort = 'rating'
    } = req.query;

    // Build query
    const query = {
      role: 'tutor',
      'tutorProfile.isVerified': true,
      isActive: true
    };

    // Subject filter
    if (subject) {
      query['tutorProfile.subjects'] = { 
        $in: Array.isArray(subject) ? subject : [subject] 
      };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query['tutorProfile.hourlyRate'] = {};
      if (minPrice) query['tutorProfile.hourlyRate'].$gte = Number(minPrice);
      if (maxPrice) query['tutorProfile.hourlyRate'].$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating) {
      query['tutorProfile.rating.average'] = { $gte: Number(rating) };
    }

    // Language filter
    if (language) {
      query['tutorProfile.languages'] = language;
    }

    // Special needs filter
    if (specialNeeds) {
      query['tutorProfile.specializations'] = { 
        $in: Array.isArray(specialNeeds) ? specialNeeds : [specialNeeds] 
      };
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'rating':
        sortOption = { 'tutorProfile.rating.average': -1 };
        break;
      case 'price-low':
        sortOption = { 'tutorProfile.hourlyRate': 1 };
        break;
      case 'price-high':
        sortOption = { 'tutorProfile.hourlyRate': -1 };
        break;
      case 'experience':
        sortOption = { 'tutorProfile.experience.years': -1 };
        break;
      case 'sessions':
        sortOption = { 'tutorProfile.totalSessions': -1 };
        break;
      default:
        sortOption = { 'tutorProfile.rating.average': -1 };
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Execute query
    const tutors = await User.find(query)
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort(sortOption)
      .limit(limit * 1)
      .skip(skip)
      .populate('tutorProfile.subjects');

    // Get total count for pagination
    const totalCount = await User.countDocuments(query);

    // Check real-time availability if requested
    if (availability === 'now') {
      const currentTime = new Date();
      const currentDay = currentTime.getDay();
      const currentHour = currentTime.getHours();
      
      // Filter tutors by current availability
      const availableTutors = tutors.filter(tutor => {
        const dayAvailability = tutor.tutorProfile.availability.find(
          a => a.dayOfWeek === currentDay
        );
        
        if (!dayAvailability) return false;
        
        const startHour = parseInt(dayAvailability.startTime.split(':')[0]);
        const endHour = parseInt(dayAvailability.endTime.split(':')[0]);
        
        return currentHour >= startHour && currentHour < endHour;
      });
      
      return res.json({
        success: true,
        tutors: availableTutors,
        totalCount: availableTutors.length,
        page,
        totalPages: Math.ceil(availableTutors.length / limit)
      });
    }

    res.json({
      success: true,
      tutors,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit)
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching tutors',
      error: error.message 
    });
  }
});

// Get single tutor profile
router.get('/:id', async (req, res) => {
  try {
    const tutor = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -passwordResetToken')
      .populate('tutorProfile.subjects');

    if (!tutor || tutor.role !== 'tutor') {
      return res.status(404).json({ 
        success: false, 
        message: 'Tutor not found' 
      });
    }

    // Get recent reviews
    const reviews = await Review.find({ tutor: req.params.id })
      .populate('student', 'firstName lastName avatar')
      .sort('-createdAt')
      .limit(10);

    res.json({
      success: true,
      tutor,
      reviews
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching tutor',
      error: error.message 
    });
  }
});

// Apply to become a tutor
router.post('/apply', auth, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'transcripts', maxCount: 5 },
  { name: 'certificates', maxCount: 10 }
]), async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (user.role === 'tutor') {
      return res.status(400).json({ 
        success: false, 
        message: 'Already registered as tutor' 
      });
    }

    // Update user to tutor with pending verification
    user.role = 'tutor';
    user.tutorProfile = {
      isVerified: false,
      hourlyRate: req.body.hourlyRate || 30,
      subjects: req.body.subjects || [],
      qualifications: req.body.qualifications || [],
      experience: {
        years: req.body.experienceYears || 0,
        description: req.body.experienceDescription || ''
      },
      languages: req.body.languages || ['English'],
      specializations: req.body.specializations || [],
      teachingPhilosophy: req.body.teachingPhilosophy || '',
      availability: req.body.availability || [],
      
      // Documents for verification
      documents: {
        resume: req.files.resume ? req.files.resume[0].path : null,
        transcripts: req.files.transcripts ? req.files.transcripts.map(f => f.path) : [],
        certificates: req.files.certificates ? req.files.certificates.map(f => f.path) : []
      },
      
      // Verification status
      verificationStatus: 'pending',
      verificationSteps: {
        identity: 'pending',
        education: 'pending',
        background: 'pending',
        teaching: 'pending'
      },
      
      applicationDate: new Date(),
      applicationNotes: req.body.notes || ''
    };

    await user.save();

    // Send to verification queue
    await sendToVerificationQueue(user);

    res.json({
      success: true,
      message: 'Application submitted successfully. Verification typically takes 2-3 business days.',
      verificationId: user._id
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error submitting application',
      error: error.message 
    });
  }
});

// Tutor verification status
router.get('/verification/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (user.role !== 'tutor') {
      return res.status(400).json({ 
        success: false, 
        message: 'Not a tutor account' 
      });
    }

    res.json({
      success: true,
      verificationStatus: user.tutorProfile.verificationStatus,
      verificationSteps: user.tutorProfile.verificationSteps,
      isVerified: user.tutorProfile.isVerified,
      applicationDate: user.tutorProfile.applicationDate,
      feedback: user.tutorProfile.verificationFeedback
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching verification status' 
    });
  }
});

// Update tutor profile
router.put('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (user.role !== 'tutor') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized as tutor' 
      });
    }

    // Update allowed fields
    const allowedUpdates = [
      'bio', 'hourlyRate', 'subjects', 'languages', 
      'availability', 'specializations', 'teachingPhilosophy'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'hourlyRate' || field === 'subjects' || field === 'languages' || 
            field === 'availability' || field === 'specializations' || field === 'teachingPhilosophy') {
          user.tutorProfile[field] = req.body[field];
        } else {
          user[field] = req.body[field];
        }
      }
    });

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error updating profile',
      error: error.message 
    });
  }
});

// Get tutor dashboard stats
router.get('/dashboard/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (user.role !== 'tutor') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized as tutor' 
      });
    }

    // Get sessions data
    const sessions = await Session.find({ tutor: req.userId });
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyEarnings = sessions
      .filter(s => {
        const sessionDate = new Date(s.date);
        return sessionDate.getMonth() === currentMonth && 
               sessionDate.getFullYear() === currentYear &&
               s.status === 'completed';
      })
      .reduce((total, session) => total + session.amount, 0);

    const totalEarnings = sessions
      .filter(s => s.status === 'completed')
      .reduce((total, session) => total + session.amount, 0);

    // Get student count
    const uniqueStudents = [...new Set(sessions.map(s => s.student.toString()))];

    res.json({
      success: true,
      stats: {
        monthlyEarnings,
        totalEarnings,
        totalSessions: user.tutorProfile.totalSessions,
        totalStudents: uniqueStudents.length,
        rating: user.tutorProfile.rating,
        responseTime: user.tutorProfile.responseTime,
        verificationStatus: user.tutorProfile.isVerified,
        availability: user.tutorProfile.availability
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard stats',
      error: error.message 
    });
  }
});

// Helper function to send to verification queue
async function sendToVerificationQueue(user) {
  // In production, this would send to a verification service
  // For now, we'll simulate automatic verification after review
  
  setTimeout(async () => {
    // Simulate background check and verification
    user.tutorProfile.verificationSteps.identity = 'approved';
    user.tutorProfile.verificationSteps.education = 'approved';
    user.tutorProfile.verificationSteps.background = 'approved';
    user.tutorProfile.verificationSteps.teaching = 'approved';
    user.tutorProfile.verificationStatus = 'approved';
    user.tutorProfile.isVerified = true;
    
    await user.save();
    
    // Send email notification (implement email service)
    console.log(`Tutor ${user.email} has been verified!`);
  }, 5000); // 5 seconds for demo, would be 2-3 days in production
}

module.exports = router;
