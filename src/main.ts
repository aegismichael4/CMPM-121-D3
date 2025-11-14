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

class Cell {
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
  }
}

initCells();
function initCells() {
  for (let i: number = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
    for (let j: number = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
      console.log(luck([i, j, "initialValue"].toString()));
      if (luck([i, j, "initialValue"].toString()) < SPAWN_CHANCE) {
        new Cell(i, j);
      }
    }
  }
}

//#endregion
