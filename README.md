# 🎾 Tennis Court Scheduler

A modern web application for organizing tennis matches through a voting system that automatically balances teams for doubles play.

## ✨ Features

### 🗳️ Smart Voting System
- **Rolling 7-day window**: Always shows upcoming dates starting from tomorrow
- **Duplicate vote prevention**: Players can't vote for the same date twice
- **Real-time updates**: Vote changes reflected immediately across all users

### 👥 Player Management
- **Seed-based ranking system**: Players organized by skill level
- **Role-based access**: Admin controls for player management
- **Beautiful player selector**: Modern dropdown with avatars and player info

### 🎯 Automatic Team Balancing
- **Doubles match optimization**: Ensures multiples of 4 players
- **Excess player handling**: Visual indication of players who can't form complete matches
- **First-come-first-serve**: Vote order determines priority for match participation

### 📅 Dynamic Scheduling
- **Auto-refreshing dates**: Poll dates update automatically each day
- **Vote preservation**: Keeps valid votes when transitioning between date windows
- **Calendar integration**: Visual calendar showing scheduled matches

## 🛠️ Tech Stack

### Frontend
- **Angular 17** with standalone components
- **Angular Material** for modern UI components
- **TypeScript** for type safety
- **SCSS** for advanced styling

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **RESTful API** design
- **CORS** enabled for cross-origin requests

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/roel-sundiam/tennis-court-scheduler.git
   cd tennis-court-scheduler
   ```

2. **Set up the backend**
   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file in server directory
   echo "MONGODB_URI=your_mongodb_connection_string" > .env
   ```

4. **Seed the database** (optional)
   ```bash
   node scripts/seedPlayers.js
   node scripts/seed-poll.js
   ```

5. **Start the backend server**
   ```bash
   npm start
   # Server runs on http://localhost:3000
   ```

6. **Set up the frontend**
   ```bash
   cd ../tennis-court-scheduler
   npm install
   ```

7. **Start the frontend development server**
   ```bash
   npm start
   # App runs on http://localhost:4200
   ```

## 🎮 Usage

### For Players
1. **Visit the app** and select your name from the dropdown
2. **Vote for dates** you're available to play tennis
3. **View other players** who voted for the same dates
4. **Check the calendar** to see scheduled matches

### For Admins
- **Login** with admin credentials (username: `RoelSundiam`, password: `0411`)
- **Manage players**: Add, edit, or remove players and their seed rankings
- **View poll results**: See detailed voting statistics
- **Monitor scheduling**: Track team formation and match organization

## 🏗️ Project Structure

```
tennis-court-scheduler/
├── server/                 # Backend Express.js application
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── scripts/           # Database seeding scripts
│   └── app.js            # Main server file
├── tennis-court-scheduler/ # Frontend Angular application
│   ├── src/app/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── services/      # Business logic and API calls
│   │   └── models/        # TypeScript interfaces
│   └── src/assets/        # Static assets
└── README.md
```

## 🔧 Key Components

### Backend API Endpoints
- `GET /polls` - Retrieve all polls with auto-refreshed dates
- `GET /polls/:id` - Get specific poll with current voting data
- `POST /polls/:id/vote` - Submit or update player votes
- `GET /players` - Get all players with seed rankings

### Frontend Pages
- **Home**: Welcome page with app overview and vote button
- **Poll Details**: Interactive voting interface with player selection
- **Teams & Matches**: View generated teams and match schedules
- **Calendar**: Monthly view of scheduled tennis matches
- **Admin Panel**: Player management and poll administration

## 🎯 Tennis Rules Integration

The app follows standard tennis doubles rules:
- **4 players per match**: Automatic team balancing ensures complete doubles teams
- **Seed-based ranking**: Players organized by skill level for fair team distribution
- **Match capacity**: Handles multiple simultaneous matches based on player availability

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Roel Sundiam** - [GitHub](https://github.com/roel-sundiam)

---

*Built with ❤️ for the tennis community*