# Request to create requirements

I want to create with you help tech requirements md file for my expo react-native project. I’m going to use this requirements file as starting point for you, to generate type script code of the project. Read carefully prerequirements.md. Don't miss any word of my description. Ask me if you'll find contradictions or need clarifications. 

# Quiz Player Pre-Requirements

## Table of Contents

- [Description](#description)
- [Specific Features](#specific-features)
- [Backend State Change Function](#backend-state-change-function)
- [Question Pre-processing Flow](#question-pre-processing-flow)
- [Data Types](#data-types)
- [Image Loading Process](#image-loading-process)
- [Connection Management](#connection-management)
- [State Management](#state-management)
- [API Routes](#api-routes)

---

## Description

### What's app about?

My app is a players tablet client for 1% club quiz game. It aims to allow players answer questions (by choosing one of variants or type answer into input field). There are 100 players, seating on his own seat. Every tablet will be placed on table in front of certain seat and before game starts, seat number will be assigned to them. Player doesn't have access to seat assigning screen. UI have two localizations: en and uk (ukraine). locale switches on the admin screen where seat number assigns. Seat number, locale and server ip are stored into persisted app context. Application has only portrait layout. Landscape is not allowed. Quiz network (where players tablet and server connected to) doesn't have Internet access. Consider it when setting assets (fonts, ets)

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Specific Features

### Screen description

#### Default screen

Default screen is shown every time when prepare or question screen are not.

- Default screen shows 1% club logo at the top screen, seat number and player name at the center of the screen. Player name gets red when player state isActive = false.

#### Prepare screen

The prepare screen gets shown when the player's state isActive is true and the websocket event QUESTION_PRE has been received and question image has been loaded. 

- Prepare screen shows seat number and player name at the top, and writing 'ready for tier `tier legend`'. tier legend is a variable received from server.

#### Question screen

The question screen is shown when the player's state isActive is true and the websocket event QUESTION_OPEN has been received. The question screen is replaced by the default screen when the websocket event QUESTION_CLOSED is received or when "confirm answer" button pressed or when  one of the answer option button pressed or when  "pass" button pressed or when "buyout" button pressed.

- Question screen contains seat number and player name at the top, image with question at the center (full screen width), buttons to choose right answer A B C D or less depending on tier data (answerOptions field of tier which is a string, options delimited with ";". "A;B;C;D"). Instead of buttons under the question image, there might be an input field and keyboard to enter answer.
- Tier question might be one of the three types: TEXT, TEXT_NUMBER, MULTIPLE (specify in questionType field of tier state).
  - When tier questionType is MULTIPLE, under the question image buttons to choose right answer are shown.
  - When type is TEXT, input with keyboard displayed (lang of keyboard depends on locale settings).
  - When type is TEXT_NUMBER, input with numeric keyboard is shown.

Over input field should be a button "confirm answer". Pressing this button sends "answer" event to server :

```ts
export interface iAnswerMessage {
  seat: number;
  answer?: string;
  pass?: boolean;
  boughtOut?: boolean;
  auto: boolean;
}
```
if "confirm answer" pressed, answer set to value of input, pass = false, boughtOut = false, auto = false, seat = seat value from persisted app context;
If the "confirm answer" button has not been pressed and a `QUESTION_CLOSED` event is received, the answer is set to the value of the input, with `pass = false`, `boughtOut = false`, and `auto = true`.

if ( passOneAllowed: true and passTwoAllowed: false  of tier state)  and (usedPassOne = false of player state) or ( passOneAllowed: true or passTwoAllowed: true of tier state)  and (usedPassOne = false or usedPassTwo = false of player state) "Pass" button is shown about question image. Pressing this button sends to server 'answer' event with answer = '', pass = true, boughtOut= false, auto = false.

When tier questionType is MULTIPLE and one of the answerOptions button pressed (this button created from array = answerOptions.split(;)) the corresponding value of answerOptions sends as answer in 'answer' websocket event with `pass = false`, `boughtOut = false`, auto=false. If no one of answerOptions buttons is pressed and a `QUESTION_CLOSED` event is received, 'answer' event sends with `answer=''`, `pass = false`, `boughtOut = false`, and `auto = true`.

if tier state legend field = Buyout or Buyout-end-game (use this function to check if tier isBuyout: 

```ts
export function checkBuyouts(tierLegend: string): boolean[] {
  const buyoutEndGamePattern =
    /\b(buyout[-\s]*end[-\s]*game|end[-\s]*game[-\s]*buyout|buyoutendgame|endgamebuyout)\b/i;
  const buyoutPattern = /\bbuyout\b/i;

  const isBuyoutEndGame = !!tierLegend.match(buyoutEndGamePattern);
  const isBuyout = !!tierLegend.match(buyoutPattern);

  return [isBuyout, isBuyoutEndGame];
}
```
)
instead of "pass" button show "buyout" button. No image shown and no other controls are shown.
When the "buyout" button is pressed, an 'answer' event is sent to the server with `answer = ''`, `pass = false`, `boughtOut = true`, and `auto = false`.  
If the "buyout" button has not been pressed and a `QUESTION_CLOSED` event is received, an 'answer' event is sent to the server with `answer = ''`, `pass = false`, `boughtOut = false`, and `auto = false`.



## Server communication protocol details

- Application establishes websocket connection to the quiz-game server located in local network (the same as players tablet connected to). Backend IP is set from admin screen. websocket connection should ab auto reconnected.
- Admin screen protected by password. Login screen is hidden. To access it, user should make long press in upper right corner of screen.
- Over websocket, app receives quiz state message and reacts accordingly.
- Over REST API, app obtains tier and question data (including player name, question image link, etc).

[⬆️ Back to Table of Contents](#table-of-contents)

---

## State Management

Use **TanStack Query (React Query)** for state management.

State consist of:

- **player** state of PlayerDataType type. it received by fetching data from `GET {{base_url}}/seats/[seat]`. example of response: 

```ts
{
    "id": 204,
    "seat": 4,
    "description": "Сектор А / Верх / ліво",
    "sector": "Left",
    "cameras": "Cam 7, 8",
    "player": {
        "id": 100,
        "name": "Зуєва Анна Олександрівна",
        "rank": null,
        "occupation": null,
        "notes": null,
        "goal": null,
        "relations": null,
        "image": "zuievaanna.png",
        "isActive": false,
        "usedPassOne": false,
        "usedPassTwo": false,
        "boughtOut": false,
        "boughtOutEndGame": false
    }
}
```

player should be updated on events: QUESTION_PRE and QUESTION_COMPLETE, BUYOUT_COMPLETE

- **tier** state of type 

```ts
export type TierType = {
  tierNumber: string;
  legend: string;
  passOneAllowed: boolean;
  passTwoAllowed: boolean;
  enableCountdown: boolean;
  label: string;necessary
  image: string;
  questionType: string;
  answerOptions: string;
}
```

It will be updated with websocket events which returns payload of type iQuizSate. from QUESTION_PRE websocket event tier state updates tierNumber. then fetch all tiers by `GET {{base_url}}/tiers `and select from returning array object with idx field equal to tierNumber. Example of array returned by fetch all tiers: 

```ts

[
    {
        "id": 6,
        "idx": -3,
        "legend": "Demo 2",
        "boundQuestion": "d250",
        "enableCountdown": false,
        "passOneAllowed": false,
        "passTwoAllowed": false,
        "createdAt": "2025-05-30T20:16:06.451Z",
        "updatedAt": "2025-05-30T20:16:06.451Z",
        "question": {
            "id": 1,
            "label": "d250",
            "questionType": "MULTIPLE",
            "image": "d250.png",
            "answerOptions": "A;B;C;D",
            "correctAnswer": "F",
            "description": null,
            "createdAt": "2025-05-30T20:14:01.174Z",
            "updatedAt": "2025-05-30T20:14:01.174Z"
        }
    },
] 
```

Then parse required data to the tier state.  
---

## Obtaining player name

After seat number has been assigned, application does api request to get player data. player state should also be updated from request `GET {{base_url}}/seats/[seat]` on application start and application update by draggin screen from upper to lower screen part. Also player state updates from request `GET {{base_url}}/seats/[seat]` on websocket event 'UPDATE_PLAYER'

## Backend State Change Function

This is the function called on backend when game state is changed:

```typescript
export type BroadcastState =
  | 'QUESTION_PRE'
  | 'QUESTION_OPEN'
  | 'QUESTION_CLOSED'
  | 'QUESTION_COMPLETE'
  | 'IDLE'
  | 'BUYOUT_OPEN'
  | 'BUYOUT_COMPLETE'
  | 'UPDATE_PLAYER';

export interface iQuizSate {
  showNumber: Date;
  tierNumber: number;
  tierLegend: string;
  enableCountdown: boolean;
  passOneAllowed: boolean;
  passTwoAllowed: boolean;
  questionLabel: string;
  questionImage: string;
  correctAnswer: string;
  questionText: string;
  state: BroadcastState;
  maxPrize: number;
  prizeChange: number;
  prizePool: number;
  boughtOut: number;
  remainingPlayers: number;
  eliminatedPlayers: number;
  correctAnswers: number;
  incorrectAnswers: number;
  passes: number;
  ready: number;
  countdownDuration: number;
}

// Broadcast changes based on the current state
private broadcastStateChange(
  state: BroadcastState,
  quizState: iQuizSate,
): void {
  if (!quizState) return;

  // Convert to Record to satisfy the type constraint
  const payload = { ...quizState } as unknown as Record;

  switch (state) {
    case 'QUESTION_PRE':
      this.quizGateway.broadcastEvent('QUESTION_PRE', payload);
      break;
    case 'QUESTION_OPEN':
      this.quizGateway.broadcastEvent('QUESTION_OPEN', payload);
      break;
    case 'QUESTION_CLOSED':
      this.quizGateway.broadcastEvent('QUESTION_CLOSED', payload);
      break;
    case 'QUESTION_COMPLETE':
      this.quizGateway.broadcastEvent('QUESTION_COMPLETE', payload);
      break;
    case 'IDLE':
      this.quizGateway.broadcastEvent('IDLE', payload);
      break;
    case 'BUYOUT_OPEN':
      this.quizGateway.broadcastEvent('BUYOUT_OPEN', payload);
      break;
    case 'BUYOUT_COMPLETE':
      this.quizGateway.broadcastEvent('BUYOUT_COMPLETE', payload);
      break;
    case 'PLAYER_UPDATE':
      this.quizGateway.broadcastEvent('PLAYER_UPDATE', payload);
      break;
  }
}
```

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Question Pre-processing Flow

On `QUESTION_PRE` message, the app receives `tierNumber` from the payload and sends a REST API request to the server to obtain tier and question data. fetch all tiers by `GET {{base_url}}/tiers `and select from returning array object with idx field equal to tierNumber. parse return to tier state. download question image and when it is done, send 'check' event to server. switch screen from Default to Prepare. Also update player state from `GET {{base_url}}/seats/[seat]`

## Question Open-processing Flow

On `QUESTION_OPEN`, 'BUYOUT_OPEN' message, app shows Question screen (if player.isActive === true). Question screen is rendered according to the tier and player state.

## Question Close-processing Flow

On `QUESTION_CLOSED` message, app shows Default screen. 

## Question Complete-processing Flow

On `QUESTION_COMPLETE`, `BUYOUT_COMPLETE` message, app update player state from `GET {{base_url}}/seats/[seat]`. 

## Question Idle-processing Flow

On `QUESTION_IDLE` message, app shows Default screen. 

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Data Types

### Question Data Types

```typescript
export type QuestionDataType = {
  id: string;
  label: string;
  image: string;
  questionType: string;
  answerOptions: string;
  correctAnswer: string;
  description: string;
  boundToNumber: string;
  passOneAllowed: boolean;
  passTwoAllowed: boolean;
  enableCountdown: boolean;
};

export type QuestionFormDataType = Partial<
  Omit<
    QuestionDataType,
    'boundToNumber' | 'passOneAllowed' | 'passTwoAllowed' | 'enableCountdown'
  >
>;

export type QuestionType = 'MULTIPLE' | 'TEXT' | 'TEXT NUMERIC' | '';
```

### Tier Data Type

```typescript
export type TierDataType = {
  id: string;
  idx: string;
  legend: string;
  passOneAllowed: boolean;
  passTwoAllowed: boolean;
  enableCountdown: boolean;
  questionType: QuestionType;
  boundQuestion: string;
  question?: QuestionDataType | null;
};
```

```typescript
export type PlayerDataType = {
  id: number;
  name: string;
  rank: string;
  occupation: string;
  notes: string;
  goal: string;
  relations: string[];
  isActive: boolean;
  usedPassOne: boolean;
  usedPassTwo: boolean;
  boughtOut: boolean;
  boughtOutEndGame: boolean;
  externalId: string;
  image: string;
};


export type SeatDataType = {
  id: string;
  seat: number;
  description: string;
  sector: string;
  cameras: string;
  player?: PlayerDataType | null;
};
```

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Image Loading Process

When tier and question data are received:
1. App downloads question image by link
2. When image is completely loaded, app sends check message to server to indicate readiness

### Check Message Event

```typescript
export interface iCheckMessage {
  seat: number;
  imageloaded: boolean;
}
```

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Connection Management

### WebSocket Connection
- Establishes when seat number is assigned, app starts, or reloads (e.g., by dragging screen down)
- Attempts reconnection when connection is lost


[⬆️ Back to Table of Contents](#table-of-contents)

---


## API Routes

<!-- Add your API routes here -->

[⬆️ Back to Table of Contents](#table-of-contents)

