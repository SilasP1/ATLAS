import { estimateMission } from "./core.mjs";

const STATUS = "estimate";
const SOURCE = "ATLAS browser testing tool";
const e = (value) => ({ value, status: STATUS, source: SOURCE });

const sampleProfile = {
  schema_version: 1,
  profile_id: "synthetic-vtol-fixed-wing",
  revision: 1,
  vehicle_type: "VTOL_FIXED_WING",
  cruise_speed_mps: e(18), usable_battery_wh: e(300), required_reserve_fraction: e(0.2),
  cruise_power_w: e(250), hover_power_w: e(900), loiter_power_w: e(275),
  transition_energy_wh: e(8), takeoff_time_s: e(30), landing_time_s: e(30),
  maximum_flight_time_s: e(5400), minimum_altitude_m: e(20), maximum_altitude_m: e(120),
};

const sampleMission = {
  schema_version: 1,
  mission_id: "synthetic-null-island-loop",
  revision: 1,
  home: { latitude_deg: 0, longitude_deg: 0, altitude_amsl_m: 0 },
  waypoints: [
    { latitude_deg: 0.0046, longitude_deg: 0, altitude_relative_home_m: 80, loiter_time_s: 0 },
    { latitude_deg: 0.0046, longitude_deg: 0.0052, altitude_relative_home_m: 80, loiter_time_s: 60 },
    { latitude_deg: 0, longitude_deg: 0.0052, altitude_relative_home_m: 80, loiter_time_s: 0 },
  ],
  return_to_home: true,
};

const aircraftFields = [
  ["cruise_speed_mps", "Cruise speed", "m/s"], ["usable_battery_wh", "Usable battery", "Wh"],
  ["required_reserve_fraction", "Required reserve", "fraction"], ["cruise_power_w", "Cruise power", "W"],
  ["hover_power_w", "Hover power", "W"], ["loiter_power_w", "Loiter power", "W"],
  ["transition_energy_wh", "Transition energy", "Wh"], ["takeoff_time_s", "Takeoff time", "s"],
  ["landing_time_s", "Landing time", "s"], ["maximum_flight_time_s", "Maximum duration", "s"],
  ["minimum_altitude_m", "Minimum altitude", "m RH"], ["maximum_altitude_m", "Maximum altitude", "m RH"],
];

let state = restoreState();
let currentEstimate = null;

function restoreState() {
  try {
    const saved = JSON.parse(localStorage.getItem("atlas-v0-state"));
    if (saved?.profile && saved?.mission) return saved;
  } catch (_) { /* use sample */ }
  return structuredClone({ profile: sampleProfile, mission: sampleMission });
}

function saveState() {
  localStorage.setItem("atlas-v0-state", JSON.stringify(state));
}

function input(id) { return document.getElementById(id); }
function numberValue(id) { return Number(input(id).value); }

function renderAircraftFields() {
  const root = input("aircraft-fields");
  root.replaceChildren();
  aircraftFields.forEach(([key, label, unit]) => {
    const wrapper = document.createElement("label");
    wrapper.innerHTML = `${label}<em>${unit}</em>`;
    const field = document.createElement("input");
    field.type = "number";
    field.step = key.includes("fraction") ? "0.01" : "any";
    field.dataset.aircraftKey = key;
    field.value = state.profile[key].value;
    wrapper.append(field);
    root.append(wrapper);
  });
}

function renderWaypoints() {
  const root = input("waypoint-table");
  root.replaceChildren();
  state.mission.waypoints.forEach((point, index) => {
    const row = document.createElement("div");
    row.className = "waypoint-row";
    row.innerHTML = `
      <span class="waypoint-index">${String(index + 1).padStart(2, "0")}</span>
      <label><span>LATITUDE</span><input type="number" step="0.000001" data-point="${index}" data-key="latitude_deg" value="${point.latitude_deg}"></label>
      <label><span>LONGITUDE</span><input type="number" step="0.000001" data-point="${index}" data-key="longitude_deg" value="${point.longitude_deg}"></label>
      <label><span>ALT / M RH</span><input type="number" step="1" data-point="${index}" data-key="altitude_relative_home_m" value="${point.altitude_relative_home_m}"></label>
      <label><span>HOLD / S</span><input type="number" min="0" step="1" data-point="${index}" data-key="loiter_time_s" value="${point.loiter_time_s || 0}"></label>
      <button class="remove-point" data-remove="${index}" aria-label="Remove waypoint ${index + 1}">×</button>`;
    root.append(row);
  });
}

function renderInputs() {
  input("mission-id").value = state.mission.mission_id;
  input("home-lat").value = state.mission.home.latitude_deg;
  input("home-lon").value = state.mission.home.longitude_deg;
  input("home-alt").value = state.mission.home.altitude_amsl_m;
  input("return-home").checked = state.mission.return_to_home;
  renderAircraftFields();
  renderWaypoints();
  calculate();
}

function syncFromInputs() {
  state.mission.mission_id = input("mission-id").value.trim() || "untitled-mission";
  state.mission.home.latitude_deg = numberValue("home-lat");
  state.mission.home.longitude_deg = numberValue("home-lon");
  state.mission.home.altitude_amsl_m = numberValue("home-alt");
  state.mission.return_to_home = input("return-home").checked;
  document.querySelectorAll("[data-aircraft-key]").forEach((field) => {
    state.profile[field.dataset.aircraftKey].value = Number(field.value);
  });
  document.querySelectorAll("[data-point][data-key]").forEach((field) => {
    state.mission.waypoints[Number(field.dataset.point)][field.dataset.key] = Number(field.value);
  });
  saveState();
  calculate();
}

function format(value, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : "—";
}

function calculate() {
  currentEstimate = estimateMission(state.profile, state.mission);
  const errors = currentEstimate.errors || [];
  const status = input("status-chip");
  const messagePanel = input("message-panel");
  messagePanel.replaceChildren();
  input("point-count").textContent = `${String(state.mission.waypoints.length).padStart(2, "0")} POINTS`;
  drawRoute();

  if (errors.length) {
    status.textContent = "INPUT ERROR";
    status.className = "status-chip fail";
    ["metric-distance", "metric-duration", "metric-energy", "metric-reserve", "metric-range", "metric-phases"].forEach((id) => input(id).textContent = "—");
    errors.forEach((text) => addMessage(text, "error"));
    return;
  }

  input("metric-distance").textContent = format(currentEstimate.route_distance_m / 1000, 2);
  input("metric-duration").textContent = format(currentEstimate.total_time_s / 60, 1);
  input("metric-energy").textContent = format(currentEstimate.predicted_energy_wh, 1);
  input("metric-reserve").textContent = format(currentEstimate.predicted_landing_reserve_fraction * 100, 1);
  input("metric-range").textContent = `${format(currentEstimate.maximum_distance_from_home_m / 1000, 2)} KM`;
  input("metric-phases").textContent = `${format(currentEstimate.cruise_time_s / 60, 1)} / ${format(currentEstimate.loiter_time_s / 60, 1)} / ${format(currentEstimate.fixed_vtol_time_s / 60, 1)} MIN`;
  const reservePercent = Math.max(0, Math.min(100, currentEstimate.predicted_landing_reserve_fraction * 100));
  input("reserve-bar").style.width = `${reservePercent}%`;
  input("reserve-bar").style.background = currentEstimate.feasible_by_model ? "var(--green)" : "var(--red)";

  if (currentEstimate.feasible_by_model) {
    status.textContent = "MODEL PASS";
    status.className = "status-chip pass";
    addMessage("No profile limits are violated by the current deterministic model.", "pass");
  } else {
    status.textContent = "REVIEW REQUIRED";
    status.className = "status-chip fail";
    currentEstimate.warnings.forEach((text) => addMessage(text, "error"));
  }
}

function addMessage(text, type) {
  const message = document.createElement("div");
  message.className = `message ${type}`;
  message.textContent = text;
  input("message-panel").append(message);
}

function drawRoute() {
  const svg = input("route-svg");
  svg.replaceChildren();
  if (!state.mission.waypoints.length) return;
  const points = [state.mission.home, ...state.mission.waypoints];
  if (state.mission.return_to_home) points.push(state.mission.home);
  const lats = points.map((point) => Number(point.latitude_deg));
  const lons = points.map((point) => Number(point.longitude_deg));
  const minLat = Math.min(...lats); const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons); const maxLon = Math.max(...lons);
  const spanLat = maxLat - minLat || 1; const spanLon = maxLon - minLon || 1;
  const project = (point) => ({
    x: 52 + ((Number(point.longitude_deg) - minLon) / spanLon) * 536,
    y: 252 - ((Number(point.latitude_deg) - minLat) / spanLat) * 204,
  });
  const projected = points.map(project);
  const ns = "http://www.w3.org/2000/svg";
  const path = document.createElementNS(ns, "polyline");
  path.setAttribute("points", projected.map((point) => `${point.x},${point.y}`).join(" "));
  path.setAttribute("fill", "none"); path.setAttribute("stroke", "#c49b2e"); path.setAttribute("stroke-width", "2");
  path.setAttribute("stroke-dasharray", "5 5"); svg.append(path);
  [state.mission.home, ...state.mission.waypoints].forEach((point, index) => {
    const p = project(point);
    const circle = document.createElementNS(ns, "circle");
    circle.setAttribute("cx", p.x); circle.setAttribute("cy", p.y); circle.setAttribute("r", index === 0 ? "8" : "6");
    circle.setAttribute("fill", index === 0 ? "#e8ebe5" : "#070a09"); circle.setAttribute("stroke", "#c49b2e"); circle.setAttribute("stroke-width", "2");
    svg.append(circle);
    const label = document.createElementNS(ns, "text");
    label.setAttribute("x", p.x + 12); label.setAttribute("y", p.y + 4); label.setAttribute("fill", "#8e9690");
    label.setAttribute("font-size", "10"); label.setAttribute("font-family", "monospace"); label.textContent = index === 0 ? "HOME" : `WP${String(index).padStart(2, "0")}`;
    svg.append(label);
  });
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}

async function importJson(file, target) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    state[target] = parsed;
    saveState(); renderInputs();
  } catch (_) { addMessage("The selected file is not valid ATLAS JSON.", "error"); }
}

document.addEventListener("input", (event) => {
  if (event.target.matches("input:not([type=file])")) syncFromInputs();
});
input("waypoint-table").addEventListener("click", (event) => {
  const index = event.target.dataset.remove;
  if (index === undefined) return;
  state.mission.waypoints.splice(Number(index), 1); saveState(); renderWaypoints(); calculate();
});
input("add-waypoint").addEventListener("click", () => {
  const last = state.mission.waypoints.at(-1) || { latitude_deg: state.mission.home.latitude_deg, longitude_deg: state.mission.home.longitude_deg, altitude_relative_home_m: 80 };
  state.mission.waypoints.push({ ...last, longitude_deg: Number(last.longitude_deg) + 0.001, loiter_time_s: 0 });
  saveState(); renderWaypoints(); calculate();
});
input("load-sample").addEventListener("click", () => { state = structuredClone({ profile: sampleProfile, mission: sampleMission }); saveState(); renderInputs(); });
input("import-aircraft").addEventListener("click", () => input("aircraft-file").click());
input("import-mission").addEventListener("click", () => input("mission-file").click());
input("aircraft-file").addEventListener("change", (event) => importJson(event.target.files[0], "profile"));
input("mission-file").addEventListener("change", (event) => importJson(event.target.files[0], "mission"));
input("export-estimate").addEventListener("click", () => { if (!currentEstimate?.errors?.length) downloadJson(`${state.mission.mission_id}-estimate.json`, currentEstimate); });
input("export-inputs").addEventListener("click", () => downloadJson(`${state.mission.mission_id}-inputs.json`, state));

renderInputs();
