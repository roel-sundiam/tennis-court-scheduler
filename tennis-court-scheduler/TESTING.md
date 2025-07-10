# Tennis Court Scheduler - Comprehensive Testing Checklist

This document provides a thorough manual and functional testing checklist for the Tennis Court Scheduler application. It covers both admin and non-admin (user) roles, navigation, CRUD operations, voting, calendar, and security.

---

## 1. Authentication & Authorization

- [ ] Admin can log in with valid credentials (e.g., `RoelSundiam` / `0411`)
- [ ] Admin sees admin-only menu items (Players, Poll Results)
- [ ] Non-admin cannot access admin-only pages (Players, Poll Results, Player Edit/New)
- [ ] Non-admin sees only Polls, Teams & Matches, and Calendar in the menu
- [ ] Admin can log out and is redirected to home
- [ ] Non-admin cannot access restricted URLs directly (redirected to home)

## 2. Navigation

- [ ] All menu links route to the correct pages
- [ ] "Login" and "Logout" buttons work as expected
- [ ] Username and role are displayed when logged in
- [ ] Responsive navigation works on mobile (menu collapses, all links accessible)

## 3. Players Management (Admin Only)

- [ ] Admin can view the list of players
- [ ] Admin can add a new player
- [ ] Admin can edit an existing player
- [ ] Admin can delete a player
- [ ] Admin can reorder players by drag-and-drop
- [ ] Validation errors are shown for invalid input
- [ ] Success/error messages are shown for CRUD actions

## 4. Polls & Voting

- [ ] Polls page lists all available polls
- [ ] User can vote for available dates
- [ ] Votes are saved and reflected in the UI
- [ ] Poll Results page (admin only) shows correct vote counts and voters
- [ ] Voting order is respected (first vote, first serve)
- [ ] Excess players are visually indicated (greyed out)

## 5. Teams & Matches

- [ ] Teams & Matches page lists all dates with available players
- [ ] Potential matches are generated and displayed for each date
- [ ] Team and match details are correct and update with votes
- [ ] No team generation buttons are visible (if removed)

## 6. Calendar View

- [ ] Calendar page displays a monthly grid
- [ ] Matches (past and upcoming) are shown in each date cell
- [ ] Match icons and status colors are correct
- [ ] Navigation (previous/next month, today) works
- [ ] Clicking a date shows match details (if implemented)
- [ ] Legend explains match status colors

## 7. Security & Access Control

- [ ] Non-admins cannot access admin routes via direct URL
- [ ] API endpoints for players and poll results are protected (if backend enforces roles)
- [ ] Tokens are cleared on logout
- [ ] No sensitive data is exposed to non-admins

## 8. Error Handling & Edge Cases

- [ ] User sees friendly error messages for failed actions
- [ ] App handles empty states (no players, no polls, no matches)
- [ ] App handles backend/server errors gracefully
- [ ] App handles lost connection to backend (shows error or retry)

## 9. Data Consistency

- [ ] Changes in players, polls, and votes are reflected across all relevant pages
- [ ] Calendar, Teams & Matches, and Poll Results update after voting or player changes

## 10. General UI/UX

- [ ] All pages are visually consistent and responsive
- [ ] Buttons, forms, and icons are styled and accessible
- [ ] App works on desktop and mobile browsers

## Feature/Change Testing Checklist

- [x] Replace player selection buttons with a dropdown in poll details page
- [x] Style the dropdown to match the app's design pattern using Angular Material
- [x] Fix Angular Material import errors for mat-form-field and mat-select in poll details
- [x] Switch to a native select for player selection if Material dropdown overlay issues persist
- [x] Remove 'Player Information' and 'Selected Player' texts from poll details page
- [x] Display formatted date for each poll option in poll details
- [x] Fix date visibility on hover in poll details option row
- [x] Remove 'Tomorrow' text from badge in poll details
- [x] Update teams-matches page to match app's dark theme and accent color pattern
- [x] Improve match row design in teams-matches page for modern look
- [x] Format teams in matches as [seed] Name/[seed] Name in teams-matches page
- [x] Fix Angular template errors by moving team formatting logic to a helper method
- [x] Update calendar page to match app's dark theme and accent color pattern
- [x] Fix match item background in calendar to ensure visibility
- [x] Remove the match status legend from the calendar page

---

**Tip:** For automated testing, consider using Cypress or Playwright for end-to-end tests, and Jasmine/Karma for Angular unit tests. 