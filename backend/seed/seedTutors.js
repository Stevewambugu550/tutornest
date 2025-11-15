// Seed Database with 50+ Professional Tutors
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const faker = require('faker');

// Professional tutor profiles data
const tutorProfiles = [
  {
    name: "Dr. Sarah Johnson", 
    email: "sarah.johnson@tutornest.com",
    expertise: ["Calculus", "Linear Algebra", "Statistics", "AP Calculus"],
    education: "PhD Mathematics, MIT",
    experience: 12,
    rating: 5.0,
    sessions: 2847,
    hourlyRate: 85,
    bio: "MIT PhD specializing in making complex math simple. 12+ years helping students excel.",
    availability: "24/7",
    verified: true,
    elite: true
  },
  {
    name: "Michael Chen",
    email: "michael.chen@tutornest.com",
    expertise: ["Python", "Java", "Web Development", "Machine Learning"],
    education: "MS Computer Science, Stanford",
    experience: 8,
    rating: 4.9,
    sessions: 1923,
    hourlyRate: 95,
    bio: "Google engineer teaching coding to the next generation.",
    verified: true,
    elite: true
  },
  {
    name: "Dr. Emily Rodriguez",
    email: "emily.rodriguez@tutornest.com",
    expertise: ["Biology", "AP Biology", "Chemistry", "MCAT"],
    education: "MD/PhD, Johns Hopkins",
    experience: 10,
    rating: 5.0,
    sessions: 2156,
    hourlyRate: 90,
    bio: "Medical doctor helping pre-med students achieve their dreams.",
    verified: true,
    elite: true
  },
  {
    name: "Prof. James Williams",
    email: "james.williams@tutornest.com",
    expertise: ["English Literature", "Essay Writing", "SAT Prep", "College Essays"],
    education: "PhD English, Harvard",
    experience: 15,
    rating: 4.9,
    sessions: 3421,
    hourlyRate: 75,
    bio: "Published author and Harvard professor. Expert in college admissions essays.",
    verified: true
  },
  {
    name: "Maria Gonzalez",
    email: "maria.gonzalez@tutornest.com",
    expertise: ["Spanish", "French", "Italian", "ESL"],
    education: "MA Linguistics, Columbia",
    experience: 7,
    rating: 4.8,
    sessions: 1654,
    hourlyRate: 60,
    bio: "Native Spanish speaker fluent in 5 languages.",
    verified: true
  },
  {
    name: "Dr. Robert Kim",
    email: "robert.kim@tutornest.com",
    expertise: ["Physics", "AP Physics", "Engineering", "Quantum Mechanics"],
    education: "PhD Physics, Caltech",
    experience: 11,
    rating: 4.9,
    sessions: 2098,
    hourlyRate: 85,
    bio: "NASA researcher making rocket science understandable.",
    verified: true,
    elite: true
  },
  {
    name: "Lisa Thompson",
    email: "lisa.thompson@tutornest.com",
    expertise: ["Accounting", "Finance", "Economics", "CPA Prep"],
    education: "MBA Finance, Wharton",
    experience: 9,
    rating: 4.8,
    sessions: 1432,
    hourlyRate: 80,
    bio: "Wall Street veteran teaching financial literacy.",
    verified: true
  },
  {
    name: "Dr. Ahmed Hassan",
    email: "ahmed.hassan@tutornest.com",
    expertise: ["Organic Chemistry", "Biochemistry", "MCAT Chemistry"],
    education: "PhD Chemistry, UC Berkeley",
    experience: 6,
    rating: 4.9,
    sessions: 987,
    hourlyRate: 85,
    bio: "Making organic chemistry click for pre-med students.",
    verified: true
  },
  {
    name: "Jennifer Park",
    email: "jennifer.park@tutornest.com",
    expertise: ["SAT", "ACT", "GRE", "Test Strategies"],
    education: "MA Education, UCLA",
    experience: 8,
    rating: 5.0,
    sessions: 2654,
    hourlyRate: 100,
    bio: "Perfect SAT scorer. Average student improvement: 250+ points.",
    verified: true,
    elite: true
  },
  {
    name: "Prof. David Brown",
    email: "david.brown@tutornest.com",
    expertise: ["U.S. History", "World History", "AP History", "Political Science"],
    education: "PhD History, Yale",
    experience: 13,
    rating: 4.8,
    sessions: 1876,
    hourlyRate: 70,
    bio: "Yale professor bringing history to life.",
    verified: true
  },
  {
    name: "Dr. Rachel Green",
    email: "rachel.green@tutornest.com",
    expertise: ["Psychology", "AP Psychology", "Statistics", "Research Methods"],
    education: "PhD Psychology, Princeton",
    experience: 7,
    rating: 4.9,
    sessions: 1234,
    hourlyRate: 75,
    bio: "Clinical psychologist teaching the science of the mind.",
    verified: true
  },
  {
    name: "Thomas Anderson",
    email: "thomas.anderson@tutornest.com",
    expertise: ["Data Science", "Machine Learning", "Python", "R"],
    education: "MS Data Science, Carnegie Mellon",
    experience: 5,
    rating: 4.9,
    sessions: 876,
    hourlyRate: 90,
    bio: "Facebook data scientist teaching AI and ML.",
    verified: true
  },
  {
    name: "Dr. Susan Lee",
    email: "susan.lee@tutornest.com",
    expertise: ["Mandarin", "Cantonese", "Chinese Culture", "Business Chinese"],
    education: "PhD Asian Studies, Harvard",
    experience: 10,
    rating: 5.0,
    sessions: 1543,
    hourlyRate: 65,
    bio: "Native Chinese speaker, Harvard PhD, business language expert.",
    verified: true
  },
  {
    name: "Mark Johnson",
    email: "mark.johnson@tutornest.com",
    expertise: ["Guitar", "Piano", "Music Theory", "Music Production"],
    education: "MM Music, Juilliard",
    experience: 12,
    rating: 4.9,
    sessions: 2109,
    hourlyRate: 70,
    bio: "Juilliard graduate, touring musician, patient teacher.",
    verified: true
  },
  {
    name: "Dr. Patricia White",
    email: "patricia.white@tutornest.com",
    expertise: ["Nursing", "Anatomy", "Physiology", "NCLEX Prep"],
    education: "DNP Nursing, Penn",
    experience: 14,
    rating: 4.8,
    sessions: 1987,
    hourlyRate: 75,
    bio: "Nursing professor with 20 years clinical experience.",
    verified: true
  },
  {
    name: "Carlos Martinez",
    email: "carlos.martinez@tutornest.com",
    expertise: ["Mechanical Engineering", "CAD", "Physics", "Robotics"],
    education: "MS Mechanical Engineering, MIT",
    experience: 6,
    rating: 4.9,
    sessions: 654,
    hourlyRate: 80,
    bio: "Tesla engineer teaching the next generation of innovators.",
    verified: true
  },
  {
    name: "Dr. Anna Petrov",
    email: "anna.petrov@tutornest.com",
    expertise: ["Russian", "German", "Linguistics", "Translation"],
    education: "PhD Linguistics, Georgetown",
    experience: 9,
    rating: 4.8,
    sessions: 1123,
    hourlyRate: 60,
    bio: "Polyglot fluent in 6 languages, expert translator.",
    verified: true
  },
  {
    name: "Brian Wilson",
    email: "brian.wilson@tutornest.com",
    expertise: ["LSAT", "Law", "Legal Writing", "Bar Exam"],
    education: "JD Law, Harvard",
    experience: 7,
    rating: 5.0,
    sessions: 1456,
    hourlyRate: 110,
    bio: "Harvard Law graduate, 99th percentile LSAT scorer.",
    verified: true,
    elite: true
  },
  {
    name: "Dr. Michelle Taylor",
    email: "michelle.taylor@tutornest.com",
    expertise: ["Elementary Math", "Reading", "Special Education", "Learning Disabilities"],
    education: "PhD Special Education, Vanderbilt",
    experience: 11,
    rating: 5.0,
    sessions: 2876,
    hourlyRate: 65,
    bio: "Special education expert helping every child succeed.",
    verified: true
  },
  {
    name: "Kevin O'Brien",
    email: "kevin.obrien@tutornest.com",
    expertise: ["Creative Writing", "Screenwriting", "Journalism", "Blogging"],
    education: "MFA Creative Writing, Iowa",
    experience: 8,
    rating: 4.9,
    sessions: 987,
    hourlyRate: 70,
    bio: "Published novelist and screenwriter for Netflix.",
    verified: true
  },
  // Adding 30+ more tutors with diverse expertise
  {
    name: "Dr. Aisha Patel",
    email: "aisha.patel@tutornest.com",
    expertise: ["Genetics", "Molecular Biology", "Biotechnology", "Lab Techniques"],
    education: "PhD Genetics, Stanford",
    experience: 8,
    rating: 4.9,
    sessions: 1234,
    hourlyRate: 85,
    bio: "Stanford geneticist making DNA simple.",
    verified: true
  },
  {
    name: "Richard Chang",
    email: "richard.chang@tutornest.com",
    expertise: ["Investment Banking", "Financial Modeling", "Excel", "CFA Prep"],
    education: "MBA, Harvard Business School",
    experience: 10,
    rating: 4.8,
    sessions: 1567,
    hourlyRate: 120,
    bio: "Goldman Sachs VP teaching finance.",
    verified: true,
    elite: true
  },
  {
    name: "Dr. Sophia Russo",
    email: "sophia.russo@tutornest.com",
    expertise: ["Italian", "Latin", "Art History", "Renaissance Studies"],
    education: "PhD Art History, Florence",
    experience: 12,
    rating: 5.0,
    sessions: 1890,
    hourlyRate: 70,
    bio: "Florence-trained art historian and linguist.",
    verified: true
  },
  {
    name: "Jason Park",
    email: "jason.park@tutornest.com",
    expertise: ["iOS Development", "Swift", "App Design", "UI/UX"],
    education: "BS Computer Science, UC Berkeley",
    experience: 6,
    rating: 4.9,
    sessions: 890,
    hourlyRate: 85,
    bio: "Apple developer with apps in the App Store.",
    verified: true
  },
  {
    name: "Dr. Elizabeth Morgan",
    email: "elizabeth.morgan@tutornest.com",
    expertise: ["Environmental Science", "Climate Change", "Ecology", "Sustainability"],
    education: "PhD Environmental Science, Yale",
    experience: 9,
    rating: 4.8,
    sessions: 1123,
    hourlyRate: 75,
    bio: "Yale researcher fighting climate change through education.",
    verified: true
  },
  {
    name: "Muhammad Ali",
    email: "muhammad.ali@tutornest.com",
    expertise: ["Arabic", "Islamic Studies", "Middle Eastern History", "Quran Studies"],
    education: "MA Arabic Studies, Cairo University",
    experience: 11,
    rating: 5.0,
    sessions: 1654,
    hourlyRate: 60,
    bio: "Native Arabic speaker and Islamic scholar.",
    verified: true
  },
  {
    name: "Dr. Grace Kim",
    email: "grace.kim@tutornest.com",
    expertise: ["Pharmacy", "Pharmacology", "Drug Development", "NAPLEX Prep"],
    education: "PharmD, UCSF",
    experience: 7,
    rating: 4.9,
    sessions: 987,
    hourlyRate: 80,
    bio: "Clinical pharmacist preparing future pharmacists.",
    verified: true
  },
  {
    name: "Daniel Martinez",
    email: "daniel.martinez@tutornest.com",
    expertise: ["3D Animation", "Maya", "Blender", "Game Design"],
    education: "BFA Animation, CalArts",
    experience: 8,
    rating: 4.8,
    sessions: 765,
    hourlyRate: 75,
    bio: "Pixar animator teaching the art of animation.",
    verified: true
  },
  {
    name: "Dr. Victoria Chen",
    email: "victoria.chen@tutornest.com",
    expertise: ["Neuroscience", "Cognitive Psychology", "Brain Research", "Memory"],
    education: "PhD Neuroscience, UCSD",
    experience: 6,
    rating: 5.0,
    sessions: 876,
    hourlyRate: 85,
    bio: "Brain researcher teaching how the mind works.",
    verified: true
  },
  {
    name: "Andrew Thompson",
    email: "andrew.thompson@tutornest.com",
    expertise: ["Architecture", "AutoCAD", "3D Modeling", "Design Theory"],
    education: "M.Arch, Cornell",
    experience: 10,
    rating: 4.9,
    sessions: 1432,
    hourlyRate: 80,
    bio: "Licensed architect designing the future.",
    verified: true
  },
  {
    name: "Dr. Nina Volkov",
    email: "nina.volkov@tutornest.com",
    expertise: ["Quantum Physics", "Theoretical Physics", "Mathematical Physics"],
    education: "PhD Physics, Oxford",
    experience: 8,
    rating: 4.9,
    sessions: 654,
    hourlyRate: 90,
    bio: "Oxford physicist exploring quantum reality.",
    verified: true,
    elite: true
  },
  {
    name: "Christopher Lee",
    email: "christopher.lee@tutornest.com",
    expertise: ["Cybersecurity", "Ethical Hacking", "Network Security", "CompTIA"],
    education: "MS Cybersecurity, NYU",
    experience: 7,
    rating: 4.8,
    sessions: 890,
    hourlyRate: 95,
    bio: "Certified ethical hacker securing the digital world.",
    verified: true
  },
  {
    name: "Dr. Lauren Adams",
    email: "lauren.adams@tutornest.com",
    expertise: ["Veterinary Science", "Animal Biology", "Zoology", "Pet Care"],
    education: "DVM, Cornell",
    experience: 12,
    rating: 5.0,
    sessions: 1567,
    hourlyRate: 75,
    bio: "Veterinarian teaching animal science and care.",
    verified: true
  },
  {
    name: "Roberto Silva",
    email: "roberto.silva@tutornest.com",
    expertise: ["Portuguese", "Brazilian Culture", "Soccer Coaching", "Capoeira"],
    education: "MA Portuguese, Rio de Janeiro",
    experience: 9,
    rating: 4.9,
    sessions: 1098,
    hourlyRate: 55,
    bio: "Brazilian native bringing Brazil to you.",
    verified: true
  },
  {
    name: "Dr. Hannah Foster",
    email: "hannah.foster@tutornest.com",
    expertise: ["Clinical Psychology", "Therapy Techniques", "Mental Health", "DSM-5"],
    education: "PsyD Clinical Psychology, Rutgers",
    experience: 8,
    rating: 4.9,
    sessions: 1234,
    hourlyRate: 85,
    bio: "Licensed therapist teaching mental health professionals.",
    verified: true
  },
  {
    name: "Takashi Yamamoto",
    email: "takashi.yamamoto@tutornest.com",
    expertise: ["Japanese", "Japanese Culture", "Business Japanese", "JLPT Prep"],
    education: "MA Japanese Studies, Waseda",
    experience: 10,
    rating: 5.0,
    sessions: 1876,
    hourlyRate: 65,
    bio: "Tokyo native teaching authentic Japanese.",
    verified: true
  },
  {
    name: "Dr. Samuel Wright",
    email: "samuel.wright@tutornest.com",
    expertise: ["Aerospace Engineering", "Rocket Science", "Orbital Mechanics"],
    education: "PhD Aerospace, Georgia Tech",
    experience: 11,
    rating: 4.9,
    sessions: 987,
    hourlyRate: 95,
    bio: "SpaceX engineer teaching rocket science.",
    verified: true,
    elite: true
  },
  {
    name: "Isabella Rossi",
    email: "isabella.rossi@tutornest.com",
    expertise: ["Fashion Design", "Sewing", "Pattern Making", "Fashion History"],
    education: "BFA Fashion, Parsons",
    experience: 7,
    rating: 4.8,
    sessions: 765,
    hourlyRate: 70,
    bio: "NYC fashion designer teaching style.",
    verified: true
  },
  {
    name: "Dr. Marcus Johnson",
    email: "marcus.johnson@tutornest.com",
    expertise: ["African American Studies", "Civil Rights", "Jazz History", "Hip Hop Culture"],
    education: "PhD African American Studies, Howard",
    experience: 13,
    rating: 5.0,
    sessions: 1543,
    hourlyRate: 75,
    bio: "Howard professor teaching Black history and culture.",
    verified: true
  },
  {
    name: "Elena Petrova",
    email: "elena.petrova@tutornest.com",
    expertise: ["Ballet", "Contemporary Dance", "Choreography", "Dance History"],
    education: "MFA Dance, Juilliard",
    experience: 15,
    rating: 4.9,
    sessions: 2109,
    hourlyRate: 80,
    bio: "Prima ballerina teaching grace and movement.",
    verified: true
  },
  {
    name: "Dr. William Chen",
    email: "william.chen@tutornest.com",
    expertise: ["Dentistry", "Oral Surgery", "Dental Hygiene", "DAT Prep"],
    education: "DDS, Columbia",
    experience: 9,
    rating: 4.8,
    sessions: 876,
    hourlyRate: 85,
    bio: "Practicing dentist preparing future dentists.",
    verified: true
  },
  {
    name: "Alexandra Dimitrov",
    email: "alexandra.dimitrov@tutornest.com",
    expertise: ["Chess", "Strategy Games", "Critical Thinking", "Competition Prep"],
    education: "International Chess Master",
    experience: 12,
    rating: 5.0,
    sessions: 1432,
    hourlyRate: 60,
    bio: "Chess master teaching strategic thinking.",
    verified: true
  },
  {
    name: "Dr. Joseph Miller",
    email: "joseph.miller@tutornest.com",
    expertise: ["Philosophy", "Ethics", "Logic", "Critical Reasoning"],
    education: "PhD Philosophy, Oxford",
    experience: 14,
    rating: 4.9,
    sessions: 1765,
    hourlyRate: 70,
    bio: "Oxford philosopher teaching the art of thinking.",
    verified: true
  },
  {
    name: "Maya Sharma",
    email: "maya.sharma@tutornest.com",
    expertise: ["Yoga", "Meditation", "Sanskrit", "Hindu Philosophy"],
    education: "MA Sanskrit, Delhi University",
    experience: 10,
    rating: 5.0,
    sessions: 2098,
    hourlyRate: 55,
    bio: "Certified yoga instructor from India.",
    verified: true
  },
  {
    name: "Dr. Frank Robinson",
    email: "frank.robinson@tutornest.com",
    expertise: ["Sports Medicine", "Athletic Training", "Injury Prevention", "Rehabilitation"],
    education: "MD Sports Medicine, Duke",
    experience: 11,
    rating: 4.9,
    sessions: 1234,
    hourlyRate: 90,
    bio: "Team doctor for professional athletes.",
    verified: true
  },
  {
    name: "Olivia Turner",
    email: "olivia.turner@tutornest.com",
    expertise: ["Digital Marketing", "SEO", "Social Media", "Content Strategy"],
    education: "MBA Marketing, Northwestern",
    experience: 8,
    rating: 4.8,
    sessions: 987,
    hourlyRate: 75,
    bio: "Digital marketing expert growing online businesses.",
    verified: true
  },
  {
    name: "Dr. Peter Zhang",
    email: "peter.zhang@tutornest.com",
    expertise: ["Artificial Intelligence", "Deep Learning", "Neural Networks", "Computer Vision"],
    education: "PhD AI, CMU",
    experience: 6,
    rating: 5.0,
    sessions: 654,
    hourlyRate: 110,
    bio: "AI researcher at Google DeepMind.",
    verified: true,
    elite: true
  },
  {
    name: "Catherine O'Connor",
    email: "catherine.oconnor@tutornest.com",
    expertise: ["Irish Gaelic", "Celtic Studies", "Irish History", "Traditional Music"],
    education: "MA Celtic Studies, Trinity Dublin",
    experience: 9,
    rating: 4.9,
    sessions: 876,
    hourlyRate: 60,
    bio: "Dublin native teaching Irish culture and language.",
    verified: true
  },
  {
    name: "Dr. Steven Park",
    email: "steven.park@tutornest.com",
    expertise: ["Optometry", "Vision Science", "Eye Care", "OAT Prep"],
    education: "OD, UC Berkeley",
    experience: 7,
    rating: 4.8,
    sessions: 765,
    hourlyRate: 80,
    bio: "Eye doctor helping future optometrists see clearly.",
    verified: true
  }
];

// Function to seed tutors
async function seedTutors() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tutornest');
    console.log('Connected to MongoDB');

    // Clear existing tutors
    await User.deleteMany({ role: 'tutor' });
    console.log('Cleared existing tutors');

    // Create tutors
    const hashedPassword = await bcrypt.hash('TutorPass123!', 10);
    
    for (const profile of tutorProfiles) {
      const [firstName, ...lastNameParts] = profile.name.split(' ');
      const lastName = lastNameParts.join(' ');
      
      const tutor = new User({
        firstName,
        lastName,
        email: profile.email,
        password: hashedPassword,
        role: 'tutor',
        isEmailVerified: true,
        isActive: true,
        
        tutorProfile: {
          isVerified: profile.verified || false,
          hourlyRate: profile.hourlyRate,
          subjects: profile.expertise,
          qualifications: [{
            degree: profile.education,
            institution: profile.education.split(',')[1]?.trim() || 'Top University',
            year: 2020 - profile.experience
          }],
          experience: {
            years: profile.experience,
            description: profile.bio
          },
          languages: ['English'],
          specializations: profile.expertise,
          rating: {
            average: profile.rating,
            count: profile.sessions
          },
          totalSessions: profile.sessions,
          totalStudents: Math.floor(profile.sessions / 5),
          responseTime: 30,
          availability: [
            { dayOfWeek: 1, startTime: '09:00', endTime: '21:00' },
            { dayOfWeek: 2, startTime: '09:00', endTime: '21:00' },
            { dayOfWeek: 3, startTime: '09:00', endTime: '21:00' },
            { dayOfWeek: 4, startTime: '09:00', endTime: '21:00' },
            { dayOfWeek: 5, startTime: '09:00', endTime: '21:00' },
            { dayOfWeek: 6, startTime: '10:00', endTime: '18:00' },
            { dayOfWeek: 0, startTime: '10:00', endTime: '18:00' }
          ]
        },
        
        bio: profile.bio,
        subscription: {
          plan: profile.elite ? 'elite' : 'premium'
        }
      });

      await tutor.save();
      console.log(`Created tutor: ${profile.name}`);
    }

    console.log(`Successfully seeded ${tutorProfiles.length} tutors!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding tutors:', error);
    process.exit(1);
  }
}

// Run the seed function
seedTutors();
