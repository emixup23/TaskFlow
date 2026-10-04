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

## Screenshots

```
<img width="1868" height="954" alt="Screenshot_20261004_075758" src="https://github.com/user-attachments/assets/948fb7fc-b6e4-47a6-ad4d-c17cf20b8eab" />
<img width="1868" height="954" alt="Screenshot_20261004_075709-1" src="https://github.com/user-attachments/assets/f973497c-8250-47b2-9682-39a46218080a" />
<img width="1868" height="954" alt="Screenshot_20261004_075709" src="https://github.com/user-attachments/assets/c1684b09-7a1b-41d1-913e-bab5e01fdcf3" />
<img width="1868" height="954" alt="Screenshot_20261004_075648" src="https://github.com/user-attachments/assets/a9c2965f-f378-44f5-b590-851942b3e7af" />
<img width="1868" height="954" alt="Screenshot_20261004_075617-1" src="https://github.com/user-attachments/assets/0563d058-99fd-43b8-9cbd-9d45b9cc9238" />
<img width="1865" height="955" alt="Screenshot_20261004_075538" src="https://github.com/user-attachments/assets/6646e686-1e3b-466d-ab7c-67fbe2591e64" />
<img width="1871" height="953" alt="Screenshot_20261004_075419-1" src="https://github.com/user-attachments/assets/91484e51-bdd0-4b1c-8f99-94abcab5aac0" />
<img width="1868" height="955" alt="Screenshot_20261004_075327-1" src="https://github.com/user-attachments/assets/d5797de4-8bc2-441e-922a-cb7f2e603484" />


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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
