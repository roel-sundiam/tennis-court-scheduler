# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture Overview

This is a tennis court scheduling application with a full-stack architecture:

**Frontend (Angular 17):**
- Located in `tennis-court-scheduler/` directory
- Uses Angular Material for UI components
- Implements role-based authentication (admin vs regular users)
- Pages: poll voting, poll results, player management, teams/matches, calendar

**Backend (Express.js):**
- Located in `server/` directory  
- REST API with MongoDB/Mongoose for data persistence
- Routes: players, polls, users
- Models: Player (name, seed), Poll (with voting options and votes)

## Development Commands

**Frontend (from tennis-court-scheduler/ directory):**
```bash
npm run start          # Development server on http://localhost:4200
npm run build          # Production build
npm run test           # Run unit tests with Karma/Jasmine
npm run watch          # Build and watch for changes
```

**Backend (from server/ directory):**
```bash
npm start              # Start Express server
```

## Key Application Features

- **Poll Voting System**: Users vote on available tennis dates/times
- **Player Management**: Admins can CRUD players with seed rankings
- **Team Generation**: Automatic team/match creation based on poll results
- **Calendar View**: Monthly calendar showing scheduled matches
- **Role-Based Access**: Admin routes protected by `adminGuard`

## Database Models

- **Player**: `name` (string), `seed` (number)
- **Poll**: `title`, `description`, `options[]` (date/time), `votes[]` (player votes)

## Authentication Flow

- Admin login: username `RoelSundiam`, password `0411`
- Admin-only routes: `/players/*`, `/poll/:id/results`
- Auth service manages role-based access control

## Environment Setup

- Backend requires MongoDB connection via `MONGODB_URI` environment variable
- Frontend uses Angular Material theming with dark theme
- CORS enabled between frontend and backend

## Testing

- Comprehensive manual testing checklist available in `tennis-court-scheduler/TESTING.md`
- Unit tests configured with Jasmine/Karma for Angular components
- No automated e2e tests currently configured