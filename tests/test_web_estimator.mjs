import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { estimateMission, horizontalDistanceM } from "../docs/core.mjs";

const profile = JSON.parse(await readFile(new URL("../fixtures/synthetic_aircraft.json", import.meta.url)));
const mission = JSON.parse(await readFile(new URL("../fixtures/example_mission.json", import.meta.url)));
const estimate = estimateMission(profile, mission);

assert.equal(estimate.errors.length, 0);
assert.equal(estimate.feasible_by_model, true);
assert.ok(Math.abs(estimate.route_distance_m - 2179.4235707137454) < 1e-9);
assert.ok(Math.abs(estimate.predicted_energy_wh - 35.991603282074635) < 1e-9);
assert.ok(Math.abs(horizontalDistanceM({ latitude_deg: 0, longitude_deg: 0 }, { latitude_deg: 1, longitude_deg: 0 }) - 111195.0802335329) < 1e-6);

const unsafeMission = structuredClone(mission);
unsafeMission.waypoints[1].loiter_time_s = 7200;
const unsafe = estimateMission(profile, unsafeMission);
assert.equal(unsafe.feasible_by_model, false);
assert.ok(unsafe.warnings.includes("Predicted landing reserve is below the required reserve"));

console.log("Web estimator parity and warning tests passed.");

