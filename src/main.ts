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
const playerMarker = leaflet.marker(CLASSROOM_LATLNG);
playerMarker.bindTooltip(":3");
playerMarker.addTo(map);

//#endregion

// ---------------------------------------------------------------------------------------------------------------
//#region CELLS
// ---------------------------------------------------------------------------------------------------------------

const CELL_SIZE = 1.2e-4;
const SPAWN_CHANCE = 0.1;

const NEIGHBORHOOD_SIZE = 30;
const MAX_CELL_COLLECTION_DISTANCE = 0.001;

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

class Cell {
  value: number;
  inRange: boolean;
  active: boolean = true;
  lookup: number;
  latLng: leaflet.LatLng;
  cell: leaflet.Rectangle;

  constructor(i: number, j: number) {
    // size of the cell
    const bounds = this.createCellBounds(i, j, CLASSROOM_LATLNG);
    this.latLng = bounds.getCenter();

    this.inRange = this.withinRange();

    // generate value and color lookup
    this.lookup = this.generateLookup(i, j);
    this.value = CELL_VALUE_LOOKUP[this.lookup];

    // create a basic cell
    this.cell = this.createCell(bounds);
    this.cell.addTo(map);

    // add text to cell
    const cellText = this.createCellText(this.cell);
    cellText.addTo(map);

    // add click behavior to cell (to allow collection)
    this.cellClickBehavior(this.cell, cellText);
  }

  createCellBounds(
    i: number,
    j: number,
    origin: leaflet.LatLng,
  ): leaflet.LatLngBounds {
    return leaflet.latLngBounds([
      [origin.lat + i * CELL_SIZE, origin.lng + j * CELL_SIZE],
      [
        origin.lat + (i + 1) * CELL_SIZE,
        origin.lng + (j + 1) * CELL_SIZE,
      ],
    ]);
  }

  createCell(bounds: leaflet.LatLngBounds): leaflet.Rectangle {
    const cellColor = this.inRange ? CELL_COLOR_LOOKUP[this.lookup] : "#000000";

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
        CELL_VALUE_LOOKUP.length,
    );
  }

  cellClickBehavior(cell: leaflet.Rectangle, cellText: leaflet.Marker): void {
    cell.addEventListener("click", () => {
      if (tokens == this.value && this.active && this.inRange) {
        tokenCollected();
        this.active = false;
        map.removeLayer(cellText);
      }
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
}

const loadedCells: Cell[] = [];

initCells();
function initCells() {
  for (let i: number = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
    for (let j: number = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
      const rng: number = luck([i, j, "initialValue"].toString());
      if (rng < SPAWN_CHANCE) {
        loadedCells.push(new Cell(i, j));
      }
    }
  }
}

function updateCells() {
  loadedCells.forEach((cell: Cell) => {
    cell.recalculateDistance();
  });
}

//#endregion

// ---------------------------------------------------------------------------------------------------------------
//#region TOKENS
// ---------------------------------------------------------------------------------------------------------------

let tokens: number = 2;
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

function tokenCollected(): void {
  tokens *= 2;
  updateTokenDisplay();

  if (tokens >= TOKENS_TO_WIN) endGame();
}

function updateTokenDisplay(): void {
  tokenCounter.innerHTML = `${tokens}`;
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
  map.setView(newPos);
}

function movePosition(deltaLat: number, deltaLng: number) {
  setMapPosition(
    playerMarker.getLatLng().lat + deltaLat,
    playerMarker.getLatLng().lng + deltaLng,
  );
}

//#region move buttons

const upButton = document.createElement("button");
document.body.append(upButton);
upButton.addEventListener("click", () => {
  movePosition(CELL_SIZE, 0);
  updateCells();
});
upButton.innerHTML = "^";

const downButton = document.createElement("button");
document.body.append(downButton);
downButton.addEventListener("click", () => {
  movePosition(-CELL_SIZE, 0);
  updateCells();
});
downButton.innerHTML = "v";

const leftButton = document.createElement("button");
document.body.append(leftButton);
leftButton.addEventListener("click", () => {
  movePosition(0, -CELL_SIZE);
  updateCells();
});
leftButton.innerHTML = "<";

const rightButton = document.createElement("button");
document.body.append(rightButton);
rightButton.addEventListener("click", () => {
  movePosition(0, CELL_SIZE);
  updateCells();
});
rightButton.innerHTML = ">";

//#endregion

//#endregion
