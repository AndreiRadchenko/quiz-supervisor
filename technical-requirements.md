# Quiz Player Technical Requirements

## Overview

This document outlines the technical requirements for the 1% Club Quiz Player application. This Expo React Native app serves as a tablet client for players participating in a quiz game. Players can answer questions by selecting options or typing answers. The application operates in a local network environment without internet access and supports English and Ukrainian localizations.

## Table of Contents

- [Project Setup](#project-setup)
- [Architecture](#architecture)
- [State Management](#state-management)
- [UI/UX Requirements](#uiux-requirements)
- [Screen Specifications](#screen-specifications)
  - [Default Screen](#default-screen)
  - [Prepare Screen](#prepare-screen)
  - [Question Screen](#question-screen)
  - [Admin Screen](#admin-screen)
- [Network Communication](#network-communication)
  - [WebSocket Connection](#websocket-connection)
  - [REST API](#rest-api)
  - [Outgoing WebSocket Events](#outgoing-websocket-events)
- [Data Models](#data-models)
- [Detailed State Update Logic](#detailed-state-update-logic)
  - [Player State Updates](#player-state-updates)
  - [Tier State Updates](#tier-state-updates)
- [Image Loading Process](#image-loading-process)
- [Localization](#localization)
- [Offline Functionality](#offline-functionality)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)
- [Testing Strategy](#testing-strategy)
- [Deployment Strategy](#deployment-strategy)

---

## Project Setup

### Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: TanStack Query (React Query)
- **Networking**: WebSocket for real-time events, REST API for data fetching
- **UI Components**: Standard React Native components or a library like React Native Paper
- **Navigation**: React Navigation
- **Storage**: AsyncStorage for persisted app context (seat number, locale, server IP)
- **Localization**: i18next (or similar) for EN (English) and UK (Ukrainian)

### Development Environment

- Expo SDK: Latest stable version
- Node.js: LTS version

### Constraints

- Application must function in a local network environment without internet access.
- All assets (fonts, images for UI elements like logos) must be bundled with the app. Question images are fetched from the local server.
- Application orientation is strictly portrait mode. Landscape is not allowed.
- Designed primarily for tablet devices.
- Persisted app context includes: seat number, selected locale, and server IP address.

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Architecture

### Application Structure (Proposed)

```
src/
├── api/            # REST API calls and WebSocket service
├── assets/         # Static assets (images, fonts)
├── components/     # Reusable UI components (e.g., AnswerButton, ConfirmButton)
├── constants/      # App-wide constants (e.g., event names, default settings)
├── context/        # React Context for global app settings (seat, IP, locale)
├── hooks/          # Custom hooks (e.g., useWebSocket, usePlayerState, useTierState)
├── i18n/           # Localization configuration and translation files
├── navigation/     # Navigation stack and screen definitions
├── screens/        # Screen components (Default, Prepare, Question, Admin)
├── services/       # Business logic services (e.g., QuizService)
├── store/          # TanStack Query configuration, query keys, and custom query hooks
├── types/          # TypeScript type definitions (shared across modules)
└── utils/          # Utility functions (e.g., checkBuyouts)
```

### State Management Overview

- **Global Persisted App Context**: Managed via React Context and AsyncStorage.
  - Seat Number
  - Server IP Address
  - Current Locale (en/uk)
- **Server State**: Managed via TanStack Query.
  - Player Data (`PlayerDataType` via `SeatDataType`)
  - Tier Data (`TierType`, derived from `TierDataType`)
- **WebSocket State**: Managed via a custom hook (`useWebSocket`) integrated with TanStack Query where appropriate for data invalidation/refetching.
- **Local UI State**: Managed by React component state (e.g., input field values).

[⬆️ Back to Table of Contents](#table-of-contents)

---

## UI/UX Requirements

### General UI Guidelines

- **Theme**: Adhere to 1% Club branding guidelines (colors, logo).
- **Typography**: Use bundled fonts.
- **Layout**: Fixed portrait orientation.
- **Responsiveness**: Ensure adaptability to common tablet screen sizes in portrait mode.

### UX Flow

1.  **Application Start-up**:
    *   Load persisted context (seat number, server IP, locale).
    *   If seat number and server IP are set, attempt WebSocket connection and fetch initial player data. Display Default Screen.
    *   Admin screen is accessible via a long press in the upper right corner of any screen.

2.  **Admin Access**:
    *   Long press in the upper right corner reveals a password prompt for the Admin Screen.
    *   Admin Screen allows configuration of seat number, server IP, and locale. Settings are saved to persisted app context.

3.  **Player Game Flow**:
    *   The app transitions between Default, Prepare, and Question screens based on WebSocket events and player/tier state.
    *   Player interactions (answering questions, using pass/buyout) trigger WebSocket messages to the server.

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Screen Specifications

### Default Screen

-   **Visibility**: Shown when neither Prepare Screen nor Question Screen conditions are met (e.g., on app start, after an answer, on `IDLE` or `QUESTION_CLOSED` events).
-   **Content**:
    *   1% Club logo at the top.
    *   Seat number and player name displayed centrally.
    *   Player name text color: Red if `player.isActive === false`, default color otherwise.

### Prepare Screen

-   **Visibility**: Shown when:
    1.  `player.isActive === true`.
    2.  `QUESTION_PRE` WebSocket event is received.
    3.  The question image (specified in the current tier data) has been successfully downloaded.
-   **Content**:
    *   Seat number and player name at the top.
    *   Text: "Ready for tier `[tierLegend]`" (where `tierLegend` is from the current tier state).

### Question Screen

-   **Visibility**:
    *   Shown when `player.isActive === true` AND (`QUESTION_OPEN` or `BUYOUT_OPEN`) WebSocket event is received.
    *   Replaced by Default Screen upon:
        *   `QUESTION_CLOSED` WebSocket event.
        *   Pressing "Confirm Answer" button.
        *   Pressing one of the multiple-choice answer option buttons.
        *   Pressing "Pass" button.
        *   Pressing "Buyout" button.
-   **Common Content**:
    *   Seat number and player name at the top.
-   **Conditional Content (based on `tier.questionType` and `tier.legend`):**

    *   **For Buyout Tiers** (checked using `checkBuyouts(tier.legend)`):
        *   No question image is shown.
        *   No other input controls (A/B/C/D, text input) are shown.
        *   A "Buyout" button is displayed.
            *   **Action**: Pressing sends `answer` event: `{ seat, answer: '', pass: false, boughtOut: true, auto: false }`.
            *   **On `QUESTION_CLOSED` (if Buyout button not pressed)**: Send `answer` event: `{ seat, answer: '', pass: false, boughtOut: false, auto: false }`.

    *   **For Non-Buyout Tiers**:
        *   Question image displayed at the center (full screen width).
        *   **"Pass" Button**:
            *   Visibility: Shown above the question image if `(tier.passOneAllowed && !tier.passTwoAllowed && !player.usedPassOne) || ((tier.passOneAllowed || tier.passTwoAllowed) && (!player.usedPassOne || !player.usedPassTwo))`.
            *   Action: Pressing sends `answer` event: `{ seat, answer: '', pass: true, boughtOut: false, auto: false }`.
        *   **Input Area (below image, based on `tier.questionType`)**:
            *   **`MULTIPLE`**:
                *   Buttons A, B, C, D (or fewer) are displayed based on `tier.answerOptions` (e.g., "A;B;C;D" -> 4 buttons).
                *   **Action**: Pressing an option button sends `answer` event: `{ seat, answer: [selected_option], pass: false, boughtOut: false, auto: false }`.
                *   **On `QUESTION_CLOSED` (if no option pressed)**: Send `answer` event: `{ seat, answer: '', pass: false, boughtOut: false, auto: true }`.
            *   **`TEXT`**:
                *   Text input field displayed.
                *   Standard keyboard (language depends on locale settings).
                *   "Confirm Answer" button above the input field.
                    *   **Action**: Pressing sends `answer` event: `{ seat, answer: [input_value], pass: false, boughtOut: false, auto: false }`.
                    *   **On `QUESTION_CLOSED` (if "Confirm Answer" not pressed)**: Send `answer` event: `{ seat, answer: [current_input_value], pass: false, boughtOut: false, auto: true }`.
            *   **`TEXT_NUMBER`**:
                *   Text input field displayed.
                *   Numeric keyboard.
                *   "Confirm Answer" button above the input field.
                    *   **Action**: Same as `TEXT` type.
                    *   **On `QUESTION_CLOSED`**: Same as `TEXT` type.

### Admin Screen

-   **Access**: Hidden. Revealed by a long press in the upper right corner of the screen, followed by a password prompt.
-   **Functionality**:
    *   Form to input/modify:
        *   Server IP Address
        *   Seat Number
        *   Language (Dropdown/Selector for EN/UK)
    *   "Save" button: Persists these settings into the app's global context (AsyncStorage).

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Network Communication

### WebSocket Connection

-   **Server Address**: Configured via Admin Screen (persisted in app context).
-   **Establishment**:
    *   When seat number and server IP are assigned/available.
    *   On app start.
    *   On app reload (e.g., pull-to-refresh action if implemented, or app restart).
-   **Auto-Reconnection**: Implement robust reconnection logic for lost connections.
-   **Incoming Events (from server, payload type `iQuizSate` unless specified):**
    *   `QUESTION_PRE`:
        1.  Update `tier` state (see [Tier State Updates](#tier-state-updates)).
        2.  Update `player` state (see [Player State Updates](#player-state-updates)).
        3.  Initiate question image download (see [Image Loading Process](#image-loading-process)).
        4.  Once image loaded and `check` event sent, transition to Prepare Screen.
    *   `QUESTION_OPEN`, `BUYOUT_OPEN`:
        1.  If `player.isActive === true`, transition to Question Screen.
    *   `QUESTION_CLOSED`:
        1.  Trigger auto-submission logic if applicable (see Question Screen specs).
        2.  Transition to Default Screen.
    *   `QUESTION_COMPLETE`, `BUYOUT_COMPLETE`:
        1.  Update `player` state.
        2.  (App remains on/transitions to Default Screen).
    *   `IDLE`:
        1.  Transition to Default Screen.
    *   `UPDATE_PLAYER`:
        1.  Update `player` state.

### REST API

-   **Base URL**: Configured via Admin Screen (persisted in app context).
-   **Endpoints**:
    *   `GET {{base_url}}/seats/[seat]`: Fetches `SeatDataType` for a given seat number. Used for player data.
    *   `GET {{base_url}}/tiers`: Fetches an array of `TierDataType`. Used to get current tier details.

### Outgoing WebSocket Events

-   **`check`**: Sent when a question image is successfully loaded.
    ```typescript
    // Interface for the 'check' message
    export interface iCheckMessage {
      seat: number;      // Current seat number from app context
      imageloaded: boolean; // true
    }
    ```
-   **`answer`**: Sent when a player submits an answer, uses a pass, or makes a buyout decision.
    ```typescript
    // Interface for the 'answer' message
    export interface iAnswerMessage {
      seat: number;          // Current seat number from app context
      answer?: string;        // Player's answer text or selected option
      pass?: boolean;         // true if 'Pass' button was used
      boughtOut?: boolean;    // true if 'Buyout' button was used
      auto: boolean;         // true if submitted automatically on QUESTION_CLOSED, false for manual submissions
    }
    ```

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Data Models

```typescript
// Persisted App Context
export interface AppContextType {
  seatNumber: number | null;
  serverIP: string | null;
  locale: 'en' | 'uk';
}

// WebSocket Broadcast States from Server
export type BroadcastState =
  | 'QUESTION_PRE'
  | 'QUESTION_OPEN'
  | 'QUESTION_CLOSED'
  | 'QUESTION_COMPLETE'
  | 'IDLE'
  | 'BUYOUT_OPEN'
  | 'BUYOUT_COMPLETE'
  | 'UPDATE_PLAYER'; // Client listens for this

// Payload for most WebSocket events
export interface iQuizSate { // As received from WebSocket
  showNumber: Date;
  tierNumber: number; // Used to identify the current tier (matches TierDataType.idx)
  tierLegend: string; // Displayed in Prepare Screen, used for buyout check
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

// Player Data (part of SeatDataType)
export type PlayerDataType = {
  id: number;
  name: string;
  rank: string | null;
  occupation: string | null;
  notes: string | null;
  goal: string | null;
  relations: string[] | null; // Assuming string array, adjust if different
  isActive: boolean;
  usedPassOne: boolean;
  usedPassTwo: boolean;
  boughtOut: boolean;
  boughtOutEndGame: boolean;
  externalId: string; // Or number, clarify if necessary
  image: string; // Player's avatar/image filename
};

// Seat Data (from GET /seats/[seat])
export type SeatDataType = {
  id: string; // Or number, clarify
  seat: number;
  description: string;
  sector: string;
  cameras: string;
  player?: PlayerDataType | null;
};

// Question Type Enum
export type QuestionTypeEnum = 'MULTIPLE' | 'TEXT' | 'TEXT_NUMBER' | ''; // '' for safety

// Question Data (nested in TierDataType from GET /tiers)
export type QuestionDataType = {
  id: string; // Or number
  label: string;
  image: string; // Filename of the question image
  questionType: QuestionTypeEnum;
  answerOptions: string; // Semicolon-delimited string, e.g., "A;B;C;D"
  correctAnswer: string;
  description: string | null;
  // boundToNumber: string; // Not directly used by client based on prereqs
  // passOneAllowed: boolean; // Tier level passOneAllowed is used
  // passTwoAllowed: boolean; // Tier level passTwoAllowed is used
  // enableCountdown: boolean; // Tier level enableCountdown is used
};

// Tier Data (as received from GET /tiers)
export type TierDataType = {
  id: string; // Or number
  idx: number; // Matches iQuizSate.tierNumber
  legend: string;
  passOneAllowed: boolean;
  passTwoAllowed: boolean;
  enableCountdown: boolean;
  // questionType: QuestionTypeEnum; // This seems to be on the nested question object
  boundQuestion: string; // ID of the bound question
  question?: QuestionDataType | null; // Contains detailed question info
  // createdAt, updatedAt fields exist but not used by client
};


// App's Internal Tier State (derived from TierDataType and iQuizSate)
export type AppTierType = {
  tierNumber: number;       // From iQuizSate.tierNumber
  legend: string;           // From TierDataType.legend (or iQuizSate.tierLegend)
  passOneAllowed: boolean;  // From TierDataType
  passTwoAllowed: boolean;  // From TierDataType
  enableCountdown: boolean; // From TierDataType
  label: string;            // From TierDataType.question.label
  image: string;            // From TierDataType.question.image
  questionType: QuestionTypeEnum; // From TierDataType.question.questionType
  answerOptions: string;    // From TierDataType.question.answerOptions
};
```

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Detailed State Update Logic

### Player State Updates (`PlayerDataType`)

-   The player state is managed by TanStack Query, typically associated with a query key like `['player', seatNumber]`.
-   **Initial Fetch**: On app start (if `seatNumber` is in context) or when `seatNumber` is set/changed in Admin Screen.
    *   API Call: `GET {{base_url}}/seats/[seatNumber]`
    *   On Success: Update TanStack Query cache with `SeatDataType.player`.
-   **Refetch Triggers**:
    *   On `QUESTION_PRE` WebSocket event: Invalidate and refetch.
    *   On `QUESTION_COMPLETE` WebSocket event: Invalidate and refetch.
    *   On `BUYOUT_COMPLETE` WebSocket event: Invalidate and refetch.
    *   On `UPDATE_PLAYER` WebSocket event: Invalidate and refetch.
    *   On app reload/pull-to-refresh action.

### Tier State Updates (`AppTierType`)

-   The current tier state is managed by TanStack Query or a combination of local state and TanStack Query, query key might be `['tier', tierNumber]`.
-   **Update Trigger**: On `QUESTION_PRE` WebSocket event:
    1.  Extract `tierNumber` from the `iQuizSate` payload.
    2.  API Call: `GET {{base_url}}/tiers`.
    3.  On Success:
        *   Find the `TierDataType` object in the returned array where `TierDataType.idx === tierNumber`.
        *   If found, transform this `TierDataType` (and its nested `question` object) into the `AppTierType` structure.
            *   `AppTierType.tierNumber` = `iQuizSate.tierNumber`
            *   `AppTierType.legend` = `foundTier.legend` (or `iQuizSate.tierLegend` if preferred source)
            *   `AppTierType.passOneAllowed` = `foundTier.passOneAllowed`
            *   `AppTierType.passTwoAllowed` = `foundTier.passTwoAllowed`
            *   `AppTierType.enableCountdown` = `foundTier.enableCountdown`
            *   `AppTierType.label` = `foundTier.question.label`
            *   `AppTierType.image` = `foundTier.question.image`
            *   `AppTierType.questionType` = `foundTier.question.questionType`
            *   `AppTierType.answerOptions` = `foundTier.question.answerOptions`
        *   Update TanStack Query cache or local state with this `AppTierType` data.
    4.  This new `AppTierType.image` is then used for the [Image Loading Process](#image-loading-process).

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Image Loading Process

1.  Triggered after tier state is updated, typically following a `QUESTION_PRE` event.
2.  The app uses the `image` path from the current `AppTierType` state (e.g., `AppTierType.image`, which is `tierDataType.question.image`).
3.  Construct the full image URL: `{{base_url}}/images/questions/[AppTierType.image]` (assuming a convention like `/images/questions/` on the server for question images, this needs to be confirmed or made configurable).
4.  Download the image.
5.  On successful image load:
    *   Send the `check` WebSocket message to the server: `{ seat: [seatNumber], imageloaded: true }`.
    *   The app can then transition from Default Screen to Prepare Screen (if other conditions for Prepare Screen are met).
6.  On image load failure: Implement retry logic and/or display a placeholder.

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Localization

-   Support for English (`en`) and Ukrainian (`uk`).
-   Language selection available on the Admin Screen.
-   Selected locale is persisted in app context (AsyncStorage).
-   All user-facing strings (UI text, messages, button labels) must be localized.
-   Keyboard language for `TEXT` input fields should adapt based on the selected locale if feasible and makes sense for the input type.

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Offline Functionality

-   The application is designed to run on a local network without direct internet access.
-   All essential static assets (app logo, fonts) must be bundled within the application package.
-   Question images are fetched from the local game server.
-   Robust WebSocket and API error handling for local network issues (e.g., server temporarily unavailable).

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Error Handling

-   **WebSocket Connection**:
    *   Display connection status indicators.
    *   Implement automatic reconnection attempts with exponential backoff.
-   **REST API Calls**:
    *   Use TanStack Query's built-in retry mechanisms.
    *   Display user-friendly error messages or placeholders for failed data fetches.
-   **Image Loading**:
    *   Show a placeholder if an image fails to load.
    *   Optionally implement a retry mechanism for image loading.
-   **Input Validation**:
    *   Provide clear feedback for any invalid inputs on the Admin Screen.
-   **General Errors**: Gracefully handle unexpected errors and provide a way for the app to recover or be reset if necessary.

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Performance Considerations

-   Optimize image loading: Use appropriate image formats and sizes. Cache images if possible (React Native's default Image component has some caching).
-   Minimize re-renders: Use `React.memo`, `useCallback`, `useMemo` where appropriate. Efficient state updates with TanStack Query.
-   Ensure smooth screen transitions and animations.
-   Profile application performance on target tablet devices.

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Testing Strategy (High-Level)

-   **Unit Tests (Jest)**: For utility functions (e.g., `checkBuyouts`), custom hooks, state transformation logic.
-   **Component Tests (React Native Testing Library)**: For individual UI components (buttons, input fields, screen layouts).
-   **Integration Tests**:
    *   Test interactions between components and state management (TanStack Query).
    *   Mock WebSocket and API services to test data flow and screen updates based on simulated server events/responses.
-   **End-to-End Tests (Detox or similar, if feasible)**: For critical user flows on a simulator or device.

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Deployment Strategy

-   Build standalone application packages using Expo Application Services (EAS Build).
-   Manual deployment/sideloading of APKs (Android) or IPAs (iOS, if applicable) onto the tablets.
-   Establish a clear process for updating the application on all player tablets.

[⬆️ Back to Table of Contents](#table-of-contents)
