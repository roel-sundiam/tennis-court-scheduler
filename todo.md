# Tennis Court Scheduler - TODO List

## 🔐 Authentication & Authorization

### Admin-Only Features
- [ ] **Restrict poll results page access** (`/poll/1/results`)
  - Only admin users should be able to access the team generation features
  - Non-admin users should be redirected or shown an access denied message
  
- [ ] **Update navigation menu** 
  - Hide "Poll Results" link from navigation for non-admin users
  - Only show admin-specific menu items when user is logged in as admin
  
- [ ] **Add route guards**
  - Implement `AdminGuard` to protect admin-only routes
  - Add `CanActivate` guard to `/poll/:id/results` routes
  
- [ ] **Update UI conditionally**
  - Show/hide admin features based on user role
  - Display appropriate messaging for unauthorized access attempts

## 🎾 Future Enhancements

### Potential Features
- [ ] **Player management** (admin only)
  - Add/edit/remove players
  - Update player seed rankings
  
- [ ] **Match history**
  - Track generated matches and results
  - Show statistics and player performance
  
- [ ] **Email notifications**
  - Send match schedules to participants
  - Remind players of upcoming games

### UI/UX Improvements
- [ ] **Loading states**
  - Add loading spinners for team generation
  - Show progress indicators for long operations
  
- [ ] **Error handling**
  - Better error messages for failed operations
  - Retry mechanisms for network issues

## 🏗️ Currently In Progress
- *No active tasks*

## ✅ Recently Completed
- [x] **Teams & Matches page complete redesign** (`/teams-matches`)
  - [x] Fixed vote data structure to use poll-level votes
  - [x] Integrated with generated teams from admin
  - [x] Applied tennis court theme design
  - [x] Added backend support for storing generated teams
- [x] Fixed dropdown styling issues
- [x] Implemented custom HTML select element
- [x] Added tennis-themed design to poll results page
- [x] Fixed team generation algorithms (Skill-level Groups)
- [x] Improved responsive design

---

**Priority**: Authentication & Authorization items should be addressed first to ensure proper access control.