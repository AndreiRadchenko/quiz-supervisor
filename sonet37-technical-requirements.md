# Quiz Player Technical Requirements

## Overview

This document outlines the technical requirements for the 1% Club Quiz Player application, a tablet client built with Expo React Native. This app enables players to participate in quiz games by answering multiple-choice or text-based questions.

## Table of Contents

- [Project Setup](#project-setup)
- [Architecture](#architecture)
- [State Management](#state-management)
- [UI/UX Requirements](#uiux-requirements)
- [Screen Specifications](#screen-specifications)
- [Network Communication](#network-communication)
- [Data Models](#data-models)
- [Localization](#localization)
- [Offline Functionality](#offline-functionality)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)
- [Testing Strategy](#testing-strategy)
- [Deployment Strategy](#deployment-strategy)

## Project Setup

### Technology Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: TanStack Query (React Query)
- **Networking**: WebSocket for real-time events, REST API for data fetching
- **UI Components**: React Native Paper or custom components
- **Navigation**: React Navigation
- **Storage**: AsyncStorage for persisted app context
- **Localization**: i18next or similar for EN and UK (Ukrainian) language support

### Development Environment

- Expo SDK: Latest stable version
- Node.js: LTS version
- Development will be conducted in offline mode due to network restrictions

### Constraints

- Application must work in a network environment without internet access
- All assets (fonts, images) must be bundled with the app
- Application orientation is restricted to portrait mode only
- The app must be optimized for tablet devices

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Architecture

### Application Structure

```
src/
├── api/            # API calls and WebSocket connection management
├── assets/         # Static assets (images, fonts)
├── components/     # Reusable UI components
├── constants/      # App constants and configuration
├── context/        # React Context for global state
├── hooks/          # Custom hooks
├── i18n/           # Localization files
├── navigation/     # Navigation configuration
├── screens/        # Screen components
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

### State Management

- **Global Persistent State**: App context stored with AsyncStorage
  - Seat number
  - Server IP address
  - Current locale (en/uk)
  
- **Server State Management**: TanStack Query
  - Player data
  - Tier and question data
  - Quiz game state

- **Websocket State**: Custom hook for managing WebSocket connections and events

[⬆️ Back to Table of Contents](#table-of-contents)

---

## UI/UX Requirements

### General UI Guidelines

- **Theme**: 1% Club branding and colors
- **Typography**: Include all required fonts in assets (no Google Fonts)
- **Layout**: Fixed portrait orientation for tablets
- **Responsive Design**: App should adapt to various tablet screen sizes

### UX Flow

1. **Application Start**:
   - Check for stored seat number and server IP
   - If not available, display admin login screen on long press in the upper right corner
   - If available, connect to WebSocket and display default screen

2. **Admin Access**:
   - Hidden login screen accessible via long press in upper right corner
   - Protected by password
   - Allows setting seat number, server IP, and locale

3. **Player Experience Flow**:
   - Default screen → Question preparation → Question screen → Answer submission → Default screen
   - Handle all WebSocket events according to game state changes

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Screen Specifications

### Default Screen

- Display 1% Club logo at the top
- Show seat number and player name at the center
- Player name displays in red when player.isActive is false
- This screen is shown whenever prepare or question screens are not active

### Prepare Screen

- Shown when:
  - player.isActive is true
  - QUESTION_PRE WebSocket event is received
  - Question image is fully loaded
- Displays seat number and player name at the top
- Shows "ready for tier [tierLegend]" message
- tierLegend is received from the server

### Question Screen

- Shown when:
  - player.isActive is true
  - QUESTION_OPEN WebSocket event is received
- Displays seat number and player name at the top
- Shows question image at the center (full screen width)
- UI elements below depend on question type:
  - For MULTIPLE: A, B, C, D buttons based on answerOptions
  - For TEXT: Text input field with standard keyboard
  - For TEXT_NUMBER: Text input field with numeric keyboard
- Shows "Pass" button if pass conditions are met:
  - (passOneAllowed is true AND passTwoAllowed is false AND usedPassOne is false) OR
  - (passOneAllowed is true OR passTwoAllowed is true) AND (usedPassOne is false OR usedPassTwo is false)
- For Buyout tiers (when tierLegend contains "Buyout"):
  - Display "Buyout" button instead of "Pass"
  - Hide question image and other controls
- Input submission logic:
  - For text inputs: "Confirm Answer" button sends answer
  - For multiple choice: Button press immediately sends answer
  - Auto-submission on QUESTION_CLOSED if not manually submitted

### Admin Screen

- Hidden screen accessible via long press in upper right corner
- Password protected
- Form to set:
  - Server IP address
  - Seat number
  - Language (EN/UK)
- Save button that persists settings to app context

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Network Communication

### WebSocket Connection

- **Connection Initialization**: Establish when seat number is assigned, app starts, or app reloads
- **Auto-reconnect**: Implement reconnection logic when connection is lost
- **Events Handling**:
  - QUESTION_PRE: Pre-question preparation
  - QUESTION_OPEN: Open question for answers
  - QUESTION_CLOSED: Close question, no more answers accepted
  - QUESTION_COMPLETE: Process question completion
  - IDLE: Return to default state
  - BUYOUT_OPEN: Open buyout option
  - BUYOUT_COMPLETE: Process buyout completion
  - UPDATE_PLAYERS: Update player information

### REST API

- **Base URL**: Configurable from admin screen
- **Endpoints**:
  - GET `/seats/[seat]`: Retrieve player information
  - GET `/tiers`: Retrieve all tier information

### Event Communication

- **Outgoing Events**:
  - `check`: Notify server when question image is loaded
  ```typescript
  interface iCheckMessage {
    seat: number;
    imageloaded: boolean;
  }
  ```

  - `answer`: Submit player's answer
  ```typescript
  interface iAnswerMessage {
    seat: number;
    answer?: string;
    pass?: boolean;
    boughtOut?: boolean;
    auto: boolean;
  }
  ```

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Data Models

### State Types

```typescript
// Quiz State
export type BroadcastState =
  | 'QUESTION_PRE'
  | 'QUESTION_OPEN'
  | 'QUESTION_CLOSED'
  | 'QUESTION_COMPLETE'
  | 'IDLE'
  | 'BUYOUT_OPEN'
  | 'BUYOUT_COMPLETE'
  | 'UPDATE_PLAYERS';

// Quiz State Interface
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

// Question Types
export type QuestionType = 'MULTIPLE' | 'TEXT' | 'TEXT_NUMBER' | '';

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

// Tier Data
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

export type TierType = {
  tierNumber: string;
  legend: string;
  passOneAllowed: boolean;
  passTwoAllowed: boolean;
  enableCountdown: boolean;
  label: string;
  image: string;
  questionType: string;
  answerOptions: string;
};

// Player Data
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

// Seat Data
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

## Localization

- Support for English (en) and Ukrainian (uk) languages
- Language selection on admin screen
- Localization for all UI elements and error messages
- Store selected locale in persisted app context

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Offline Functionality

- Application must function without internet access
- All assets must be included in the app bundle
- Automatic reconnection to local server when connection is lost

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Error Handling

- WebSocket connection errors: Display connection status and retry automatically
- API fetch errors: Implement retry mechanism with error feedback
- Image loading errors: Show placeholder and retry loading
- Input validation errors: Provide clear feedback to the user

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Performance Considerations

- Optimize image loading and caching
- Minimize unnecessary re-renders
- Implement efficient state updates with TanStack Query
- Handle WebSocket events efficiently

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Testing Strategy

- Unit tests for utility functions and hooks
- Component tests for UI elements
- Integration tests for API and WebSocket communication
- End-to-end tests for complete user flows

[⬆️ Back to Table of Contents](#table-of-contents)

---

## Deployment Strategy

- Build with Expo EAS
- Deploy as standalone app to tablets
- Create process for updating app on multiple tablets

[⬆️ Back to Table of Contents](#table-of-contents)
