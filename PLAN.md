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
