# CoActMobile - React Native App

This is the mobile integration of CoAct.AI, built with React Native. It acts as a thin client that handles native audio hardware (recording and playback), renders clean UI components (simulation and scorecard), and manages state transitions.

## Getting Started

### Prerequisites
- Node.js 18+
- React Native environment configured (Android Studio / Xcode)

### Installation

1. Install JavaScript dependencies:
   ```bash
   npm install
   ```
2. Install iOS CocoaPods (macOS only):
   ```bash
   cd ios && pod install && cd ..
   ```

### Running the App

To build and run the application on a connected device or emulator:

- **Android:**
  ```bash
  npm run android
  ```
- **iOS:**
  ```bash
  npm run ios
  ```

## Mobile Architecture Blueprint

For detailed technical guidelines, including:
- UI/UX Design System (Glassmorphism, Micro-animations)
- State Management (Zustand)
- Audio Recording & Playback integrations
- Mobile PDF Viewer
- Offline LLM/STT Support optimizations

Please refer to the `MOBILE_REACT_NATIVE_BLUEPRINT.md` document located in the root directory of the repository.
