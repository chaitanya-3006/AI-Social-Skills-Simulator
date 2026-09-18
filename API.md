# SocialSim API Reference

> **SocialSim** — AI Social Skills Simulator  
> Comprehensive documentation for the frontend API module (`src/lib/api.ts`), TypeScript data models (`src/lib/mock-data.ts`), client-side Zustand stores (`src/lib/auth-store.ts` & `src/lib/simulation-store.ts`), and the backend endpoint contract.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Data Models & Types](#data-models--types)
  - [User & Auth Models](#user--auth-models)
  - [Skill Model](#skill-model)
  - [Scenario Model](#scenario-model)
  - [Message Model](#message-model)
  - [Difficulty Type](#difficulty-type)
- [1. Authentication APIs](#1-authentication-apis)
  - [`POST /api/auth/register` (`api.register`)](#post-apiauthregister)
  - [`POST /api/auth/login` (`api.login`)](#post-apiauthlogin)
  - [`GET /api/auth/me` (`api.getMe`)](#get-apiauthme)
- [2. Skills APIs](#2-skills-apis)
  - [`GET /api/skills` (`api.getSkills`)](#get-apiskills)
  - [`GET /api/skills/:skill_id` (`api.getSkillById`)](#get-apiskillsskill_id)
- [3. Simulation APIs](#3-simulation-apis)
  - [`POST /api/simulation/start` (`api.startSimulation`)](#post-apisimulationstart)
  - [`POST /api/chat` (`api.sendMessage`)](#post-apichat)
  - [`POST /api/simulation/end` (`api.endSimulation`)](#post-apisimulationend)
  - [`GET /api/evaluation/:sessionId` (`api.getEvaluation`)](#get-apievaluationsessionid)
  - [`GET /api/history` (`api.getHistory`)](#get-apihistory)
  - [`GET /api/progress` (`api.getProgress`)](#get-apiprogress)
- [Client-Side State Stores](#client-side-state-stores)
  - [Auth Store (`src/lib/auth-store.ts`)](#auth-store)
  - [Simulation Store (`src/lib/simulation-store.ts`)](#simulation-store)
- [Mock Data & Local Persistence](#mock-data--local-persistence)
- [FastAPI Backend Migration Guide](#fastapi-backend-migration-guide)
- [Endpoint Quick Reference](#endpoint-quick-reference)

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React Frontend Pages                          │
│   (/login, /register, /dashboard, /practice/skill, /practice/session) │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       src/lib/auth-store.ts          │  │ src/lib/simulation-store.ts  │
│  (user, token, isAuthenticated,      │  │ (selectedSkill, scenario,    │
│   login, register, logout, initAuth) │  │  difficulty, messages[])     │
└──────────────────┬───────────────────┘  └──────────┬───────────────────┘
                   │                                 │
                   └────────────────┬────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            src/lib/api.ts                              │
│         Single API client module for all backend communication         │
│  (Stateful mock implementation with simulated latency & JWT tokens)    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ maps directly to
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend (Ready)                         │
│   Auth:       POST /api/auth/register | POST /api/auth/login           │
│               GET  /api/auth/me                                        │
│   Skills:     GET  /api/skills        | GET  /api/skills/{skill_id}    │
│   Simulation: POST /api/simulation/start | POST /api/chat              │
│               POST /api/simulation/end   | GET  /api/evaluation/{id}   │
│               GET  /api/history          | GET  /api/progress          │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Data Models & Types

Defined in [`src/lib/mock-data.ts`](./src/lib/mock-data.ts).

### User & Auth Models

```ts
export interface User {
  id: string;        // e.g. "usr_123"
  name: string;      // e.g. "Chaitanya"
  email: string;     // e.g. "user@example.com"
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  user_id: string;
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string; // "bearer"
  user?: User;
}
```

---

### Skill Model

```ts
export interface Skill {
  id: string;          // slug identifier e.g. "communication"
  name: string;        // display name e.g. "Communication"
  description: string; // description for practice card
  icon?: string;       // icon identifier e.g. "message-circle" | "mic" | "ear"
  score?: number;      // 0–100 mastery score
}
```

---

### Scenario Model

```ts
export interface Scenario {
  id: string;              // unique slug e.g. "networking-event"
  skillId: string;         // foreign key -> Skill.id
  title: string;           // scenario title
  description: string;     // prompt background
  characterName: string;   // AI persona name
  characterRole: string;   // AI persona role
  characterStatus: string; // "Online" | "Busy" | "Offline"
  characterTags: string[]; // ['Friendly', 'Talkative', 'Curious']
  avatarUrl: string;       // avatar SVG URL
}
```

---

### Message Model

```ts
export interface Message {
  id: string;           // e.g. "msg_1726488123456"
  role: 'user' | 'ai'; // author
  content: string;      // message content
  timestamp: string;    // ISO 8601 string
}
```

---

### Difficulty Type

```ts
export type Difficulty = 'easy' | 'medium' | 'hard';
```

---

## 1. Authentication APIs

### `POST /api/auth/register`

Creates a new user account.

- **Function:** `api.register(data: RegisterRequest): Promise<RegisterResponse>`
- **Auth Required:** No

#### Request Body
```json
{
  "name": "Chaitanya",
  "email": "user@example.com",
  "password": "password123"
}
```

#### Response (`201 Created` / `200 OK`)
```json
{
  "user_id": "usr_1726488000000",
  "name": "Chaitanya",
  "email": "user@example.com"
}
```

#### Frontend Usage Example
```tsx
import { api } from '../lib/api';

const res = await api.register({
  name: "Chaitanya",
  email: "user@example.com",
  password: "password123"
});
console.log("Registered user ID:", res.user_id);
```

---

### `POST /api/auth/login`

Authenticates credentials and returns a signed JWT bearer token.

- **Function:** `api.login(data: LoginRequest): Promise<LoginResponse>`
- **Auth Required:** No

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Response (`200 OK`)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "usr_1726488000000",
    "name": "Chaitanya",
    "email": "user@example.com"
  }
}
```

#### Frontend Usage Example
```tsx
import { useAuthStore } from '../lib/auth-store';

const { login } = useAuthStore();
await login({ email: "user@example.com", password: "password123" });
```

---

### `GET /api/auth/me`

Retrieves the profile of the currently logged-in user using the Bearer token.

- **Function:** `api.getMe(token?: string): Promise<User>`
- **Auth Required:** Yes (`Authorization: Bearer <access_token>`)

#### Response (`200 OK`)
```json
{
  "id": "usr_123",
  "name": "Chaitanya",
  "email": "chaitanya@example.com"
}
```

#### Frontend Usage Example
```tsx
import { api } from '../lib/api';

const currentUser = await api.getMe();
console.log("Logged in user:", currentUser.name);
```

---

## 2. Skills APIs

### `GET /api/skills`

Returns the full catalog of available social skills for practice.

- **Function:** `api.getSkills(): Promise<Skill[]>`
- **Auth Required:** No / Optional

#### Response (`200 OK`)
```json
[
  {
    "id": "communication",
    "name": "Communication",
    "description": "Practice expressing your thoughts clearly and persuasively",
    "icon": "message-circle",
    "score": 80
  },
  {
    "id": "confidence",
    "name": "Confidence",
    "description": "Practice speaking with assurance, presence, and conviction",
    "icon": "mic",
    "score": 70
  },
  {
    "id": "active-listening",
    "name": "Active Listening",
    "description": "Understand nuances, validate feelings, and respond thoughtfully",
    "icon": "ear",
    "score": 60
  },
  {
    "id": "small-talk",
    "name": "Small Talk",
    "description": "Navigate casual social interactions and build effortless rapport",
    "icon": "users",
    "score": 90
  },
  {
    "id": "conflict",
    "name": "Conflict Handling",
    "description": "De-escalate tension, resolve disagreements, and find common ground",
    "icon": "shield-alert",
    "score": 55
  }
]
```

#### Frontend Usage Example
```tsx
import { api } from '../lib/api';

const skills = await api.getSkills();
```

---

### `GET /api/skills/:skill_id`

Fetches detailed information about a single skill by its ID.

- **Function:** `api.getSkillById(skillId: string): Promise<Skill | null>`
- **Auth Required:** No / Optional

#### Example: `GET /api/skills/communication`
```json
{
  "id": "communication",
  "name": "Communication",
  "description": "Practice expressing your thoughts clearly and persuasively",
  "icon": "message-circle",
  "score": 80
}
```

---

## 3. Simulation APIs

### `POST /api/simulation/start`
- **Function:** `api.startSimulation(scenarioId: string, difficulty: string)`
- **Request Body:** `{ "scenarioId": "networking-event", "difficulty": "medium" }`
- **Response:** `{ "sessionId": "session_1726488000000", "status": "started" }`

---

### `POST /api/chat`
- **Function:** `api.sendMessage(sessionId: string, message: string)`
- **Request Body:** `{ "sessionId": "session_1726488000000", "message": "Hi, nice to meet you!" }`
- **Response:**
  ```json
  {
    "id": "msg_1726488005000",
    "role": "ai",
    "content": "Hi there! It's great to connect with you. What brings you here today?",
    "timestamp": "2026-09-18T11:45:00.000Z"
  }
  ```

---

### `POST /api/simulation/end`
- **Function:** `api.endSimulation(sessionId: string)`
- **Request Body:** `{ "sessionId": "session_1726488000000" }`
- **Response:** `{ "success": true }`

---

### `GET /api/evaluation/:sessionId`
- **Function:** `api.getEvaluation(sessionId: string)`
- **Response:**
  ```json
  {
    "overallScore": 8.2,
    "skills": [
      { "name": "Communication", "score": 8.5 },
      { "name": "Confidence", "score": 7.5 },
      { "name": "Active Listening", "score": 9.0 },
      { "name": "Empathy", "score": 8.0 }
    ],
    "whatYouDidWell": [
      "Asked insightful open-ended questions that deepened the dialogue",
      "Maintained a calm, empathetic, and constructive tone throughout",
      "Demonstrated active listening by validating the other person's perspective"
    ],
    "areasToImprove": [
      "Try to structure key proposals more concisely before providing elaboration",
      "Take a brief deliberate pause before answering complex questions"
    ],
    "betterResponses": [
      { "type": "Casual", "text": "I completely see where you're coming from! Let's figure out a quick win together." },
      { "type": "Confident", "text": "Based on my market research and contributions, I'm confident that a 15% adjustment aligns with industry benchmarks." },
      { "type": "Friendly", "text": "I'd love to understand your viewpoint better so we can make this work smoothly for everyone." }
    ]
  }
  ```

---

### `GET /api/history`
- **Function:** `api.getHistory()`
- **Response:**
  ```json
  [
    { "id": "1", "scenarioTitle": "Coffee Shop Chat", "date": "2 hours ago", "score": 8.5 },
    { "id": "2", "scenarioTitle": "Networking Event Mixer", "date": "Yesterday", "score": 7.2 },
    { "id": "3", "scenarioTitle": "Job Interview Prep", "date": "3 days ago", "score": 9.0 }
  ]
  ```

---

### `GET /api/progress`
- **Function:** `api.getProgress()`
- **Response:** Returns array of `Skill` objects with current user score progress.

---

## Client-Side State Stores

### Auth Store
**File:** [`src/lib/auth-store.ts`](./src/lib/auth-store.ts)

```ts
import { useAuthStore } from '../lib/auth-store';

const { user, token, isAuthenticated, isLoading, login, register, logout, initAuth } = useAuthStore();
```

| State / Action | Type | Description |
|---|---|---|
| `user` | `User \| null` | Authenticated user object |
| `token` | `string \| null` | JWT bearer token |
| `isAuthenticated` | `boolean` | `true` if logged in |
| `isLoading` | `boolean` | `true` during auth requests |
| `login(creds)` | `(data: LoginRequest) => Promise<void>` | Authenticates and sets token/user |
| `register(data)` | `(data: RegisterRequest) => Promise<void>` | Registers and automatically logs in |
| `logout()` | `() => void` | Clears token, user, and localStorage |
| `initAuth()` | `() => Promise<void>` | Rehydrates session from storage |

---

### Simulation Store
**File:** [`src/lib/simulation-store.ts`](./src/lib/simulation-store.ts)

```ts
import { useSimulationStore } from '../lib/simulation-store';

const { selectedSkill, selectedScenario, difficulty, sessionId, messages, setSkill, setScenario, setDifficulty, addMessage, clearSelection } = useSimulationStore();
```

---

## FastAPI Backend Migration Guide

When connecting your real FastAPI server:

1. Update `src/lib/api.ts` to replace mock delay handlers with `fetch` calls:

```ts
const BASE_URL = 'http://localhost:8000';

const getHeaders = () => {
  const token = localStorage.getItem('socialsim_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Registration failed');
    return res.json();
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error((await res.json()).detail || 'Login failed');
    return res.json();
  },

  getMe: async (): Promise<User> => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  },

  getSkills: async (): Promise<Skill[]> => {
    const res = await fetch(`${BASE_URL}/api/skills`);
    if (!res.ok) throw new Error('Failed to load skills');
    return res.json();
  },

  getSkillById: async (skillId: string): Promise<Skill | null> => {
    const res = await fetch(`${BASE_URL}/api/skills/${skillId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to load skill');
    return res.json();
  }
};
```

---

## Endpoint Quick Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login user & receive JWT token | No |
| `GET` | `/api/auth/me` | Get current logged-in user profile | **Yes (Bearer)** |
| `GET` | `/api/skills` | List all practice skills | No |
| `GET` | `/api/skills/{skill_id}` | Get single skill details | No |
| `POST` | `/api/simulation/start` | Start simulation session | **Yes** |
| `POST` | `/api/chat` | Send user message & get AI response | **Yes** |
| `POST` | `/api/simulation/end` | Finish active session | **Yes** |
| `GET` | `/api/evaluation/{sessionId}` | Get performance evaluation | **Yes** |
| `GET` | `/api/history` | Get user session history | **Yes** |
| `GET` | `/api/progress` | Get user skill progress scores | **Yes** |

---

*SocialSim — Practice conversations. Build confidence.*
