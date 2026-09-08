# TaskFlow

A collaborative task management platform with gamification, role-based access control, customizable workflows, activity audit logs, and administrator analytics.

## Features

- **Task & Workflow Management** — Create, assign, and track tasks through customizable workflows tailored to your team's process.
- **Gamification** — XP progression, kudos-based rewards, and celebratory feedback (confetti effects) to drive engagement.
- **Role-Based Access Control (RBAC)** — Fine-grained permissions so users only see and do what their role allows.
- **Activity Audit Logs** — Full history of actions taken across the platform for accountability and traceability.
- **Administrator Analytics** — Data visualizations (via D3) giving admins insight into team activity and progress.
- **Secure Authentication** — Password hashing handled with bcrypt.

## Tech Stack

**Frontend**
- [React 19](https://react.dev/) + TypeScript
- [Vite 6](https://vitejs.dev/) — build tooling and dev server
- [Tailwind CSS 4](https://tailwindcss.com/)
- [D3.js](https://d3js.org/) — analytics/data visualization
- [Motion](https://motion.dev/) — animations
- [Lucide React](https://lucide.dev/) — icons
- [Prism.js](https://prismjs.com/) — syntax highlighting
- [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) — gamification effects

**Backend**
- [Express](https://expressjs.com/) (`server.ts`, run via `tsx`)
- [bcryptjs](https://www.npmjs.com/package/bcryptjs) — password hashing
- [@google/genai](https://www.npmjs.com/package/@google/genai) — Google Gemini API integration
- [dotenv](https://www.npmjs.com/package/dotenv) — environment configuration

**Tooling**
- TypeScript, ESBuild, Autoprefixer

## Project Structure

```
TaskFlow/
├── public/              # Static assets
├── src/                 # Application source code
├── assets/.aistudio     # Project assets
├── server.ts            # Express backend entry point
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── .env.example         # Environment variable template
└── package.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- npm, or [bun](https://bun.sh/) (a `bun.lock` is included)

### Installation

```bash
git clone https://github.com/emixup23/TaskFlow.git
cd TaskFlow
npm install
```

### Environment Setup

Copy the example environment file and fill in your own values (e.g. your Gemini API key, session/auth secrets):

```bash
cp .env.example .env
```

### Development

Run the app in development mode (starts the Express server via `tsx`):

```bash
npm run dev
```

### Build & Production

```bash
npm run build   # Builds the frontend (Vite) and bundles the server (esbuild)
npm run start   # Runs the production server from dist/
```

### Other Scripts

| Command          | Description                              |
|-------------------|-------------------------------------------|
| `npm run preview`  | Preview the production frontend build     |
| `npm run lint`      | Type-check the project (`tsc --noEmit`)   |
| `npm run clean`     | Remove build output (`dist/`, `server.js`) |

## Contributing

Issues and pull requests are welcome. If you plan a larger change, please open an issue first to discuss what you'd like to change.

## License

No license has been specified for this project yet. Add a `LICENSE` file to clarify usage rights, or reach out to the repository owner for details.
