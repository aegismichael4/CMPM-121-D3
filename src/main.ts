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

const TILE_DEGREES = 1.2e-4;
const SPAWN_CHANCE = 0.1;

const NEIGHBORHOOD_SIZE = 30;

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
  active: boolean = true;

  constructor(i: number, j: number) {
    // size of the cell
    const bounds = this.createCellBounds(i, j, CLASSROOM_LATLNG);

    // generate value and color lookup
    const lookup = this.generateLookup(i, j);
    this.value = CELL_VALUE_LOOKUP[lookup];

    // create a basic cell
    const cell = this.createCell(bounds, lookup);
    cell.addTo(map);

    // add text to cell
    const cellText = this.createCellText(cell);
    cellText.addTo(map);

    // add click behavior to cell (to allow collection)
    this.cellClickBehavior(cell, cellText);
  }

  createCellBounds(
    i: number,
    j: number,
    origin: leaflet.LatLng,
  ): leaflet.LatLngBounds {
    return leaflet.latLngBounds([
      [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
      [
        origin.lat + (i + 1) * TILE_DEGREES,
        origin.lng + (j + 1) * TILE_DEGREES,
      ],
    ]);
  }

  createCell(bounds: leaflet.LatLngBounds, lookup: number): leaflet.Rectangle {
    return leaflet.rectangle(bounds, {
      fillColor: CELL_COLOR_LOOKUP[lookup],
      color: CELL_COLOR_LOOKUP[lookup],
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
    if (!this.active) return;

    cell.addEventListener("click", () => {
      if (tokens == this.value) {
        tokenCollected();
        this.active = false;
        map.removeLayer(cellText);
      }
    });
  }
}

initCells();
function initCells() {
  for (let i: number = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
    for (let j: number = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
      const rng: number = luck([i, j, "initialValue"].toString());
      if (rng < SPAWN_CHANCE) {
        new Cell(i, j);
      }
    }
  }
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
