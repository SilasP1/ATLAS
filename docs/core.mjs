export const EARTH_RADIUS_M = 6371008.8;

export function horizontalDistanceM(start, end) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const lat1 = radians(start.latitude_deg);
  const lat2 = radians(end.latitude_deg);
  const deltaLat = lat2 - lat1;
  const deltaLon = radians(end.longitude_deg - start.longitude_deg);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

function numeric(engineeringValue) {
  return Number(engineeringValue.value);
}

export function validateInputs(profile, mission) {
  const errors = [];
  const positive = [
    "cruise_speed_mps", "usable_battery_wh", "cruise_power_w",
    "hover_power_w", "loiter_power_w", "maximum_flight_time_s",
  ];
  positive.forEach((key) => {
    if (!Number.isFinite(numeric(profile[key])) || numeric(profile[key]) <= 0) {
      errors.push(`${key} must be greater than zero`);
    }
  });
  const reserve = numeric(profile.required_reserve_fraction);
  if (!Number.isFinite(reserve) || reserve < 0 || reserve >= 1) {
    errors.push("required_reserve_fraction must be between 0 and 1");
  }
  if (!mission.waypoints?.length) errors.push("Mission requires at least one waypoint");
  [mission.home, ...(mission.waypoints || [])].forEach((point, index) => {
    const name = index === 0 ? "Home" : `Waypoint ${index}`;
    if (!Number.isFinite(Number(point.latitude_deg)) || Number(point.latitude_deg) < -90 || Number(point.latitude_deg) > 90) {
      errors.push(`${name} latitude must be between -90 and 90`);
    }
    if (!Number.isFinite(Number(point.longitude_deg)) || Number(point.longitude_deg) < -180 || Number(point.longitude_deg) > 180) {
      errors.push(`${name} longitude must be between -180 and 180`);
    }
  });
  return errors;
}

export function estimateMission(profile, mission) {
  const errors = validateInputs(profile, mission);
  if (errors.length) return { errors };

  const route = [mission.home, ...mission.waypoints];
  let routeDistanceM = 0;
  for (let index = 0; index < route.length - 1; index += 1) {
    routeDistanceM += horizontalDistanceM(route[index], route[index + 1]);
  }
  if (mission.return_to_home) {
    routeDistanceM += horizontalDistanceM(mission.waypoints.at(-1), mission.home);
  }

  const cruiseTimeS = routeDistanceM / numeric(profile.cruise_speed_mps);
  const loiterTimeS = mission.waypoints.reduce((sum, point) => sum + Number(point.loiter_time_s || 0), 0);
  const fixedVtolTimeS = numeric(profile.takeoff_time_s) + numeric(profile.landing_time_s);
  const totalTimeS = cruiseTimeS + loiterTimeS + fixedVtolTimeS;
  const predictedEnergyWh = (
    numeric(profile.cruise_power_w) * cruiseTimeS / 3600
    + numeric(profile.loiter_power_w) * loiterTimeS / 3600
    + numeric(profile.hover_power_w) * fixedVtolTimeS / 3600
    + numeric(profile.transition_energy_wh)
  );
  const landingEnergyWh = numeric(profile.usable_battery_wh) - predictedEnergyWh;
  const landingReserveFraction = landingEnergyWh / numeric(profile.usable_battery_wh);
  const warnings = [];

  mission.waypoints.forEach((point, index) => {
    if (Number(point.altitude_relative_home_m) < numeric(profile.minimum_altitude_m)) {
      warnings.push(`Waypoint ${index + 1} is below the aircraft profile minimum altitude`);
    }
    if (Number(point.altitude_relative_home_m) > numeric(profile.maximum_altitude_m)) {
      warnings.push(`Waypoint ${index + 1} is above the aircraft profile maximum altitude`);
    }
  });
  if (totalTimeS > numeric(profile.maximum_flight_time_s)) {
    warnings.push("Predicted mission duration exceeds the aircraft profile limit");
  }
  if (landingReserveFraction < numeric(profile.required_reserve_fraction)) {
    warnings.push("Predicted landing reserve is below the required reserve");
  }
  if (predictedEnergyWh > numeric(profile.usable_battery_wh)) {
    warnings.push("Predicted mission energy exceeds usable battery energy");
  }

  return {
    schema_version: 1,
    aircraft_profile_id: profile.profile_id,
    aircraft_profile_revision: profile.revision,
    mission_id: mission.mission_id,
    mission_revision: mission.revision,
    route_distance_m: routeDistanceM,
    maximum_distance_from_home_m: Math.max(...mission.waypoints.map((point) => horizontalDistanceM(mission.home, point))),
    cruise_time_s: cruiseTimeS,
    loiter_time_s: loiterTimeS,
    fixed_vtol_time_s: fixedVtolTimeS,
    total_time_s: totalTimeS,
    predicted_energy_wh: predictedEnergyWh,
    predicted_landing_energy_wh: landingEnergyWh,
    predicted_landing_reserve_fraction: landingReserveFraction,
    required_reserve_fraction: numeric(profile.required_reserve_fraction),
    feasible_by_model: warnings.length === 0,
    warnings,
    errors: [],
  };
}

