# SocialSim API Reference

> **SocialSim** — AI Social Skills Simulator  
> This document covers the frontend API module (`src/lib/api.ts`), all TypeScript data types (`src/lib/mock-data.ts`), the client-side Zustand state store (`src/lib/simulation-store.ts`), and the backend endpoint contract that each function maps to.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Data Types](#data-types)
  - [Difficulty](#difficulty)
  - [Skill](#skill)
  - [Scenario](#scenario)
  - [Message](#message)
- [API Module — `src/lib/api.ts`](#api-module)
  - [startSimulation](#startsimulation)
  - [sendMessage](#sendmessage)
  - [endSimulation](#endsimulation)
  - [getEvaluation](#getevaluation)
  - [getHistory](#gethistory)
  - [getProgress](#getprogress)
- [Simulation Store — `src/lib/simulation-store.ts`](#simulation-store)
  - [State Shape](#state-shape)
  - [Actions](#actions)
- [Mock Data — `src/lib/mock-data.ts`](#mock-data)
  - [Skills](#skills-data)
  - [Scenarios](#scenarios-data)
  - [Recent Sessions](#recent-sessions-data)
- [Swapping Mocks for a Real Backend](#swapping-mocks-for-a-real-backend)
- [Error Handling Conventions](#error-handling-conventions)
- [Endpoint Quick Reference](#endpoint-quick-reference)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Components                      │
│  (routes/index, practice/*, results, session, etc.)     │
└────────────────────────┬────────────────────────────────┘
                         │  calls
                         ▼
┌─────────────────────────────────────────────────────────┐
│               src/lib/simulation-store.ts                │
│          Zustand global state across routes              │
│  (selectedSkill, selectedScenario, difficulty,           │
│   sessionId, messages[])                                 │
└────────────────────────┬────────────────────────────────┘
                         │  reads / writes via
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   src/lib/api.ts                         │
│   Single API module — all async fetch calls live here   │
│   Currently: realistic mock with artificial delay        │
│   Future:    real fetch() calls to FastAPI backend       │
└────────────────────────┬────────────────────────────────┘
                         │  maps to
                         ▼
┌─────────────────────────────────────────────────────────┐
│              FastAPI Backend  (future)                   │
│  POST /api/simulation/start                              │
│  POST /api/chat                                          │
│  POST /api/simulation/end                                │
│  GET  /api/evaluation/:sessionId                         │
│  GET  /api/history                                       │
│  GET  /api/progress                                      │
└─────────────────────────────────────────────────────────┘
```

All components import exclusively from `api.ts`. Swapping the entire backend only requires editing that single file.

---

## Data Types

All types are defined in [`src/lib/mock-data.ts`](./src/lib/mock-data.ts).

### Difficulty

```ts
type Difficulty = 'easy' | 'medium' | 'hard';
```

A union type representing the three selectable simulation difficulty levels.

| Value    | Behaviour                                              |
|----------|--------------------------------------------------------|
| `easy`   | Predictable AI responses; hints available              |
| `medium` | Realistic pacing; standard AI character behaviour      |
| `hard`   | Challenging, sometimes uncooperative AI interactions   |

---

### Skill

```ts
interface Skill {
  id: string;        // unique slug, e.g. "communication"
  name: string;      // display label, e.g. "Communication"
  score: number;     // 0–100 progress score for the current user
  description: string; // one-line description shown on skill cards
}
```

**Example**
```json
{
  "id": "communication",
  "name": "Communication",
  "score": 80,
  "description": "Express ideas clearly and effectively"
}
```

---

### Scenario

```ts
interface Scenario {
  id: string;              // unique slug, e.g. "networking-event"
  skillId: string;         // foreign key → Skill.id
  title: string;           // short display title
  description: string;     // full context shown to the user
  characterName: string;   // AI character's first name
  characterRole: string;   // AI character's role/relationship
  characterStatus: string; // "Online" | "Busy" | "Offline"
  characterTags: string[]; // personality/mood hints
  avatarUrl: string;       // DiceBear SVG URL
}
```

**Example**
```json
{
  "id": "networking-event",
  "skillId": "small-talk",
  "title": "Networking Event Mixer",
  "description": "You are at a professional mixer. Strike up a conversation with someone you haven't met before.",
  "characterName": "Alex",
  "characterRole": "College Student",
  "characterStatus": "Online",
  "characterTags": ["Friendly", "Talkative", "Curious"],
  "avatarUrl": "https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=b6e3f4"
}
```

---

### Message

```ts
interface Message {
  id: string;              // unique message id, e.g. "msg_1726488000000"
  role: 'user' | 'ai';    // message author
  content: string;         // message body text
  timestamp: string;       // ISO 8601 datetime string
}
```

**Example**
```json
{
  "id": "msg_1726488123456",
  "role": "ai",
  "content": "Hi there! How are you doing today?",
  "timestamp": "2026-09-16T11:02:03.456Z"
}
```

---

## API Module

**File:** [`src/lib/api.ts`](./src/lib/api.ts)

All functions are members of the exported `api` object. Every function is `async` and returns a `Promise`.

```ts
import { api } from './lib/api';
```

---

### `startSimulation`

Initialises a new simulation session for a given scenario and difficulty level.

```ts
api.startSimulation(scenarioId: string, difficulty: string): Promise<{
  sessionId: string;
  status: 'started';
}>
```

**Parameters**

| Parameter    | Type     | Description                                   |
|--------------|----------|-----------------------------------------------|
| `scenarioId` | `string` | The `id` of the chosen `Scenario`             |
| `difficulty` | `string` | One of `'easy'`, `'medium'`, `'hard'`         |

**Returns**

| Field       | Type     | Description                                              |
|-------------|----------|----------------------------------------------------------|
| `sessionId` | `string` | Unique session identifier (e.g. `session_1726488000000`) |
| `status`    | `string` | Always `'started'` on success                            |

**Maps to:** `POST /api/simulation/start`

**Request body (future)**
```json
{
  "scenarioId": "networking-event",
  "difficulty": "medium"
}
```

**Mock delay:** `800ms`

**Usage example**
```tsx
const result = await api.startSimulation(selectedScenario.id, difficulty);
setSessionId(result.sessionId);
navigate({ to: '/practice/session' });
```

---

### `sendMessage`

Sends a user message and returns the AI character's reply.

```ts
api.sendMessage(sessionId: string, message: string): Promise<Message>
```

**Parameters**

| Parameter   | Type     | Description                                      |
|-------------|----------|--------------------------------------------------|
| `sessionId` | `string` | Session identifier returned by `startSimulation` |
| `message`   | `string` | The user's typed message                         |

**Returns** — a fully hydrated [`Message`](#message) object with `role: 'ai'`.

**Maps to:** `POST /api/chat`

**Request body (future)**
```json
{
  "sessionId": "session_1726488000000",
  "message": "Hi, I wanted to introduce myself!"
}
```

**Response (future)**
```json
{
  "id": "msg_1726488005000",
  "role": "ai",
  "content": "Hi there! How are you doing today?",
  "timestamp": "2026-09-16T11:02:05.000Z"
}
```

**Mock logic** — the mock inspects the message to return contextual replies:

| Condition                                      | Mock AI Response                                               |
|------------------------------------------------|----------------------------------------------------------------|
| Message contains `"hello"` or `"hi"`           | `"Hi there! How are you doing today?"`                         |
| Message length > 50 characters                 | A follow-up question about alternatives                        |
| All other messages                             | `"That's interesting, tell me more."`                          |

**Mock delay:** `1200ms` (simulates AI thinking time)

**Usage example**
```tsx
setIsTyping(true);
const response = await api.sendMessage(sessionId, userMsg);
addMessage(response);
setIsTyping(false);
```

---

### `endSimulation`

Signals the backend to close the active session and persist results.

```ts
api.endSimulation(sessionId: string): Promise<{ success: boolean }>
```

**Parameters**

| Parameter   | Type     | Description               |
|-------------|----------|---------------------------|
| `sessionId` | `string` | The active session's ID   |

**Returns**

| Field     | Type      | Description                          |
|-----------|-----------|--------------------------------------|
| `success` | `boolean` | `true` when the session is closed    |

**Maps to:** `POST /api/simulation/end`

**Request body (future)**
```json
{ "sessionId": "session_1726488000000" }
```

**Mock delay:** `1000ms`

**Usage example**
```tsx
await api.endSimulation(sessionId);
navigate({ to: '/practice/results' });
```

---

### `getEvaluation`

Fetches the AI-generated performance evaluation for a completed session.

```ts
api.getEvaluation(sessionId: string): Promise<{
  overallScore: number;
  skills: Array<{ name: string; score: number }>;
  whatYouDidWell: string[];
  areasToImprove: string[];
  betterResponses: Array<{ type: string; text: string }>;
}>
```

**Parameters**

| Parameter   | Type     | Description                        |
|-------------|----------|------------------------------------|
| `sessionId` | `string` | The completed session's identifier |

**Returns**

| Field              | Type                              | Description                                                 |
|--------------------|-----------------------------------|-------------------------------------------------------------|
| `overallScore`     | `number`                          | Aggregate score out of 10 (e.g. `8.2`)                      |
| `skills`           | `Array<{name, score}>`            | Per-skill scores (score out of 10)                          |
| `whatYouDidWell`   | `string[]`                        | Positive feedback bullet points                             |
| `areasToImprove`   | `string[]`                        | Constructive improvement suggestions                        |
| `betterResponses`  | `Array<{type, text}>`             | Alternative phrasings categorised as Casual/Confident/Friendly |

**Maps to:** `GET /api/evaluation/:sessionId`

**Response shape (future)**
```json
{
  "overallScore": 8.2,
  "skills": [
    { "name": "Communication", "score": 8.5 },
    { "name": "Confidence",    "score": 7.5 },
    { "name": "Active Listening", "score": 9.0 },
    { "name": "Empathy",       "score": 8.0 }
  ],
  "whatYouDidWell": [
    "Asked great open-ended questions",
    "Maintained a positive and friendly tone",
    "Showed active listening by referencing previous points"
  ],
  "areasToImprove": [
    "Try to be more concise in your explanations",
    "Don't be afraid to take brief pauses before answering complex questions"
  ],
  "betterResponses": [
    { "type": "Casual",    "text": "Yeah, I totally get what you mean. It's been pretty crazy lately!" },
    { "type": "Confident", "text": "I'm confident we can resolve this issue by reallocating our resources." },
    { "type": "Friendly",  "text": "I'd love to hear more about your experience with that if you have time." }
  ]
}
```

**Mock delay:** `1500ms`

**Usage example**
```tsx
useEffect(() => {
  const loadEvaluation = async () => {
    const result = await api.getEvaluation(sessionId);
    setEvaluation(result);
  };
  loadEvaluation();
}, [sessionId]);
```

---

### `getHistory`

Returns the user's list of past simulation sessions.

```ts
api.getHistory(): Promise<Array<{
  id: string;
  scenarioTitle: string;
  date: string;
  score: number;
}>>
```

**Maps to:** `GET /api/history`

**Response shape (future)**
```json
[
  { "id": "1", "scenarioTitle": "Coffee Shop Chat",      "date": "2 hours ago", "score": 8.5 },
  { "id": "2", "scenarioTitle": "Networking Event Mixer","date": "Yesterday",   "score": 7.2 },
  { "id": "3", "scenarioTitle": "Job Interview Prep",    "date": "3 days ago",  "score": 9.0 }
]
```

**Mock delay:** `500ms`

**Usage example**
```tsx
const history = await api.getHistory();
```

---

### `getProgress`

Returns the user's skill progress scores, used to render the dashboard progress bars.

```ts
api.getProgress(): Promise<Skill[]>
```

**Returns** — Array of [`Skill`](#skill) objects with current `score` values.

**Maps to:** `GET /api/progress`

**Response shape (future)**
```json
[
  { "id": "communication",   "name": "Communication",   "score": 80, "description": "Express ideas clearly and effectively" },
  { "id": "confidence",      "name": "Confidence",      "score": 70, "description": "Speak with assurance and presence" },
  { "id": "active-listening","name": "Active Listening", "score": 60, "description": "Understand and respond thoughtfully" },
  { "id": "small-talk",      "name": "Small Talk",       "score": 90, "description": "Navigate casual social interactions" },
  { "id": "conflict",        "name": "Conflict Handling","score": 55, "description": "De-escalate and resolve disagreements" }
]
```

**Mock delay:** `500ms`

**Usage example**
```tsx
const progress = await api.getProgress();
```

---

## Simulation Store

**File:** [`src/lib/simulation-store.ts`](./src/lib/simulation-store.ts)

A **Zustand** global store that persists the user's selections and live session state across all routes in the setup flow (`/practice/skill` → `/practice/scenario` → `/practice/difficulty` → `/practice/session` → `/practice/results`).

```ts
import { useSimulationStore } from './lib/simulation-store';
```

### State Shape

```ts
interface SimulationState {
  selectedSkill:    Skill | null;      // Step 1 — chosen skill
  selectedScenario: Scenario | null;   // Step 2 — chosen scenario
  difficulty:       Difficulty | null; // Step 3 — chosen difficulty
  sessionId:        string | null;     // active session ID from startSimulation()
  messages:         Message[];         // live chat transcript for the session
}
```

### Actions

| Action                     | Signature                           | Description                                                     |
|----------------------------|-------------------------------------|-----------------------------------------------------------------|
| `setSkill`                 | `(skill: Skill) => void`            | Stores the chosen skill after Step 1                            |
| `setScenario`              | `(scenario: Scenario) => void`      | Stores the chosen scenario after Step 2                         |
| `setDifficulty`            | `(difficulty: Difficulty) => void`  | Stores the difficulty after Step 3                              |
| `setSessionId`             | `(id: string) => void`              | Persists the `sessionId` returned by `startSimulation()`        |
| `addMessage`               | `(msg: Message) => void`            | Appends a message to the live `messages[]` transcript           |
| `resetSession`             | `() => void`                        | Clears `sessionId` and `messages[]` but keeps skill/scenario    |
| `clearSelection`           | `() => void`                        | Full reset — clears all state (called after results are viewed) |

**Usage example**
```tsx
const { selectedSkill, setSkill, clearSelection } = useSimulationStore();

// Set a skill
setSkill({ id: 'communication', name: 'Communication', score: 80, description: '...' });

// Add a message to the transcript
addMessage({ id: 'msg_1', role: 'user', content: 'Hello!', timestamp: new Date().toISOString() });

// Full reset when going back to dashboard
clearSelection();
```

---

## Mock Data

**File:** [`src/lib/mock-data.ts`](./src/lib/mock-data.ts)

Static datasets consumed directly by `api.ts` for mock responses.

### Skills Data

Five skills are defined. Each has a score (0–100) representing the current user's progress.

| ID                 | Name              | Score | Description                              |
|--------------------|-------------------|-------|------------------------------------------|
| `communication`    | Communication     | 80    | Express ideas clearly and effectively    |
| `confidence`       | Confidence        | 70    | Speak with assurance and presence        |
| `active-listening` | Active Listening  | 60    | Understand and respond thoughtfully      |
| `small-talk`       | Small Talk        | 90    | Navigate casual social interactions      |
| `conflict`         | Conflict Handling | 55    | De-escalate and resolve disagreements    |

### Scenarios Data

Three scenarios are pre-loaded, each linked to a skill via `skillId`.

| ID                    | Title                      | Skill ID       | Character         | Status  |
|-----------------------|----------------------------|----------------|-------------------|---------|
| `networking-event`    | Networking Event Mixer     | `small-talk`   | Alex (Student)    | Online  |
| `salary-negotiation`  | Salary Negotiation         | `confidence`   | Sarah (HR Mgr)    | Busy    |
| `group-project`       | Group Project Disagreement | `conflict`     | Jordan (Classmate)| Offline |

### Recent Sessions Data

Three mock past sessions displayed on the dashboard.

| ID | Scenario Title         | Date         | Score |
|----|------------------------|--------------|-------|
| 1  | Coffee Shop Chat       | 2 hours ago  | 8.5   |
| 2  | Networking Event Mixer | Yesterday    | 7.2   |
| 3  | Job Interview Prep     | 3 days ago   | 9.0   |

---

## Swapping Mocks for a Real Backend

Every function in `api.ts` currently:
1. Waits for an artificial `delay()` to simulate network latency.
2. Returns a hardcoded mock object.

To wire up the real FastAPI backend, replace each function body with a `fetch` call. **No other file needs to change.**

```ts
// BEFORE (mock)
startSimulation: async (scenarioId: string, difficulty: string) => {
  await delay(800);
  return { sessionId: `session_${Date.now()}`, status: 'started' };
},

// AFTER (real backend)
startSimulation: async (scenarioId: string, difficulty: string) => {
  const res = await fetch('/api/simulation/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId, difficulty }),
  });
  if (!res.ok) throw new Error('Failed to start simulation');
  return res.json(); // { sessionId: string, status: 'started' }
},
```

Apply the same pattern to all six functions. The rest of the frontend — components, routing, store — remains unchanged.

---

## Error Handling Conventions

The current mock layer does not throw errors. When connecting to a real backend, follow these conventions used in the components:

```tsx
// Pattern used throughout the app:
try {
  const result = await api.startSimulation(scenarioId, difficulty);
  setSessionId(result.sessionId);
  navigate({ to: '/practice/session' });
} catch (error) {
  console.error(error);
  setIsStarting(false);
  // Show toast notification via sonner
}
```

Recommended HTTP error codes for the FastAPI backend:

| Status | Meaning                                            |
|--------|----------------------------------------------------|
| `200`  | Success                                            |
| `400`  | Bad request (invalid scenarioId, missing fields)   |
| `401`  | Unauthenticated                                    |
| `404`  | Session or resource not found                      |
| `500`  | Internal server error                              |

---

## Endpoint Quick Reference

| Function          | HTTP Method | Endpoint                     | Auth Required |
|-------------------|-------------|------------------------------|---------------|
| `startSimulation` | `POST`      | `/api/simulation/start`      | Yes           |
| `sendMessage`     | `POST`      | `/api/chat`                  | Yes           |
| `endSimulation`   | `POST`      | `/api/simulation/end`        | Yes           |
| `getEvaluation`   | `GET`       | `/api/evaluation/:sessionId` | Yes           |
| `getHistory`      | `GET`       | `/api/history`               | Yes           |
| `getProgress`     | `GET`       | `/api/progress`              | Yes           |

---

*Built with React 18 · TanStack Router · Zustand · TypeScript · Vite*
