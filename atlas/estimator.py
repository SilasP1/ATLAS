from __future__ import annotations

from dataclasses import asdict, dataclass

from .geometry import horizontal_distance_m, route_distance_m
from .models import AircraftProfile, MissionPlan


@dataclass(frozen=True)
class MissionEstimate:
    schema_version: int
    aircraft_profile_id: str
    aircraft_profile_revision: int
    mission_id: str
    mission_revision: int
    route_distance_m: float
    maximum_distance_from_home_m: float
    cruise_time_s: float
    loiter_time_s: float
    fixed_vtol_time_s: float
    total_time_s: float
    predicted_energy_wh: float
    predicted_landing_energy_wh: float
    predicted_landing_reserve_fraction: float
    required_reserve_fraction: float
    feasible_by_model: bool
    warnings: tuple[str, ...]

    def to_dict(self) -> dict[str, object]:
        result = asdict(self)
        result["warnings"] = list(self.warnings)
        return result


def estimate_mission(profile: AircraftProfile, mission: MissionPlan) -> MissionEstimate:
    distance_m = route_distance_m(mission.home, mission.waypoints, mission.return_to_home)
    cruise_time_s = distance_m / profile.cruise_speed_mps.value
    loiter_time_s = sum(point.loiter_time_s for point in mission.waypoints)
    fixed_vtol_time_s = profile.takeoff_time_s.value + profile.landing_time_s.value
    total_time_s = cruise_time_s + loiter_time_s + fixed_vtol_time_s

    cruise_energy_wh = profile.cruise_power_w.value * cruise_time_s / 3600
    loiter_energy_wh = profile.loiter_power_w.value * loiter_time_s / 3600
    hover_energy_wh = profile.hover_power_w.value * fixed_vtol_time_s / 3600
    predicted_energy_wh = (
        cruise_energy_wh
        + loiter_energy_wh
        + hover_energy_wh
        + profile.transition_energy_wh.value
    )
    landing_energy_wh = profile.usable_battery_wh.value - predicted_energy_wh
    landing_reserve_fraction = landing_energy_wh / profile.usable_battery_wh.value

    warnings: list[str] = []
    for index, waypoint in enumerate(mission.waypoints, start=1):
        if waypoint.altitude_m < profile.minimum_altitude_m.value:
            warnings.append(f"Waypoint {index} is below the aircraft profile minimum altitude")
        if waypoint.altitude_m > profile.maximum_altitude_m.value:
            warnings.append(f"Waypoint {index} is above the aircraft profile maximum altitude")
    if total_time_s > profile.maximum_flight_time_s.value:
        warnings.append("Predicted mission duration exceeds the aircraft profile limit")
    if landing_reserve_fraction < profile.required_reserve_fraction.value:
        warnings.append("Predicted landing reserve is below the required reserve")
    if predicted_energy_wh > profile.usable_battery_wh.value:
        warnings.append("Predicted mission energy exceeds usable battery energy")

    maximum_distance_m = max(
        horizontal_distance_m(mission.home, waypoint) for waypoint in mission.waypoints
    )
    return MissionEstimate(
        schema_version=1,
        aircraft_profile_id=profile.profile_id,
        aircraft_profile_revision=profile.revision,
        mission_id=mission.mission_id,
        mission_revision=mission.revision,
        route_distance_m=distance_m,
        maximum_distance_from_home_m=maximum_distance_m,
        cruise_time_s=cruise_time_s,
        loiter_time_s=loiter_time_s,
        fixed_vtol_time_s=fixed_vtol_time_s,
        total_time_s=total_time_s,
        predicted_energy_wh=predicted_energy_wh,
        predicted_landing_energy_wh=landing_energy_wh,
        predicted_landing_reserve_fraction=landing_reserve_fraction,
        required_reserve_fraction=profile.required_reserve_fraction.value,
        feasible_by_model=not warnings,
        warnings=tuple(warnings),
    )

