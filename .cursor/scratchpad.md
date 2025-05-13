# Galaxy Harvester Overlay Project

## Background and Motivation
The Galaxy Harvester Overlay is a desktop application designed to provide real-time resource information from Galaxy Harvester (gh.swganh.org) in an overlay format. This tool will help players track resource locations and availability without constantly switching between the game and the browser.

## Key Challenges and Analysis
1. Cookie Management
   - Need to handle gh_sid cookie for authentication
   - Must manage cookie expiration and renewal
   - Need to securely store and handle session data

2. Data Synchronization
   - Real-time updates from Galaxy Harvester
   - Efficient data caching and refresh mechanisms
   - Handling offline scenarios and reconnection

3. UI/UX Considerations
   - Non-intrusive overlay design
   - Clear resource information display
   - Easy access to login and settings
   - Ensure complete server list availability

4. Quality Filtering Refinement
   - Need to properly identify and extract the quality metric from Galaxy Harvester HTML
   - UI for quality filter needs improvement - should be a dropdown option rather than separate controls
   - Need to ensure server-side sorting works correctly with quality

## High-level Task Breakdown
1. Project Setup and Basic Structure
   - [x] Initialize Electron project
   - [x] Set up basic window management
   - [x] Implement click-through functionality
   - [x] Create basic UI layout

2. Authentication System
   - [x] Implement cookie detection
   - [x] Create login modal
   - [x] Handle authentication state
   - [x] Display login status and expiration
   - [ ] Implement automatic session refresh

3. Resource Data Integration
   - [x] Set up Galaxy Harvester data fetching
   - [x] Implement resource data parsing
   - [x] Refine parsing logic for direct-fetch snippet (now targeting resourceBox divs)
   - [x] Create resource display table
   - [x] Add resource filtering and sorting
   - [x] Expand server dropdown to include all Galaxy Harvester servers

4. UI/UX Implementation
   - [x] Design and implement overlay window
   - [x] Create resource information display
   - [x] Improve server dropdown styling
   - [ ] Add settings panel
   - [ ] Implement keyboard shortcuts

5. Testing and Optimization
   - [ ] Write unit tests
   - [ ] Perform integration testing
   - [ ] Optimize performance
   - [ ] Handle edge cases

## Project Status Board
- [x] Basic window setup with click-through
- [x] Login modal implementation
- [x] Cookie detection and authentication
- [x] Login status display with expiration
- [x] Resource data fetching
- [x] Resource table implementation
- [x] Resource filtering and sorting
- [x] Refine resource parsing logic for direct HTTP snippet
- [x] Add initial quality filtering for "Top Current Resources"
- [x] Expand server dropdown to include all Galaxy Harvester servers
- [x] Improve server dropdown styling and usability
- [ ] Refine quality calculation for accuracy
- [ ] Improve quality filter UI integration
- [ ] Settings panel
- [ ] Keyboard shortcuts
- [ ] Testing suite

## Current Status / Progress Tracking
- Basic application structure is complete
- Login system is functional with cookie detection
- Login status display is implemented with expiration time
- Resource data fetching and parsing is implemented
- Direct HTTP fetch updated to GET with query parameters to get time-view listing
- parseResourceData now targets div.resourceBox elements in table.resourceStats and extracts name, planet, amount, and quality
- parseResourceData now extracts amount from inlineBlock[2] and quality from inlineBlock[3]
- Resource table display is functional
- UI is responsive and follows modern design principles
- Resource filtering and sorting implemented in renderer UI
- Category and planet extraction corrected using href slug
- Spawn list parsing needs implementation; added debug logs for spawn row HTML
- Enhanced resource parsing to extract:
  - Multiple planets from planetBar (available planets are shown with classes)
  - Actual stat values with percentages from the resAttr table
- Updated UI to display multiple planets and format stat values with percentages
- Quality filtering for "Top Current Resources" has been removed as requested:
  - Removed quality extraction in the parseResourceData function
  - Removed quality column from the resource table
  - Removed ability to sort by quality
  - Removed checkbox to filter by quality and configurable threshold
  - Removed quality-related code from both App.js and resourceService.js
- Server dropdown updated to include all Galaxy Harvester servers:
  - Added all servers from the Galaxy Harvester website (33 additional servers)
  - Implemented better dropdown styling to handle the expanded list
  - Added CSS improvements for better readability and usability of the dropdown
  - Used sequential IDs starting from 121 for new servers (existing ones use 118-120)
- Next steps: Address any remaining UI/UX considerations or feature enhancements

## Executor's Feedback or Assistance Requests
- The server dropdown has been expanded to include all Galaxy Harvester servers.
- Server IDs were assigned sequentially (121-153) for added servers since actual Galaxy Harvester server IDs couldn't be determined.
- CSS styling was improved to make the dropdown more usable with the larger list of servers.
- Please verify that:
  1. The server dropdown now shows all available servers from Galaxy Harvester
  2. The dropdown styling is readable and usable
  3. Server selection works correctly
- If there are any issues with the implementation or if you know the actual server IDs that should be used, please let me know.

## Lessons
- Include info useful for debugging in the program output
- Read the file before you try to edit it
- If there are vulnerabilities that appear in the terminal, run npm audit before proceeding
- Always ask before using the -force git command
- When handling dates in JavaScript, ensure proper conversion between seconds and milliseconds for timestamps
- Use clear visual indicators for authentication status
- Implement proper error handling for cookie operations
- Use cheerio for HTML parsing in Node.js applications
- Implement proper error handling for network requests
- When implementing dropdowns with many options, provide proper styling for usability 