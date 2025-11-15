# 🚀 Complete TutorNest Deployment Guide

## Overview
This guide will help you deploy TutorNest with full functionality including:
- Frontend on Netlify
- Backend API (Node.js/Express)
- Database (MongoDB or PostgreSQL)
- Real-time features (WebSocket)
- Payment processing
- Video conferencing

---

## Step 1: Deploy Frontend to Netlify

### Option A: Drag & Drop (Easiest)
1. Go to [Netlify Drop](https://app.netlify.com/drop)
2. Drag your `TutorNest` folder
3. Your site is live!

### Option B: Git Integration (Recommended)
1. Push your code to GitHub:
```bash
cd C:\Users\USER\CascadeProjects\TutorNest
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/tutornest.git
git push -u origin main
```

2. Connect to Netlify:
   - Go to [Netlify](https://app.netlify.com)
   - Click "New site from Git"
   - Choose GitHub
   - Select your repository
   - Deploy!

3. Configure Environment Variables in Netlify:
   - Go to Site Settings → Environment Variables
   - Add:
     ```
     VITE_API_URL=https://your-backend.herokuapp.com/api
     VITE_WEBSOCKET_URL=wss://your-backend.herokuapp.com
     ```

---

## Step 2: Set Up Database

### Option A: MongoDB Atlas (Free Tier Available)

1. **Create Account**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

2. **Create Cluster**:
   - Choose FREE tier
   - Select region closest to you
   - Create Cluster

3. **Configure Access**:
   - Database Access → Add New Database User
   - Network Access → Add IP Address → Allow from Anywhere (0.0.0.0/0)

4. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/tutornest
   ```

### Option B: PostgreSQL on Supabase (Free Tier)

1. **Create Account**: Go to [Supabase](https://supabase.com)

2. **Create Project**:
   - New Project → Fill details
   - Wait for database to provision

3. **Get Connection String**:
   - Settings → Database
   - Copy connection string

---

## Step 3: Deploy Backend API

### Option A: Heroku (Easy)

1. **Install Heroku CLI**: Download from [Heroku](https://heroku.com)

2. **Prepare Backend**:
```bash
cd C:\Users\USER\CascadeProjects\TutorNest\backend
npm init -y
npm install express cors helmet morgan mongoose dotenv socket.io jsonwebtoken bcrypt
```

3. **Create package.json**:
```json
{
  "name": "tutornest-api",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "mongoose": "^7.0.0",
    "dotenv": "^16.0.0",
    "socket.io": "^4.5.0",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "stripe": "^11.0.0"
  },
  "engines": {
    "node": "18.x"
  }
}
```

4. **Deploy to Heroku**:
```bash
heroku create tutornest-api
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI="your_mongodb_connection_string"
heroku config:set JWT_SECRET="your_secret_key"
heroku config:set CLIENT_URL="https://tutornest.netlify.app"
git add .
git commit -m "Backend setup"
git push heroku main
```

### Option B: Railway (Modern Alternative)

1. Go to [Railway](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your backend repository
4. Add environment variables
5. Deploy!

### Option C: Render (Free Tier)

1. Go to [Render](https://render.com)
2. New → Web Service
3. Connect GitHub repository
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Add environment variables
6. Deploy!

---

## Step 4: Connect Frontend to Backend

1. **Update API Configuration**:
   
   Edit `js/api-config.js`:
   ```javascript
   production: {
       baseURL: 'https://tutornest-api.herokuapp.com/api',
       websocketURL: 'wss://tutornest-api.herokuapp.com',
       cdnURL: 'https://tutornest-cdn.netlify.app'
   }
   ```

2. **Update Netlify Environment Variables**:
   - Go to Netlify Dashboard
   - Site Settings → Environment Variables
   - Add your backend URL

3. **Redeploy Frontend**:
   ```bash
   git add .
   git commit -m "Update API endpoints"
   git push origin main
   ```

---

## Step 5: Set Up Payment Processing

### Stripe Integration

1. **Create Stripe Account**: [Stripe Dashboard](https://dashboard.stripe.com)

2. **Get API Keys**:
   - Developers → API Keys
   - Copy Publishable and Secret keys

3. **Add to Backend Environment**:
   ```
   STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

4. **Install Stripe in Backend**:
   ```bash
   npm install stripe
   ```

5. **Create Payment Endpoint**:
   ```javascript
   const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
   
   app.post('/api/payments/process', async (req, res) => {
       const { amount, currency, description } = req.body;
       
       try {
           const paymentIntent = await stripe.paymentIntents.create({
               amount: amount * 100, // Convert to cents
               currency: currency || 'usd',
               description
           });
           
           res.json({ clientSecret: paymentIntent.client_secret });
       } catch (error) {
           res.status(400).json({ error: error.message });
       }
   });
   ```

---

## Step 6: Set Up Video Conferencing

### Option A: Zoom Integration

1. **Create Zoom App**: [Zoom Marketplace](https://marketplace.zoom.us)

2. **Get Credentials**:
   - App Credentials → Copy API Key & Secret

3. **Install Zoom SDK**:
   ```bash
   npm install @zoom/videosdk
   ```

### Option B: WebRTC with Agora

1. **Create Agora Account**: [Agora Console](https://console.agora.io)

2. **Create Project**:
   - Get App ID and Certificate

3. **Add to Environment**:
   ```
   AGORA_APP_ID=your_app_id
   AGORA_APP_CERTIFICATE=your_certificate
   ```

---

## Step 7: Testing Your Deployment

### Test Checklist:
- [ ] Frontend loads on Netlify URL
- [ ] API health check: `https://your-api.herokuapp.com/health`
- [ ] User registration works
- [ ] User login works
- [ ] Search tutors returns results
- [ ] Booking session creates database entry
- [ ] Messages send in real-time
- [ ] Payment processing (test mode)
- [ ] Video calls connect

### Debug Common Issues:

**CORS Errors**:
```javascript
// In backend server.js
app.use(cors({
    origin: 'https://tutornest.netlify.app',
    credentials: true
}));
```

**WebSocket Connection Failed**:
```javascript
// Check WebSocket URL includes wss:// for HTTPS
websocketURL: 'wss://your-api.herokuapp.com'
```

**Database Connection Failed**:
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Check username/password

---

## Step 8: Production Optimizations

### Frontend Optimizations:
1. **Enable Netlify Asset Optimization**:
   - Site Settings → Build & Deploy → Post Processing
   - Enable: Minify, Bundle CSS, Compress Images

2. **Add Custom Domain**:
   - Domain Settings → Add custom domain
   - Follow DNS configuration steps

3. **Enable HTTPS**:
   - Automatic with Netlify

### Backend Optimizations:
1. **Add Caching**:
   ```javascript
   const redis = require('redis');
   const client = redis.createClient(process.env.REDIS_URL);
   ```

2. **Add Monitoring**:
   ```javascript
   // Add New Relic or DataDog
   require('newrelic');
   ```

3. **Database Indexing**:
   ```javascript
   // In MongoDB models
   userSchema.index({ email: 1 });
   tutorSchema.index({ subject: 1, rating: -1 });
   ```

---

## Step 9: Monitoring & Analytics

### Set Up Monitoring:

1. **Google Analytics**:
   - Add to `index.html`:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   ```

2. **Error Tracking (Sentry)**:
   ```bash
   npm install @sentry/node
   ```

3. **Uptime Monitoring**:
   - Use [UptimeRobot](https://uptimerobot.com) (Free)
   - Monitor: Frontend URL, API Health endpoint

---

## Step 10: Launch Checklist

### Pre-Launch:
- [ ] Test all features thoroughly
- [ ] Set up SSL certificates
- [ ] Configure backup system
- [ ] Create Terms of Service
- [ ] Create Privacy Policy
- [ ] Set up customer support email
- [ ] Prepare launch marketing

### Go Live:
1. **Switch to Production Mode**:
   ```
   NODE_ENV=production
   ```

2. **Enable Payment Live Mode**:
   - Switch from Stripe test keys to live keys

3. **Remove Test Data**:
   - Clear test users from database
   - Remove demo content

4. **Announce Launch**:
   - Social media
   - Email list
   - Press release

---

## Support & Maintenance

### Regular Tasks:
- **Daily**: Check error logs, monitor uptime
- **Weekly**: Database backups, security updates
- **Monthly**: Performance review, user analytics

### Scaling Considerations:
- **Database**: Consider clustering at 10K+ users
- **API**: Add load balancer at 100+ concurrent users
- **CDN**: Use Cloudflare for global distribution
- **Caching**: Implement Redis for session management

---

## Quick Start Commands

```bash
# Frontend (Netlify)
git push origin main  # Auto-deploys

# Backend (Local Development)
cd backend
npm run dev

# Backend (Production)
git push heroku main

# Database Backup (MongoDB)
mongodump --uri "mongodb+srv://..." --out backup/

# View Logs
heroku logs --tail
```

---

## Useful Links

- **Frontend**: https://tutornest.netlify.app
- **API**: https://tutornest-api.herokuapp.com
- **API Health**: https://tutornest-api.herokuapp.com/health
- **MongoDB**: https://cloud.mongodb.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Netlify Dashboard**: https://app.netlify.com
- **Heroku Dashboard**: https://dashboard.heroku.com

---

## Troubleshooting

**Issue**: API calls failing
**Solution**: Check CORS settings and API URL in api-config.js

**Issue**: WebSocket not connecting
**Solution**: Ensure WSS protocol for HTTPS sites

**Issue**: Payment not processing
**Solution**: Verify Stripe keys and webhook configuration

**Issue**: Video calls not working
**Solution**: Check WebRTC permissions and STUN/TURN servers

---

## 🎉 Congratulations!

Your TutorNest platform is now fully deployed and operational! 

For questions or support, check the documentation or open an issue in the repository.

Happy Tutoring! 🚀
