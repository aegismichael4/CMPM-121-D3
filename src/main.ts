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

const TILE_DEGREES = 1e-4;
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
  "#ffd900ff",
  "#5eff00ff",
  "#00ff88ff",
  "#00fff2ff",
  "#00a2ffff",
];

class Cell {
  value: number;

  constructor(i: number, j: number) {
    const origin = CLASSROOM_LATLNG;
    const bounds = leaflet.latLngBounds([
      [origin.lat + i * TILE_DEGREES, origin.lng + j * TILE_DEGREES],
      [
        origin.lat + (i + 1) * TILE_DEGREES,
        origin.lng + (j + 1) * TILE_DEGREES,
      ],
    ]);

    const rect = leaflet.rectangle(bounds);
    rect.addTo(map);

    const lookup = Math.floor(
      luck([i, j, "valueGenerator!"].toString()) *
        CELL_VALUE_LOOKUP.length,
    );
    this.value = CELL_VALUE_LOOKUP[lookup];
    const label = leaflet.divIcon({
      className: "cache-label",
      html: this.value.toFixed(),
      iconSize: [30, 30],
    });
    const marker = leaflet.marker(rect.getCenter(), {
      icon: label,
      interactive: false,
    });
    marker.addTo(map);

    rect.setStyle({
      fillColor: CELL_COLOR_LOOKUP[lookup],
      color: CELL_COLOR_LOOKUP[lookup],
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
