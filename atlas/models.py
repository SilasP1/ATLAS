from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Any


class EvidenceStatus(StrEnum):
    TARGET = "target"
    ESTIMATE = "estimate"
    MEASURED = "measured"
    VERIFIED = "verified"


@dataclass(frozen=True)
class EngineeringValue:
    value: float
    status: EvidenceStatus
    source: str | None = None

    @classmethod
    def from_dict(cls, data: dict[str, Any], *, name: str) -> EngineeringValue:
        try:
            value = float(data["value"])
            status = EvidenceStatus(data["status"])
        except (KeyError, TypeError, ValueError) as exc:
            raise ValueError(f"Invalid engineering value for {name}") from exc
        if value < 0:
            raise ValueError(f"{name} cannot be negative")
        source = data.get("source")
        return cls(value=value, status=status, source=source)


@dataclass(frozen=True)
class AircraftProfile:
    schema_version: int
    profile_id: str
    revision: int
    vehicle_type: str
    cruise_speed_mps: EngineeringValue
    usable_battery_wh: EngineeringValue
    required_reserve_fraction: EngineeringValue
    cruise_power_w: EngineeringValue
    hover_power_w: EngineeringValue
    loiter_power_w: EngineeringValue
    transition_energy_wh: EngineeringValue
    takeoff_time_s: EngineeringValue
    landing_time_s: EngineeringValue
    maximum_flight_time_s: EngineeringValue
    minimum_altitude_m: EngineeringValue
    maximum_altitude_m: EngineeringValue

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> AircraftProfile:
        values = {
            name: EngineeringValue.from_dict(data[name], name=name)
            for name in (
                "cruise_speed_mps",
                "usable_battery_wh",
                "required_reserve_fraction",
                "cruise_power_w",
                "hover_power_w",
                "loiter_power_w",
                "transition_energy_wh",
                "takeoff_time_s",
                "landing_time_s",
                "maximum_flight_time_s",
                "minimum_altitude_m",
                "maximum_altitude_m",
            )
        }
        if values["cruise_speed_mps"].value <= 0:
            raise ValueError("cruise_speed_mps must be greater than zero")
        if values["usable_battery_wh"].value <= 0:
            raise ValueError("usable_battery_wh must be greater than zero")
        reserve = values["required_reserve_fraction"].value
        if not 0 <= reserve < 1:
            raise ValueError("required_reserve_fraction must be in [0, 1)")
        if values["minimum_altitude_m"].value > values["maximum_altitude_m"].value:
            raise ValueError("minimum_altitude_m cannot exceed maximum_altitude_m")
        return cls(
            schema_version=int(data["schema_version"]),
            profile_id=str(data["profile_id"]),
            revision=int(data["revision"]),
            vehicle_type=str(data["vehicle_type"]),
            **values,
        )


@dataclass(frozen=True)
class GeoPoint:
    latitude_deg: float
    longitude_deg: float
    altitude_m: float
    loiter_time_s: float = 0.0

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> GeoPoint:
        point = cls(
            latitude_deg=float(data["latitude_deg"]),
            longitude_deg=float(data["longitude_deg"]),
            altitude_m=float(data["altitude_m"]),
            loiter_time_s=float(data.get("loiter_time_s", 0)),
        )
        if not -90 <= point.latitude_deg <= 90:
            raise ValueError("latitude_deg must be in [-90, 90]")
        if not -180 <= point.longitude_deg <= 180:
            raise ValueError("longitude_deg must be in [-180, 180]")
        if point.loiter_time_s < 0:
            raise ValueError("loiter_time_s cannot be negative")
        return point


@dataclass(frozen=True)
class MissionPlan:
    schema_version: int
    mission_id: str
    revision: int
    home: GeoPoint
    waypoints: tuple[GeoPoint, ...]
    return_to_home: bool = True

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> MissionPlan:
        waypoints = tuple(GeoPoint.from_dict(item) for item in data["waypoints"])
        if not waypoints:
            raise ValueError("Mission must contain at least one waypoint")
        return cls(
            schema_version=int(data["schema_version"]),
            mission_id=str(data["mission_id"]),
            revision=int(data["revision"]),
            home=GeoPoint.from_dict(data["home"]),
            waypoints=waypoints,
            return_to_home=bool(data.get("return_to_home", True)),
        )

