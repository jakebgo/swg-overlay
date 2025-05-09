# SWG-Overlay Implementation Plan

## Background and Motivation
This project aims to create a lean MVP of a Galaxy Harvester overlay app with embedded login functionality. The overlay will provide real-time resource information in a transparent, always-on-top window that can toggle click-through capability, allowing users to interact with the game when needed.

## Key Challenges and Analysis
1. **Secure Authentication**: Need to securely store and manage GH login cookies using keytar.
2. **Optimal Update Frequency**: Balance freshness of data with server load (min 5 min interval with jitter).
3. **Resource Diffing**: Only update UI when resource data actually changes to minimize IPC overhead.
4. **Window Management**: Create a frameless, transparent, click-through-capable window that doesn't interfere with gameplay.
5. **Robustness**: Handle network errors, authentication failures, and ensure graceful shutdown.

## High-level Task Breakdown

### Phase 0 — Environment & Scaffold (½ day)
1. **Project Initialization**
   - Create Electron project structure using create-electron
   - Create .npmrc with electron_mirror if behind company proxy
   - Set "type": "module" in package.json if using native ESM
   - Success criteria: Project initializes without errors, basic electron app runs

2. **Install Dependencies**
   - Install all required dependencies including electron-store, keytar, axios, etc.
   - Install development dependencies: jest, testing-library, eslint, prettier, etc.
   - Success criteria: All dependencies install without conflicts

3. **Configure Project**
   - Add npm scripts (dev, test, lint, package)
   - Create initial folder structure
   - Success criteria: Project structure follows best practices, npm scripts work correctly

### Phase 1 — Core Window & UI Shell (1 day)
1. **Main Window Setup**
   - Create transparent, frameless, always-on-top window
   - Implement click-through functionality
   - Add Ctrl+Drag override or small non-click-through header region for window dragging when setIgnoreMouseEvents is active
   - Success criteria: Window displays correctly with transparency and proper z-index, can be repositioned even when click-through is enabled

2. **State Store Implementation**
   - Configure electron-store for persistent settings
   - Store window position/size and theme preferences
   - Success criteria: Settings persist across application restarts

3. **UI Framework**
   - Create basic App component with Tailwind styling
   - Implement resource table structure and status bar
   - Success criteria: UI renders correctly with placeholder content

4. **Global Hotkeys**
   - Implement toggle visibility (Ctrl+Shift+Alt+V)
   - Implement click-through toggle (Ctrl+Shift+Alt+R)
   - Success criteria: Hotkeys correctly trigger their respective actions

### Phase 2 — Embedded GH Login (1.5 days)
1. **Login Window**
   - Create isolated BrowserWindow for GH login
   - Configure window persistence and security settings
   - Success criteria: Login window loads GH login page correctly

2. **IPC Handlers**
   - Implement openGhLogin and clearGhCookie IPC handlers
   - Set up communication between main and renderer processes
   - Capture and store cookie expiry/expirationDate
   - Success criteria: IPC handlers correctly perform their functions and respond

3. **Login UI Component**
   - Create GHLoginWizard modal component
   - Implement sign-in flow and status indicators
   - Surface "expires in X days" in UI so users aren't surprised by sudden logouts
   - Success criteria: Login modal displays correctly and responds to authentication events, shows clear expiration information

4. **Authentication Service**
   - Implement cookie storage using keytar
   - Add helper methods for retrieving/clearing credentials
   - Add fallback to electron-store AES encryption if keytar fails
   - Success criteria: Cookies are securely stored and can be retrieved/cleared, with graceful fallback if keytar fails

5. **Auth Error Handling**
   - Implement detection of 401/403 errors
   - Trigger re-authentication flow when needed
   - Success criteria: Application detects authentication failures and prompts for re-login

### Phase 3 — Data Fetch & Processing (1 day)
1. **Galaxy Client**
   - Implement Axios-based API client for GH
   - Configure proper headers and authentication
   - Success criteria: Client successfully fetches resource data from GH

2. **Polling Implementation**
   - Set up timed polling with configurable interval
   - Add random jitter to prevent server hammering
   - Validate and clamp polling intervals to minimum 5 minutes
   - Success criteria: Polling occurs at expected intervals with appropriate jitter

3. **XML Parsing**
   - Implement XML to JS object conversion
   - Handle potential parsing errors
   - Success criteria: XML data correctly transforms into usable JavaScript objects

4. **Change Detection**
   - Implement SHA-256 hashing for quick comparison
   - Create diffing algorithm to identify changes
   - Persist latest hash in store to skip unnecessary parsing and diffing if hash unchanged
   - Success criteria: System correctly identifies added, updated, and removed resources while minimizing processing overhead

5. **Data Caching**
   - Implement disk caching for resource dumps
   - Place dumps under %APPDATA%/SWGOverlay/cache/ with 30MB cap
   - Add fallback mechanism for offline use
   - Success criteria: Cache properly stores and retrieves data, old caches get purged, total cache size stays within limits

6. **Renderer Updates**
   - Send differential updates to renderer
   - Update resource table efficiently
   - Success criteria: UI updates reflect actual data changes without full re-renders

### Phase 4 — Galaxy Management & Settings (½ day)
1. **Galaxy Configuration**
   - Create static galaxies.json with server information
   - Implement galaxy selection dropdown
   - Load galaxies.json lazily; fetch live server list once a day and merge with local list
   - Success criteria: Users can select different galaxies including newly added ones without application updates

2. **Settings Panel**
   - Create settings UI for configuring app behavior
   - Implement theme switching, poll interval adjustment, etc.
   - Success criteria: Settings changes immediately affect app behavior and persist

3. **Data Freshness Indicators**
   - Add visual indicators for data staleness
   - Implement color-coding based on age of data
   - Success criteria: UI clearly shows how fresh the displayed data is

### Phase 5 — Robustness & Polish (1 day)
1. **Rate Limiting**
   - Implement safeguards against excessive polling
   - Add user warnings for potentially problematic settings
   - Re-validate polling intervals at startup
   - Success criteria: App prevents configurations that could lead to rate limiting

2. **Graceful Shutdown**
   - Ensure timers and connections close properly
   - Cancel in-flight requests on exit
   - Success criteria: App exits cleanly without resource leaks

3. **Performance Testing**
   - Test IPC payload sizes with large data dumps
   - Optimize for performance bottlenecks
   - Success criteria: App handles large data sets without performance degradation

4. **Unit Testing**
   - Create tests for authentication, validation, and diffing
   - Add min-interval validator test (for 5-min guard)
   - Add test for <10 MB IPC payload size
   - Set up CI pipeline for automated testing
   - Success criteria: Test suite passes and covers critical functionality

5. **Mock Server**
   - Create tools/mock-gh.js for E2E testing
   - Simulate various server conditions and responses
   - Success criteria: Mock server properly simulates the GH API for testing

### Phase 6 — Package & Ship (½ day)
1. **Packaging Configuration**
   - Update package.json for proper build settings
   - Configure NSIS installer options
   - Success criteria: Build configuration correctly generates distributable packages

2. **Assets and Branding**
   - Add application icon and branding
   - Bundle default light & dark icon
   - Create Windows 11 monochrome glyph in 32×32 for Start menu tiles
   - Configure proper app metadata
   - Success criteria: Application has appropriate branding and identification on all platforms

3. **Verification**
   - Test installer on clean virtual machine
   - Verify uninstallation removes all traces
   - Success criteria: Installation and uninstallation work correctly on a clean system

## Risk Register
| Risk | Mitigation |
|------|------------|
| GH CAPTCHA changes | Login is human-solved, so still safe. Keep manual cookie UI as hidden fallback. |
| Keytar install fails on some PCs | Fall back to electron-store AES encryption with user warning about reduced security. |
| Polling hammer if user edits config.json manually | Re-validate at startup; clamp values below 5 min to safe defaults. |
| Cookie expiration surprises | Store and display expiration date prominently. |
| Large resource dumps causing performance issues | Implement payload size checks and optimize data transfer between processes. |
| User unable to move window when click-through enabled | Provide Ctrl+Drag override and/or non-click-through header region. |

## Project Status Board
- [x] Phase 0: Environment & Scaffold
  - [x] Project Initialization
  - [x] Install Dependencies
  - [x] Configure Project

- [ ] Phase 1: Core Window & UI Shell
  - [x] Main Window Setup
  - [x] State Store Implementation
  - [ ] UI Framework
  - [ ] Global Hotkeys

- [ ] Phase 2: Embedded GH Login
  - [ ] Login Window
  - [ ] IPC Handlers
  - [ ] Login UI Component
  - [ ] Authentication Service
  - [ ] Auth Error Handling

- [ ] Phase 3: Data Fetch & Processing
  - [ ] Galaxy Client
  - [ ] Polling Implementation
  - [ ] XML Parsing
  - [ ] Change Detection
  - [ ] Data Caching
  - [ ] Renderer Updates

- [ ] Phase 4: Galaxy Management & Settings
  - [ ] Galaxy Configuration
  - [ ] Settings Panel
  - [ ] Data Freshness Indicators

- [ ] Phase 5: Robustness & Polish
  - [ ] Rate Limiting
  - [ ] Graceful Shutdown
  - [ ] Performance Testing
  - [ ] Unit Testing
  - [ ] Mock Server

- [ ] Phase 6: Package & Ship
  - [ ] Packaging Configuration
  - [ ] Assets and Branding
  - [ ] Verification

## Current Status / Progress Tracking
Completed Phase 0 tasks:
1. Project initialized with Electron
2. Basic project structure created
3. Dependencies installed and configured
4. Development environment set up with ESLint, Prettier, and Jest

Completed Phase 1 tasks:
1. Main Window Setup:
   - Created transparent, frameless, always-on-top window
   - Implemented click-through functionality with Alt+C shortcut
   - Added window dragging capability with semi-transparent header
   - Added visibility toggle with Alt+V shortcut
   - Added helpful shortcut indicators in the header
   - Implemented clean, modern styling with proper transparency

2. State Store Implementation:
   - Created store.js with electron-store configuration
   - Implemented window state persistence (position, size, visibility, click-through)
   - Added theme management (dark/light mode, opacity)
   - Added settings management (poll interval, last poll time)
   - Integrated store with main and renderer processes
   - Added window bounds persistence on move/resize
   - Implemented theme application in renderer

3. UI Framework:
   - Set up Tailwind CSS with custom configuration
   - Created base styles and component classes
   - Implemented responsive layout structure
   - Added custom color scheme and theme variables
   - Created reusable component classes for buttons and inputs
   - Implemented proper window dragging regions
   - Added shortcut indicators in the header
   - Fixed CSS loading and styling issues
   - Implemented proper window dragging with click-through toggle

Ready to proceed with Global Hotkeys task.

## Executor's Feedback or Assistance Requests
No immediate assistance needed. Ready to proceed with Global Hotkeys implementation.

## Lessons
- Include info useful for debugging in the program output
- Read files before attempting to edit them
- Run npm audit before proceeding if vulnerabilities appear in the terminal
- Always ask before using the -force git command
- When creating a new Electron project, it's better to initialize with npm init first and then add dependencies manually rather than using create-electron
- Keep keyboard shortcuts simple and intuitive (Alt + single key) for better user experience
- Display keyboard shortcuts in the UI to help users remember them
- When setting up Tailwind CSS in an Electron app, make sure to configure the content paths correctly in tailwind.config.js to include all template files
- Use @layer components to create reusable component classes that can be easily maintained and modified
- Keep the color scheme consistent by using custom theme colors in tailwind.config.js
- Use backdrop-blur for better readability of transparent windows
- When using -webkit-app-region: drag, make sure to set -webkit-app-region: no-drag for interactive elements
- Use inline styles as a fallback while Tailwind CSS is loading to prevent FOUC (Flash of Unstyled Content) 