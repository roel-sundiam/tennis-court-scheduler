# Git Workflow Guide - Tennis Court Scheduler

This guide provides step-by-step instructions for managing code changes with Git and GitHub.

## Prerequisites

- Git installed on your system
- GitHub repository set up
- PowerShell or command line access
- Project cloned to local machine

## Daily Git Workflow

### Step 1: Check Current Status

Before making any changes, always check the current state:

```powershell
# Navigate to your project directory
cd C:\Projects2\CourtScheduling

# Check what files have changed
git status

# See detailed changes in files
git diff

# Check current branch
git branch
```

### Step 2: Pull Latest Changes

Always pull the latest changes before starting work:

```powershell
# Pull latest changes from remote repository
git pull origin main

# If your default branch is master
git pull origin master
```

### Step 3: Make Your Changes

Work on your code changes, then check what you've modified:

```powershell
# Check status again after making changes
git status

# View changes in specific files
git diff filename.js

# View all changes
git diff
```

### Step 4: Stage Your Changes

Add files to the staging area:

```powershell
# Add all changed files
git add .

# Add specific files only
git add tennis-court-scheduler/src/app/pages/activity-logs/
git add server/routes/activity-logs.js

# Add specific file
git add frontenddeploy.md

# Check what's staged
git status
```

### Step 5: Commit Changes

Create a commit with a descriptive message:

```powershell
# Basic commit
git commit -m "Add activity logs monitoring system"

# Detailed commit with multiple lines
git commit -m "Add activity logs monitoring system

- Implement activity logging service for user tracking
- Add admin reporting dashboard at /activity-logs  
- Track anonymous users and page access
- Include statistics and filtering capabilities
- Update deployment documentation

🤖 Generated with Claude Code"
```

### Step 6: Push to GitHub

Upload your changes to the remote repository:

```powershell
# Push to main branch
git push origin main

# Or if your default branch is master
git push origin master

# Force push (use with caution)
git push --force origin main
```

## Quick Commands

### One-liner for Simple Changes
```powershell
# Add, commit, and push in one command
git add . && git commit -m "Quick fix" && git push origin main
```

### Check Recent History
```powershell
# View recent commits
git log --oneline -10

# View detailed log
git log --graph --pretty=format:'%h -%d %s (%cr) <%an>' --abbrev-commit -10
```

### Undo Changes
```powershell
# Undo changes to a specific file (before staging)
git checkout -- filename.js

# Unstage a file
git reset HEAD filename.js

# Undo last commit (keeps changes)
git reset --soft HEAD~1

# Undo last commit (discards changes) - DANGEROUS
git reset --hard HEAD~1
```

## Branch Management

### Working with Branches

```powershell
# Create new branch
git checkout -b feature/activity-logs

# Switch to existing branch
git checkout main

# List all branches
git branch -a

# Delete local branch
git branch -d feature/activity-logs

# Push new branch to remote
git push -u origin feature/activity-logs
```

### Merging Changes

```powershell
# Switch to main branch
git checkout main

# Merge feature branch
git merge feature/activity-logs

# Push merged changes
git push origin main
```

## Specific Tennis Court Scheduler Workflows

### Frontend Changes Workflow

```powershell
# Navigate to frontend
cd C:\Projects2\CourtScheduling\tennis-court-scheduler

# Test build locally
npm run build

# Go back to root for git commands
cd ..

# Commit and push
git add tennis-court-scheduler/
git commit -m "Update frontend: improve activity logs UI"
git push origin main
```

### Backend Changes Workflow

```powershell
# Test backend locally
cd C:\Projects2\CourtScheduling\server
npm start

# Go back to root for git commands
cd ..

# Commit and push
git add server/
git commit -m "Update backend: add activity logs API endpoint"
git push origin main
```

### Full Stack Changes Workflow

```powershell
# Add all changes
git add .

# Create comprehensive commit
git commit -m "Implement complete activity logging system

Frontend:
- Add ActivityLoggerService for user tracking
- Create admin dashboard at /activity-logs
- Add filtering and statistics features
- Update routing and navigation

Backend:
- Add /routes/activity-logs.js endpoint
- Implement MongoDB schema for logs
- Add IP tracking and session management
- Include statistics aggregation

Documentation:
- Update frontenddeploy.md with new features
- Add testing checklist for activity logs"

# Push changes
git push origin main
```

## Deployment Integration

### Before Deploying to Netlify

```powershell
# Ensure all changes are committed
git status

# Should show "nothing to commit, working tree clean"

# Push any pending changes
git push origin main

# Build and deploy
npm run build
# Then drag dist/tennis-court-scheduler to Netlify
```

### Backend Deployment to Render

After pushing to GitHub:

1. **Render Auto-Deploy**: If connected to GitHub, Render automatically deploys
2. **Manual Deploy**: Trigger deploy from Render dashboard
3. **Check Logs**: Monitor deployment logs for any errors

```powershell
# Check if backend is live after deployment
curl https://tennis-backend-rd31.onrender.com/players
```

## Troubleshooting

### Common Issues

1. **Merge Conflicts**:
```powershell
# View conflicted files
git status

# Edit files to resolve conflicts, then:
git add .
git commit -m "Resolve merge conflicts"
```

2. **Forgot to Pull Before Changes**:
```powershell
# Stash your changes
git stash

# Pull latest
git pull origin main

# Apply your changes back
git stash pop
```

3. **Accidental Commit**:
```powershell
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Edit and recommit
git add .
git commit -m "Corrected commit message"
```

4. **Large Files Issue**:
```powershell
# Remove large files from staging
git reset HEAD large-file.zip

# Add to .gitignore
echo "*.zip" >> .gitignore
echo "node_modules/" >> .gitignore
```

### Best Practices

1. **Commit Messages**:
   - Use present tense: "Add feature" not "Added feature"
   - Be descriptive: "Fix activity logs pagination bug"
   - Reference issues: "Fix #123: resolve login redirect"

2. **Commit Frequency**:
   - Commit often with small, logical changes
   - Don't commit broken code to main branch
   - Test locally before committing

3. **File Management**:
   - Keep `.gitignore` updated
   - Don't commit `node_modules/`, `dist/`, or `.env` files
   - Commit documentation updates with code changes

## Repository Structure

```
CourtScheduling/
├── tennis-court-scheduler/     # Angular frontend
├── server/                     # Express.js backend  
├── tennis-backend/            # Alternative backend
├── frontenddeploy.md          # Netlify deployment guide
├── backenddeploy.md           # Render deployment guide
├── git-workflow.md            # This file
├── todotomorrow.md            # Development progress
└── README.md                  # Project overview
```

## Integration with External Services

### GitHub → Render (Backend)
- Push to `main` triggers automatic deployment
- Monitor deployment status in Render dashboard
- Check deployment logs for errors

### GitHub → Netlify (Frontend)
- Manual deployment: drag `dist/` folder to Netlify
- Auto deployment: connect GitHub repo to Netlify
- Configure build settings in Netlify dashboard

### Local → Production Testing
```powershell
# Test full stack locally before deploying
cd C:\Projects2\CourtScheduling\server
npm start     # Start backend on :3000

# In another terminal
cd C:\Projects2\CourtScheduling\tennis-court-scheduler  
npm start     # Start frontend on :4200

# Test features end-to-end
# Then commit and deploy
```

---

## Quick Reference Commands

```powershell
# Daily workflow
git pull origin main
# ... make changes ...
git add .
git commit -m "Descriptive message"
git push origin main

# Check status
git status
git log --oneline -5

# Emergency rollback
git reset --hard HEAD~1  # CAREFUL: Loses changes
git push --force origin main
```

**Last updated**: July 12, 2025