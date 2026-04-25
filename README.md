# Twilight-agenda
Twilight Imperium + Hidden Agenda. What a great pairing but add the council of Kleleres with Emelpar and Booster Stims and you gotta pass a lot of voting sheets around. This web-app aims to modernize that process.

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure Firebase
# Edit src/environments/environment.ts and replace placeholder values
# with your actual Firebase project credentials from the Firebase console.

# 3. Run development server
npm start
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Firestore Database** in test mode
4. Go to Project Settings → Your Apps → Add Web App
5. Copy the config object and paste the values into `src/environments/environment.ts`

### Project Structure

```
src/app/
├── app.component.ts       # Root shell component (just router-outlet)
├── app.config.ts          # App providers: Router, Firebase, Firestore
├── app.routes.ts          # Route definitions
├── components/
│   ├── lobby/             # Landing page: create or join a session
│   ├── host/              # Host view: manage voting session
│   └── player/            # Player view: cast votes
└── services/
    └── session.service.ts # Firestore CRUD for sessions
```

### How It Works

- **Host** creates a session → gets a session code → shares it with players
- **Players** enter the code → join the session → wait for voting to start
- **Host** starts voting → players cast FOR/AGAINST/ABSTAIN votes
- **Host** reveals results → all players see the outcome in real time (via Firestore onSnapshot)
