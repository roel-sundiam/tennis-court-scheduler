# Backend Deployment Guide - Tennis Court Scheduler

## Complete Step-by-Step Backend Deployment to Render

### Prerequisites
- Node.js backend code ready
- MongoDB database (MongoDB Atlas)
- GitHub account
- Render account (free tier)

---

## Step 1: Create Separate Backend Repository

### 1.1 Copy Backend Files
```powershell
# Navigate to project directory
cd C:\Projects2\CourtScheduling

# Copy server files to tennis-backend (if creating new repo)
# OR work directly with existing tennis-backend directory
cd tennis-backend
```

### 1.2 Initialize Git Repository (if new repo)
```powershell
# Only if creating new repository
git init
git branch -m main
git config user.email "your-email@example.com"
git config user.name "Your Name"
git add .
git commit -m "Initial backend setup for deployment"
```

### 1.3 Create GitHub Repository
1. Go to https://github.com
2. Click "New repository"
3. Name: `tennis-backend`
4. Keep it public
5. Don't initialize with README (we already have files)
6. Click "Create repository"

### 1.4 Push to GitHub
**Method 1: Using Personal Access Token**
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with "repo" scope
3. Use token to push:
```powershell
git remote add origin https://[YOUR_TOKEN]@github.com/[USERNAME]/tennis-backend.git
git push -u origin main
```

**Method 2: Manual Upload (Alternative)**
1. Go to repository on GitHub
2. Click "uploading an existing file"
3. Upload all files EXCEPT:
   - `node_modules/` (never upload this)
   - `.env` (contains secrets)
4. Commit changes

---

## Step 2: Deploy to Render

### 2.1 Create Render Account
1. Go to https://render.com
2. Sign up for free account
3. Connect GitHub account

### 2.2 Create Web Service
1. Click "New +" → "Web Service"
2. Click "Build and deploy from a Git repository"
3. Select your `tennis-backend` repository
4. Configure deployment settings:
   - **Name**: `tennis-backend` (or your preferred name)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 2.3 Deploy
1. Click "Deploy Web Service"
2. Watch build logs
3. **Expected Result**: Deployment will likely fail initially due to missing MongoDB connection

---

## Step 3: Fix Common Issues

### 3.1 Case-Sensitivity Errors
**Problem**: `Error: Cannot find module '../models/poll'`

**Solution**: Fix require statements to match actual file names
- If you have `Poll.js`, use `require('../models/Poll')`
- If you have `player.js`, use `require('../models/player')`

**Fix on GitHub:**
1. Go to repository → `routes/polls.js`
2. Edit line 3: Change `require('../models/poll')` to `require('../models/Poll')`
3. Repeat for other files as needed
4. Commit changes → Render auto-redeploys

### 3.2 Required File Structure
Ensure your repository contains:
```
tennis-backend/
├── app.js
├── package.json
├── package-lock.json
├── bin/
│   └── www
├── models/
│   ├── Poll.js
│   └── player.js
├── routes/
│   ├── index.js
│   ├── players.js
│   ├── polls.js
│   ├── users.js
│   └── activity-logs.js  # NEW: Activity logging endpoint
├── scripts/
│   ├── seed-poll.js
│   └── seedPlayers.js
└── public/
    └── (static files)
```

---

## Step 4: Configure MongoDB Connection

### 4.1 Get MongoDB Connection String
From MongoDB Atlas, get connection string like:
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority&appName=AppName
```

### 4.2 Add Environment Variables in Render
1. Go to Render dashboard
2. Click on your service
3. Click "Environment" tab
4. Click "Add Environment Variable"
5. Add:
   - **Key**: `MONGODB_URI`
   - **Value**: Your MongoDB connection string
6. Click "Save Changes"
7. Render will automatically redeploy

---

## Step 5: Verify Deployment

### 5.1 Check Service Status
1. Service should show "Live" status
2. Get your service URL (e.g., `https://tennis-backend-rd31.onrender.com`)

### 5.2 Test API Endpoints
Test key endpoints:
- `GET /players` - Should return player data
- `GET /polls` - Should return poll data
- `GET /activity-logs` - Should return activity log data (NEW)
- `POST /activity-logs` - Should accept new log entries (NEW)
- Health check endpoints

### 5.3 Common Test URLs
```
https://your-service-url.onrender.com/players
https://your-service-url.onrender.com/polls
https://your-service-url.onrender.com/activity-logs
```

---

## Step 6: Update Frontend Configuration

### 6.1 Update Production Environment
Edit `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-service-url.onrender.com'
};
```

---

## Troubleshooting Common Issues

### Issue: Module Not Found Errors
**Cause**: Case-sensitivity differences between Windows/Linux
**Solution**: Ensure require statements match exact file names

### Issue: MongoDB Connection Timeout
**Cause**: Missing or incorrect MONGODB_URI environment variable
**Solution**: Double-check connection string and environment variable

### Issue: Deployment Fails
**Cause**: Missing package.json or incorrect start command
**Solution**: Ensure package.json has correct start script: `"start": "node ./bin/www"`

### Issue: 503 Service Unavailable
**Cause**: Application crashed on startup
**Solution**: Check logs in Render dashboard for error details

---

## Final Deployment Result

✅ **Successful Backend Deployment:**
- **Service URL**: https://tennis-backend-rd31.onrender.com
- **GitHub Repository**: https://github.com/roel-sundiam/tennis-backend
- **MongoDB**: Connected and functional
- **API Endpoints**: Working and accessible

---

## Notes
- Render free tier may have cold starts (service sleeps after inactivity)
- First request after inactivity may take 10-30 seconds
- Consider upgrading to paid tier for production use
- Monitor logs regularly for any issues

---

## Step 7: Making Updates After Initial Deployment

### 7.1 Standard Git Workflow for Updates
After your initial deployment, you can make updates using standard git commands:

```powershell
# Navigate to backend directory
cd C:\Projects2\CourtScheduling\tennis-backend

# Check current status
git status

# Stage all changes
git add .

# Commit changes with descriptive message
git commit -m "Add activity logs endpoint for user monitoring"

# Push to GitHub
git push origin main
```

### 7.2 Automatic Deployment Process
**What happens after `git push`:**
1. Changes are pushed to GitHub repository
2. **Render automatically detects the GitHub push**
3. **Render triggers a new deployment automatically** 🚀
4. You can monitor the deployment in Render dashboard
5. Once complete, changes are live at your service URL

### 7.3 Monitoring Updates
1. Go to Render dashboard
2. Click on your service
3. Check "Deploys" tab to see deployment status
4. View logs to monitor build progress
5. Service status will show "Deploying..." then "Live"

### 7.4 Update Workflow Tips
- Always test changes locally first
- Use descriptive commit messages
- Monitor Render logs for any deployment issues
- Changes are typically live within 1-2 minutes

---

## Recent Updates

### July 12, 2025 - Activity Logs Feature Added

**New Backend Features:**
- **Activity Logs API**: `/routes/activity-logs.js` endpoint with RoelSundiam authentication
- **MongoDB Schema**: Activity log collection with indexing
- **User Tracking**: Captures anonymous and authenticated user activity
- **Statistics Endpoint**: Aggregated user activity data
- **Security**: Access restricted to username `RoelSundiam` only

**Required Files for Activity Logs:**
```
tennis-backend/
├── routes/activity-logs.js    # NEW: Activity logging routes
└── app.js                     # UPDATED: Include activity-logs route
```

**Testing Activity Logs API:**
```powershell
# Test activity logs endpoint (requires RoelSundiam authentication)
curl -H "Authorization: Bearer RoelSundiam" https://tennis-backend-rd31.onrender.com/activity-logs

# Test without authentication (should return 401/403 error)
curl https://tennis-backend-rd31.onrender.com/activity-logs

# Test posting new log entry (no authentication required for logging)
curl -X POST https://tennis-backend-rd31.onrender.com/activity-logs \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","action":"PAGE_ACCESS","page":"/test"}'
```

**Deployment Requirements:**
1. Ensure `routes/activity-logs.js` is included in your backend
2. Update `app.js` to include: `app.use('/activity-logs', activityLogsRouter);`
3. Push changes to GitHub for automatic Render deployment
4. Verify endpoint works after deployment

---

**Initial Deployment Date**: July 10, 2025  
**Last Updated**: July 12, 2025  
**Status**: ✅ Complete and Functional with Activity Logs