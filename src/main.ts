// @deno-types="npm:@types/leaflet"
import leaflet from "leaflet";

// Style sheets
import "leaflet/dist/leaflet.css"; // supporting style for Leaflet
import "./style.css"; // page style

// Fix missing marker images
import "./_leafletWorkaround.ts"; // fixes for missing Leaflet images

// Import our luck function
import luck from "./_luck.ts";

// ---------------------------------------------------------------------------------------------------------------
//#region MAP SETUP
// ---------------------------------------------------------------------------------------------------------------

// create map element
const mapDiv = document.createElement("div");
mapDiv.id = "map";
document.body.append(mapDiv);

const CLASSROOM_LATLNG = leaflet.latLng(
  36.997936938057016,
  -122.05703507501151,
);

// player location (on page load)
const map = leaflet.map(mapDiv, {
  center: CLASSROOM_LATLNG,
  zoom: 19,
  minZoom: 19,
  maxZoom: 19,
  zoomControl: false,
  scrollWheelZoom: false,
});

// background tile layer
leaflet
  .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
  .addTo(map);

// player marker
const playerMarker = leaflet.marker(CLASSROOM_LATLNG, {
  interactive: false,
});
playerMarker.addTo(map);

//#endregion

// ---------------------------------------------------------------------------------------------------------------
//#region CELLS
// ---------------------------------------------------------------------------------------------------------------

const CELL_SIZE = 7.5e-5;
const SPAWN_CHANCE = 0.1;

//const NEIGHBORHOOD_LAT_SIZE = 7;
//const NEIGHBORHOOD_LNG_SIZE = 23;
const MAX_CELL_COLLECTION_DISTANCE = 0.0005;

const HIGHEST_SPAWNING_POWER = 3; // highest power of 2 that spawns on its own (so, 8)
const CELL_VALUE_LOOKUP: number[] = [
  2,
  4,
  8,
  16,
  32,
  64,
  128,
  256,
  512,
  1024,
  2048,
];

const CELL_COLOR_LOOKUP: string[] = [
  "#0400ffff",
  "#6f00ffff",
  "#ff009dff",
  "#ff0037ff",
  "#ff4800ff",
  "#ffae00ff",
  "#b3ff00ff",
  "#00ff15ff",
  "#00ff9dff",
  "#00fff2ff",
  "#0066ffff",
];

const EMPTY_CELL_COLOR: string = "#FFFFFFFF";

const collectedCells = new Map<string, number>();

class Cell {
  i: number;
  j: number;

  value: number;
  inRange: boolean;
  lookup: number;
  latLng: leaflet.LatLng;
  cell: leaflet.Rectangle;
  cellText: leaflet.Marker;

  removeFlag: boolean = false;

  constructor(i: number, j: number, value?: number) {
    this.i = i;
    this.j = j;

    // size of the cell
    const bounds = this.createCellBounds();
    this.latLng = bounds.getCenter();

    this.inRange = this.withinRange();

    if (value != undefined) {
      console.log("old value: " + value);
      this.value = value;
      this.lookup = CELL_VALUE_LOOKUP.indexOf(value);
    } else {
      // generate value and color lookup
      this.lookup = this.generateLookup(i, j);
      this.value = CELL_VALUE_LOOKUP[this.lookup];
    }

    // create a basic cell
    this.cell = this.createCell(bounds);
    this.cell.addTo(map);

    // add text to cell
    this.cellText = this.createCellText(this.cell);
    this.cellText.addTo(map);

    // add click behavior to cell (to allow collection)
    this.cellClickBehavior(this.cell);
  }

  createCellBounds(): leaflet.LatLngBounds {
    return leaflet.latLngBounds([
      [this.i * CELL_SIZE, this.j * CELL_SIZE],
      [
        (this.i + 1) * CELL_SIZE,
        (this.j + 1) * CELL_SIZE,
      ],
    ]);
  }

  createCell(bounds: leaflet.LatLngBounds): leaflet.Rectangle {
    let cellColor: string = EMPTY_CELL_COLOR;
    if (!this.inRange) {
      cellColor = "#000000";
    } else if (this.value > 0) {
      cellColor = CELL_COLOR_LOOKUP[this.lookup];
    }

    return leaflet.rectangle(bounds, {
      fillColor: cellColor,
      color: cellColor,
    });
  }

  createCellText(cell: leaflet.Rectangle): leaflet.Marker {
    return leaflet.marker(cell.getCenter(), {
      icon: this.createCellLabel(),
      interactive: false,
    });
  }

  createCellLabel(): leaflet.DivIcon {
    return leaflet.divIcon({
      className: "cell-label",
      html:
        `<div style="color: white; text-align: center; font-size: 14px; font-weight: bold"> ${this.value} </div>`,
      iconSize: [30, 30],
    });
  }

  generateLookup(i: number, j: number): number {
    return Math.floor(
      luck([i, j, "valueGenerator!!!"].toString()) *
        HIGHEST_SPAWNING_POWER,
    );
  }

  cellClickBehavior(cell: leaflet.Rectangle): void {
    cell.addEventListener("click", () => {
      if (this.inRange) {
        if (tokens == this.value) { // add tokens to space
          newTokenValue(0);
          this.updateCellValue(this.value * 2);
          collectedCells.set(`${this.i} ${this.j}`, this.value); // make sure if the player leaves and returns, the value stays the same
        } else if (tokens == 0) { // pick up tokens from cell
          newTokenValue(this.value);
          this.updateCellValue(0);
          collectedCells.set(`${this.i} ${this.j}`, this.value); // make sure if the player leaves and returns, the value stays the same
        } else if (this.value == 0) { // place all tokens in empty cell
          this.updateCellValue(tokens);
          newTokenValue(0);
          collectedCells.set(`${this.i} ${this.j}`, this.value); // make sure if the player leaves and returns, the value stays the same
        }
      }
    });
  }

  updateCellValue(newValue: number): void {
    this.value = newValue;

    // update text
    this.cellText.removeFrom(map);
    this.cellText = this.createCellText(this.cell);
    this.cellText.addTo(map);

    // update color
    this.lookup = CELL_VALUE_LOOKUP.indexOf(newValue);
    const newColor: string = this.value > 0
      ? CELL_COLOR_LOOKUP[this.lookup]
      : EMPTY_CELL_COLOR;
    this.cell.setStyle({
      fillColor: newColor,
      color: newColor,
    });
  }

  withinRange(): boolean {
    const latDist: number = this.latLng.lat - playerMarker.getLatLng().lat;
    const lngDist: number = this.latLng.lng - playerMarker.getLatLng().lng;
    const distance = Math.sqrt(Math.pow(latDist, 2) + Math.pow(lngDist, 2)); // thank you ms demarco

    return distance < MAX_CELL_COLLECTION_DISTANCE;
  }

  recalculateDistance(): void {
    this.inRange = this.withinRange();

    const cellColor = this.inRange ? CELL_COLOR_LOOKUP[this.lookup] : "#000000";

    this.cell.setStyle({
      fillColor: cellColor,
      color: cellColor,
    });
  }

  removeCell() {
    this.cell.removeFrom(map);
    this.cell.removeEventListener("click");
    this.cellText.removeFrom(map);
    //removeClickedCell();
  }
}

const loadedCells: Cell[] = [];

spawnCells();
function spawnCells() {
  const jStart = Math.floor(
    Math.min(map.getBounds().getWest(), map.getBounds().getEast()) / CELL_SIZE,
  );
  const jEnd = Math.floor(
    Math.max(map.getBounds().getWest(), map.getBounds().getEast()) / CELL_SIZE,
  );

  const iStart = Math.floor(
    Math.min(map.getBounds().getNorth(), map.getBounds().getSouth()) /
      CELL_SIZE,
  );
  const iEnd = Math.floor(
    Math.max(map.getBounds().getNorth(), map.getBounds().getSouth()) /
      CELL_SIZE,
  );

  //console.log(iStart + ", " + iEnd);
  //console.log(jStart + ", " + jEnd);

  for (let i = iStart - 1; i <= iEnd; i++) {
    for (let j = jStart - 1; j <= jEnd; j++) {
      const rng: number = luck([i, j, "initialValue"].toString());
      if (rng < SPAWN_CHANCE) {
        addCell(i, j);
      }
    }
  }
}

function addCell(i: number, j: number) {
  if (!collectedCells.has(`${i} ${j}`)) { // not already collected
    loadedCells.push(new Cell(i, j));
  } else {
    loadedCells.push(new Cell(i, j, collectedCells.get(`${i} ${j}`)));
  }
}

function updateCells() {
  // first, remove all cells
  loadedCells.forEach((cell: Cell) => {
    cell.removeCell();
  });

  loadedCells.splice(0);
  spawnCells();
}

//#endregion

// ---------------------------------------------------------------------------------------------------------------
//#region TOKENS
// ---------------------------------------------------------------------------------------------------------------

let tokens: number = 0;
const TOKENS_TO_WIN = 4096;

const tokenCounterWrapper = document.createElement("div");
document.body.append(tokenCounterWrapper);
tokenCounterWrapper.setAttribute(
  "style",
  "font-size: 50px; font-weight: bold; font-family: sans-serif",
);
tokenCounterWrapper.innerHTML = "Tokens: ";

const tokenCounter = document.createElement("div");
tokenCounter.id = "token-counter";
tokenCounter.setAttribute("style", "display: inline-block");
tokenCounterWrapper.appendChild(tokenCounter);
updateTokenDisplay();

function newTokenValue(value: number): void {
  tokens = value;
  updateTokenDisplay();
  if (tokens >= TOKENS_TO_WIN) endGame();
}

function updateTokenDisplay(): void {
  tokenCounter.innerHTML = `${tokens}`;
  const newColor: string = tokens > 0
    ? CELL_COLOR_LOOKUP[CELL_VALUE_LOOKUP.indexOf(tokens)]
    : "#FFFFFF";
  document.body.style.backgroundColor = newColor;
}

function endGame(): void {
  tokens = 2;
  updateTokenDisplay();
  alert("You Win!!!!!!!!!!!!!!!!!!");
}

//#endregion

// ---------------------------------------------------------------------------------------------------------------
//#region PLAYER POSITION
// ---------------------------------------------------------------------------------------------------------------

function setMapPosition(lat: number, lng: number): void {
  const newPos: leaflet.LatLng = new leaflet.LatLng(lat, lng);
  playerMarker.setLatLng(newPos);
  map.panTo(newPos);
  updateCells();
}

function movePosition(deltaLat: number, deltaLng: number) {
  setMapPosition(
    playerMarker.getLatLng().lat + deltaLat,
    playerMarker.getLatLng().lng + deltaLng,
  );
}

function geoLocatePlayer() {
  console.log("geo time");
  navigator.geolocation.getCurrentPosition(
    (position: GeolocationPosition) => {
      console.log(position.coords.latitude);
      setMapPosition(position.coords.latitude, position.coords.longitude);
    },
    (error: GeolocationPositionError) => {
      console.warn(`ERROR(${error.code}): ${error.message}`);
    },
    { timeout: 10000 },
  );
}
geoLocatePlayer();

//#region move buttons

const buttonContainer = document.createElement("div");
document.body.append(buttonContainer);

const upButton = document.createElement("button");
buttonContainer.append(upButton);
upButton.addEventListener("click", () => {
  movePosition(CELL_SIZE, 0);
});
upButton.innerHTML = "^";

const downButton = document.createElement("button");
buttonContainer.append(downButton);
downButton.addEventListener("click", () => {
  movePosition(-CELL_SIZE, 0);
});
downButton.innerHTML = "v";

const leftButton = document.createElement("button");
buttonContainer.append(leftButton);
leftButton.addEventListener("click", () => {
  movePosition(0, -CELL_SIZE);
});
leftButton.innerHTML = "<";

const rightButton = document.createElement("button");
buttonContainer.append(rightButton);
rightButton.addEventListener("click", () => {
  movePosition(0, CELL_SIZE);
});
rightButton.innerHTML = ">";

const moveButtons: HTMLButtonElement[] = [
  upButton,
  downButton,
  leftButton,
  rightButton,
];

//#endregion

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region GAME LOOP
// ------------------------------------------------------------------------------------------------------------------------------------------------

const TIME_BETWEEN_GEO_UPDATES: number = 10;
let geoUpdateTimer = 0;

// this function calls itself every tick, and keeps track of how much time has passed
let lastTime: number = -1;
function gameLoop(timestamp: number) {
  if (lastTime == -1) lastTime = timestamp;

  const deltaTime = (timestamp - lastTime) / 1000;

  update(deltaTime);

  lastTime = timestamp;
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

function update(deltaTime: number) {
  geoUpdateTimer += deltaTime;

  if (geoUpdateTimer > TIME_BETWEEN_GEO_UPDATES) {
    geoUpdateTimer = 0;
    if (inGeoMode) geoLocatePlayer();
  }
}

//#endregion

// ------------------------------------------------------------------------------------------------------------------------------------------------
//#region UI MANAGEMENT
// ------------------------------------------------------------------------------------------------------------------------------------------------

let inGeoMode: boolean = true;

const switchMoveMode = document.createElement("button");
document.body.append(switchMoveMode);
switchMoveMode.addEventListener("click", () => {
  inGeoMode = !inGeoMode;
  setMoveMode();
});
switchMoveMode.innerHTML = "Use Button Movement";
//#endregion

function setMoveMode() {
  if (inGeoMode) {
    geoLocatePlayer();
    switchMoveMode.innerHTML = "Use Button Movement";
    moveButtons.forEach((button: HTMLButtonElement) => {
      button.disabled = true;
      button.hidden = true;
    });
  } else {
    switchMoveMode.innerHTML = "Use Geolocation";
    moveButtons.forEach((button: HTMLButtonElement) => {
      button.disabled = false;
      button.hidden = false;
    });
  }
}
setMoveMode();
