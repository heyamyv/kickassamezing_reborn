# Flash to HTML5 Game Conversion

This directory contains HTML5 conversions of the original Flash games.

## Games Converted

### 1. Eat The Clouds
- **Location**: `eatTheClouds/`
- **Original**: `../eatTheClouds.swf`
- **Description**: Control Dood with arrow keys to eat all 10 clouds while avoiding obstacles
- **Play**: Open `eatTheClouds/index.html` in a web browser

### 2. Whack A Dood
- **Location**: `whackADoodGame/`
- **Original**: `../whackADoodGame.swf`
- **Description**: Classic whack-a-mole game - click on Doods when they pop up from holes
- **Play**: Open `whackADoodGame/index.html` in a web browser

## Project Structure

```
html5-games/
├── eatTheClouds/
│   ├── index.html          # Main game file
│   ├── test-original.html  # Test original Flash game with Ruffle
│   ├── css/
│   │   └── style.css       # Game styling
│   ├── js/
│   │   └── game.js         # Game logic
│   └── assets/
│       ├── images/         # Extracted images (if any)
│       └── sounds/         # Extracted sounds
│           ├── sound1.mp3  # Eat sound effect
│           └── sound2.mp3  # Background music
└── README.md
```

## How to Play

1. Open any `index.html` file in a modern web browser
2. Use arrow keys (or WASD) to move
3. Follow the on-screen instructions

## Games Remaining to Convert

- [ ] Whack A Dood Game
- [ ] Download Game
- [ ] Main Screen Menu

## Technical Details

### Technologies Used
- HTML5 Canvas for rendering
- Vanilla JavaScript (no frameworks)
- CSS3 for styling
- Web Audio API for sounds

### Extracted Assets
Assets were extracted from the original SWF files using:
- swftools (`swfextract`)
- swfdump for analyzing structure

### Features Implemented
- Keyboard controls
- Collision detection
- Score tracking
- Timer system
- Sound effects
- Win/lose conditions
- Responsive design

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## Testing the Original Flash Games

To see the original Flash games, open the `test-original.html` files. These use Ruffle (a Flash emulator) to run the original SWF files in the browser.
