# HTML5 Games - Dood's Kickassamazin World

This skill provides context for working on the HTML5 games collection in the kickassamezing project.

## Project Overview

This project contains three HTML5 canvas-based games, all converted from original Flash (SWF) files:
1. **Eat The Clouds** - Flying game where Dood eats clouds while avoiding obstacles
2. **Whack A Dood** - Whack-a-mole style game
3. **Download Game** - Download files while avoiding viruses

All games feature:
- Mobile-first responsive design with touch support
- HTML5 Canvas rendering
- Custom Dood character mascot
- Retro/nostalgic early 2000s aesthetic
- Main menu integration

## Directory Structure

```
html5-games/
├── index.html                 # Main menu with game cards
├── assets/
│   ├── dood.png              # Main mascot image
│   └── mainscreen/
├── eatTheClouds/
│   ├── index.html
│   ├── css/style.css
│   ├── js/game.js
│   └── assets/
│       ├── images/           # dood.png, dood2.png, clouds, enemies
│       └── sounds/
├── whackADoodGame/
│   ├── index.html
│   ├── css/style.css
│   ├── js/game.js
│   └── assets/
│       ├── images/           # dood.png, hammer.png, holes
│       └── sounds/
└── downloadGame/
    ├── index.html
    ├── css/style.css
    ├── js/game.js
    └── assets/
        ├── images/           # delinquent.jpg, dood2.png
        └── sounds/           # bgMusic.mp3, sound2.mp3
```

## Key Patterns & Conventions

### Mobile Optimization
All games follow these mobile patterns:

1. **Device Detection**
```javascript
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
```

2. **Canvas Sizing**
- Desktop: Fixed dimensions (e.g., 800x600, 550x400)
- Mobile: Full viewport with adjustments
```javascript
if (isMobile) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 150; // Account for UI elements
}
```

3. **Speed Scaling** (Download Game example)
```javascript
const speedMultiplier = isMobile ? (canvas.height / 400) * 2.5 : 1;
```
Objects move faster on mobile to compensate for larger screen distances.

4. **Touch Support**
All games handle both mouse and touch events:
```javascript
canvas.addEventListener('click', handleClick);
canvas.addEventListener('touchstart', handleClick);
canvas.addEventListener('touchend', handleClick);
```

### Game State Management
```javascript
let gameState = 'playing'; // 'playing', 'won', 'lost'
```

### Canvas Rendering Pattern
```javascript
function gameLoop() {
    if (gameState !== 'playing') return;

    // Clear canvas
    ctx.fillStyle = '#backgroundColor';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update game objects
    updateObjects();

    // Draw game objects
    drawObjects();

    requestAnimationFrame(gameLoop);
}
```

### CSS Styling
- Use CSS media queries for responsive breakpoints (@media max-width: 768px, 480px)
- Full viewport layouts on mobile
- Rounded corners, drop shadows for modern feel
- Animations using CSS keyframes

## Game-Specific Details

### Eat The Clouds
**Objective**: Eat 10 clouds while avoiding planes, birds, and UFOs

**Key Mechanics**:
- Arrow key/swipe controls for 8-directional movement
- Collision detection for cloud eating and enemy hits
- Cloud spawning with minimum distance constraints to prevent overlap
- Show dood.png during gameplay, dood2.png (happy face) on win screen

**Files**:
- Main game logic: `eatTheClouds/js/game.js`
- 8 cloud images (cloud1.png through cloud8.png)
- 3 enemy types with animations

### Whack A Dood
**Objective**: Whack as many Doods as possible before time runs out

**Key Mechanics**:
- Click/tap on Doods when they pop up from holes
- Random spawn timing and positions
- Score tracking and timer countdown

**Files**:
- Main game logic: `whackADoodGame/js/game.js`
- Hammer, dood, and hole sprites

### Download Game
**Objective**: Download good files, avoid viruses in 20 seconds

**Key Mechanics**:
- Files fall from top of screen
- Click/tap to download
- 50/50 spawn rate for good files vs viruses
- Courier font for retro computer aesthetic
- File sizes randomized between 200KB-1GB
- Collision detection prevents overlapping tiles

**Good Files** (8 total):
- Harry Potter 7
- John Grisham Novel
- Trolley Status
- Dubai
- evanescence sound track
- Really good movie
- burger menu
- kroger belt catalog

**Viruses** (8 total):
- $_for_nigerian_prince
- openME!.vir
- virusforyou.zip
- Trojan.exe
- ILOVEYOU
- DEF_CLICK_HERE
- doom!
- Harry Potter 9

**End Screens** (4 tiers):
1. **Clicked virus**: Red border, delinquent.jpg, "BUSTED! You downloaded a virus and got caught!"
2. **0 files**: Red border, red text "Dood disappointed", "why you so bad at dis"
3. **1-9 files**: Green border, "Time's up! You downloaded X files!"
4. **10+ files**: Green border, dood2.png next to "Congrats" text (flexbox layout)

**Technical Details**:
- Spawn delay: 60 frames (1 second at 60fps)
- Files have width: 180px, height: 60px
- Speed: `(1 + Math.random() * 0.5) * speedMultiplier`
- Text wrapping for long file names to prevent overflow
- Left-aligned text with 10px padding

## Main Menu (index.html)

The main menu uses a card-based layout with:
- Dood mascot at top (520px desktop, 390px tablet, 312px mobile)
- Animated bouncing mascot (doodBounce keyframes)
- Three game cards with custom icons:
  - **Window icon** with animated clouds (Eat The Clouds)
  - **Hammer icon** with swing animation (Whack A Dood)
  - **Computer screen** with download arrow (Download Game)
- Hover effects: translateY(-10px), scale transforms
- Grid layout: `repeat(auto-fit, minmax(350px, 1fr))`
- Olive green background (#6B8E23)

## Common Tasks

### Adding a New Game
1. Create directory: `newGame/`
2. Create subdirectories: `assets/{images,sounds}`, `css/`, `js/`
3. Follow mobile-first pattern with canvas sizing
4. Add touch event handlers
5. Create game card in main `index.html`
6. Use CSS animations for card icon

### Modifying Game Difficulty
- **Spawn rates**: Adjust spawn timers or probabilities
- **Speed**: Modify base speed or multipliers
- **Time limits**: Change countdown timers
- **Mobile**: Adjust speedMultiplier constant

### Adding New Assets
- Extract from SWF using `swfextract` if available
- Place in appropriate `assets/images/` or `assets/sounds/` directory
- Reference with relative paths

### Debugging on Mobile
- Test on actual devices, not just browser mobile emulation
- Check canvas sizing and speed multipliers
- Verify touch events are properly handled
- Test responsive breakpoints at 768px and 480px

## Design Philosophy

- **Simplicity over complexity**: Keep game mechanics straightforward
- **Mobile-first**: Design for touch, then add mouse support
- **Responsive**: Games should work on any screen size
- **Nostalgic**: Early 2000s web game aesthetic
- **Fun & lighthearted**: Dood character, playful names and messages
- **No over-engineering**: Only add features that are directly needed

## Version Control

All changes are committed to git with:
- Descriptive commit messages
- Co-authored by: `Claude Sonnet 4.5 <noreply@anthropic.com>`
- Push to: `https://github.com/heyamyv/kickassamezing_reborn.git`

## Future Considerations

When adding new games or features:
- Maintain consistent file structure
- Follow established mobile optimization patterns
- Use similar UI/UX conventions (buttons, end screens, etc.)
- Keep Dood character as central mascot
- Test on multiple mobile devices
- Document any new patterns in this skill
