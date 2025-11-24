# CMPM 121: D3

Aegis Michael

## Game Design Vision

## Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

## Assignments

### D3.a: Core Mechanics (token collection and crafting)

Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?

Key gameplay challenge: Can players collect and craft tokens from nearby locations to finally make one of sufficiently high value?

**Steps:**

- [x] look through the project and build a familiarity with how it works
- [x] figure out where to start and make more steps LMFAOOOO
- [x] set up the map centered on the classroom
- [x] spawn some boxes yipeee
- [x] get the boxes to be randomly spawned with a tweakable spawn rate
- [x] display cell value
- [x] randomize cell value (powers of 2) deterministically
- [x] change cell color based on value
- [x] make cell text nicer
- [x] add an area to show token value
- [x] keep track of players current token value and start them with value 2
- [x] allow player to click on a cell of equal value to double their points
- [x] create a popup to let the player know they won, then reset token counter
- [x] delete the text of that have been collected
- [x] clean up code and submit
- [x] figure out why cell text is behaving differently in github pages deployment
- [x] verify it works and submit

### D3.b: Globe-Spanning Gameplay

Key technical challenge: Maintain and update the player's position according to the buttons, and continuously spawn/despawn cells as necessary to maintain a screen full of cells.

Key gameplay challenge: Reduce player collection range.

**Steps:**

- [x] refactor map to allow updates to position
- [x] add face buttons to allow user to change current position
- [x] reduce possible collection distance
- [x] darken cells that are outside of collection range
- [x] remove cells that are out of neighborhood range
- [x] generate new cells proceedurally as the player moves around the map

### D3.c: Object Persistance

Key technical challenge: Maintain the state of cells so that they don't regenerate tokens when you leave and come back.

Key gameplay challenge: Fully and permanently (bar page refreshes) remove cells from the map when collected.

**Steps:**

- [x] use new cell removing functionality to remove cells when they're collected
- [x] set up a map to hash in the stringified coordinates that maintains whether cells have been collected
- [x] extract the cell creation process into a method, with a check to verify the cell hasn't already been collected first

### D3.d: Gameplay Across Real-World Space and Time

Key technical challenge: Implement geolocation to track the player's real position, and store game data so progress saves.

Key gameplay challenge: Integrate real-world location into the game, and maintain support for button-based gameplay.

**Steps:**

- [x] refactor token system to follow directions properly (i misunderstood them and was corrected by a friend)
- [x] fix token spawning to span the entire screen and keep cells the correct color
- [x] change background color to reflect current tokens
- [x] get access to location services, and start the player at their real-world location
- [x] reduce cell size and cell collection size to make the game more mobile friendly
- [x] poll the player's location every x seconds and update the map accordingly
- [x] add a button to switch between button and geo mode
- [x] implement localStorage API to save map data and current player tokens
- [x] implement a new game feature to clear save and start over
- [x] add save, load, and newgame buttons
- [] test that everything works on on mobile
