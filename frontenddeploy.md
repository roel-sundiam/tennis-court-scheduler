# Frontend Deployment Guide - Netlify

This guide provides step-by-step instructions for deploying the Tennis Court Scheduler Angular frontend to Netlify.

## Prerequisites

- Angular frontend built successfully (`npm run build`)
- Netlify account (free tier available)
- Production environment configured with backend URL

## Step 1: Build the Angular Application

1. **Navigate to the frontend directory**:
   ```powershell
   cd C:\Projects2\CourtScheduling\tennis-court-scheduler
   ```

2. **Install dependencies** (if not already done):
   ```powershell
   npm install --legacy-peer-deps
   ```

3. **Build for production**:
   ```powershell
   npm run build
   ```

4. **Verify build output**:
   - Check that `dist/tennis-court-scheduler/browser` folder exists
   - Should contain files: `index.html`, `main-*.js`, `polyfills-*.js`, `styles-*.css`, `favicon.ico`

## Step 2: Prepare for Deployment

1. **Verify environment configuration**:
   - Check `src/environments/environment.prod.ts` has correct backend URL
   - Should point to: `https://tennis-backend-rd31.onrender.com`

2. **Build output location**:
   - **Deploy folder**: `dist/tennis-court-scheduler/browser`
   - This folder contains all files needed for deployment

## Step 3: Deploy to Netlify

### Option A: Manual Deployment (Recommended for first deployment)

1. **Go to Netlify**:
   - Visit [https://netlify.com](https://netlify.com)
   - Sign up or log in to your account

2. **Create new site**:
   - Click "Add new site" → "Deploy manually"
   - You'll see a drag-and-drop area

3. **Deploy the build**:
   - Drag and drop the entire `dist/tennis-court-scheduler/browser` folder to the deployment area
   - **Important**: Drop the `browser` folder itself, not its contents
   - Wait for deployment to complete (usually 1-2 minutes)

4. **Get your site URL**:
   - Netlify will provide a URL like: `https://random-name-123456.netlify.app`
   - Save this URL for testing

### Option B: Netlify CLI Deployment

1. **Install Netlify CLI** (if not already installed):
   ```powershell
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```powershell
   netlify login
   ```

3. **Deploy from the Angular project directory**:
   ```powershell
   cd C:\Projects2\CourtScheduling\tennis-court-scheduler
   netlify deploy --prod
   ```

4. **Link to existing site** (if prompted):
   - Choose: "Link this directory to an existing site"
   - Select: "Search by full or partial site name"
   - Enter your site name: `silly-llama-a2ab6f` (or your site name)

5. **Set publish directory**:
   - When prompted for publish directory, enter: `dist/tennis-court-scheduler/browser`

### Option C: Git-based Deployment (For future updates)

1. **Connect repository**:
   - Click "Add new site" → "Import from Git"
   - Connect your GitHub account
   - Select your repository

2. **Configure build settings**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist/tennis-court-scheduler/browser`
   - **Base directory**: `tennis-court-scheduler`

## Step 4: Configure Custom Domain (Optional)

1. **Custom domain setup**:
   - Go to Site settings → Domain management
   - Add your custom domain
   - Follow DNS configuration instructions

## Step 5: Test the Deployment

### Basic Functionality Test

1. **Visit your Netlify URL**
2. **Test core features**:
   - [ ] Page loads correctly
   - [ ] Navigation works
   - [ ] Poll voting page displays
   - [ ] Player management (admin login)

### Admin Testing

1. **Login as admin**:
   - Username: `RoelSundiam`, Password: `0411`
   - Or Username: `VGTennisMorningCub`, Password: `VGTennis123`

2. **Test admin features**:
   - [ ] Player management page
   - [ ] Poll results page
   - [ ] Team generation
   - [ ] Activity logs page (new feature)

### API Integration Testing

1. **Check API connectivity**:
   - Open Developer Tools (F12)
   - Check Network tab for API calls
   - Verify calls go to: `https://tennis-backend-rd31.onrender.com`

2. **Test data flow**:
   - [ ] Players load from backend
   - [ ] Poll data displays correctly
   - [ ] Voting functionality works
   - [ ] Poll dates show correct rolling window (starting tomorrow)
   - [ ] Activity logging works (check Network tab for /activity-logs calls)

## Step 6: Environment Configuration

### Production Environment Check

Verify `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tennis-backend-rd31.onrender.com'
};
```

### Routing Configuration

The `_redirects` file should contain:
```
/*    /index.html   200
```

## Troubleshooting

### Common Issues

1. **404 errors on page refresh**:
   - Ensure `_redirects` file is in the build output
   - Check Angular routing configuration

2. **API calls failing**:
   - Verify backend URL in environment.prod.ts
   - Check CORS settings on backend
   - Confirm backend is running on Render

3. **Build fails**:
   - Check for TypeScript errors
   - Verify all dependencies are installed
   - Review build console output

### Debug Steps

1. **Check browser console** for JavaScript errors
2. **Check Network tab** for failed API requests
3. **Verify backend health** at `https://tennis-backend-rd31.onrender.com/players`

## Deployment URLs

- **Frontend (Netlify)**: `https://your-site-name.netlify.app`
- **Backend (Render)**: `https://tennis-backend-rd31.onrender.com`
- **GitHub Repository**: `https://github.com/roel-sundiam/tennis-backend`

## Future Deployments

### Automatic Deployments

If using Git-based deployment:
1. Push changes to your repository
2. Netlify automatically rebuilds and deploys
3. Check deployment status in Netlify dashboard

### Manual Updates

1. Run `npm run build` locally
2. Drag and drop new `dist/tennis-court-scheduler/browser` folder to Netlify
3. Old deployment is automatically replaced

## Performance Optimization

### Build Optimization

- **Bundle analysis**: Use `npm run build -- --stats-json` to analyze bundle size
- **Lazy loading**: Implement for large features
- **Image optimization**: Compress images before including

### Netlify Features

- **CDN**: Automatic global content delivery
- **HTTPS**: SSL certificate automatically provided
- **Form handling**: Built-in form processing
- **Edge functions**: Serverless functions at edge locations

## Security Considerations

1. **Environment variables**: Never commit sensitive data
2. **HTTPS**: Always use HTTPS in production
3. **API security**: Ensure backend has proper authentication
4. **Content Security Policy**: Consider implementing CSP headers

## Monitoring

### Netlify Analytics

- **Site performance**: Page load times
- **Traffic data**: Visitor statistics
- **Error tracking**: 404s and failed requests

### Backend Monitoring

- **Render logs**: Check backend application logs
- **API health**: Monitor endpoint availability
- **Database connectivity**: Verify MongoDB connections

---

**Note**: This documentation assumes the backend is already deployed to Render. Make sure to push any backend changes to GitHub before testing the full integration.

## Recent Updates

### July 12, 2025 - Activity Logs Feature Added

**New Features:**
- **Activity Logs Page**: Admin-only reporting dashboard at `/activity-logs`
- **Anonymous User Tracking**: Logs users who access pages without authentication
- **Comprehensive Monitoring**: Tracks page access, votes, team generation, login/logout
- **Advanced Filtering**: Filter by user, role, action type, page, date range
- **Statistics Dashboard**: Overview cards with usage analytics

**Backend Requirements:**
- Ensure your deployed backend includes the `/routes/activity-logs.js` endpoint
- The activity logging will automatically start working once deployed

**Testing Activity Logs:**
1. **Login as RoelSundiam**: Use username `RoelSundiam` and password `0411`
2. **Access `/activity-logs`**: Only RoelSundiam can access this page
3. **Check logging**: Verify that page visits are being logged
4. **Test security**: Other admin users should see "Access denied" message
5. **Verify tracking**: Anonymous users (non-logged in) are still tracked
6. **Test features**: Filtering and statistics work for RoelSundiam

**Last updated**: July 12, 2025