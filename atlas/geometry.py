from __future__ import annotations

from math import asin, cos, radians, sin, sqrt

from .models import GeoPoint

EARTH_RADIUS_M = 6_371_008.8


def horizontal_distance_m(start: GeoPoint, end: GeoPoint) -> float:
    """Return great-circle horizontal distance using the haversine formula."""
    lat1 = radians(start.latitude_deg)
    lat2 = radians(end.latitude_deg)
    delta_lat = lat2 - lat1
    delta_lon = radians(end.longitude_deg - start.longitude_deg)
    a = sin(delta_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(delta_lon / 2) ** 2
    return 2 * EARTH_RADIUS_M * asin(sqrt(a))


def route_distance_m(home: GeoPoint, waypoints: tuple[GeoPoint, ...], return_to_home: bool) -> float:
    points = (home, *waypoints)
    distance = sum(horizontal_distance_m(a, b) for a, b in zip(points, points[1:]))
    if return_to_home:
        distance += horizontal_distance_m(waypoints[-1], home)
    return distance

