from __future__ import annotations

import json
import unittest
from pathlib import Path

from atlas.estimator import estimate_mission
from atlas.geometry import horizontal_distance_m
from atlas.models import AircraftProfile, GeoPoint, MissionPlan

ROOT = Path(__file__).resolve().parents[1]


def load_fixture(name: str) -> dict[str, object]:
    with (ROOT / "fixtures" / name).open("r", encoding="utf-8") as handle:
        return json.load(handle)


class GeometryTests(unittest.TestCase):
    def test_one_degree_latitude_is_about_111_2_km(self) -> None:
        start = GeoPoint(0, 0, 0)
        end = GeoPoint(1, 0, 0)
        self.assertAlmostEqual(horizontal_distance_m(start, end), 111_195, delta=50)


class EstimatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.profile = AircraftProfile.from_dict(load_fixture("synthetic_aircraft.json"))
        self.mission = MissionPlan.from_dict(load_fixture("example_mission.json"))

    def test_estimate_is_deterministic_and_feasible(self) -> None:
        first = estimate_mission(self.profile, self.mission)
        second = estimate_mission(self.profile, self.mission)
        self.assertEqual(first, second)
        self.assertTrue(first.feasible_by_model)
        self.assertEqual(first.loiter_time_s, 60)
        self.assertGreater(first.predicted_landing_reserve_fraction, 0.20)

    def test_route_includes_return_to_home(self) -> None:
        with_return = estimate_mission(self.profile, self.mission)
        no_return_data = load_fixture("example_mission.json")
        no_return_data["return_to_home"] = False
        without_return = estimate_mission(
            self.profile, MissionPlan.from_dict(no_return_data)
        )
        self.assertGreater(with_return.route_distance_m, without_return.route_distance_m)

    def test_low_reserve_generates_warning(self) -> None:
        data = load_fixture("example_mission.json")
        data["waypoints"][1]["loiter_time_s"] = 7200
        estimate = estimate_mission(self.profile, MissionPlan.from_dict(data))
        self.assertFalse(estimate.feasible_by_model)
        self.assertIn(
            "Predicted landing reserve is below the required reserve", estimate.warnings
        )

    def test_altitude_violation_generates_warning(self) -> None:
        data = load_fixture("example_mission.json")
        data["waypoints"][0]["altitude_m"] = 200
        estimate = estimate_mission(self.profile, MissionPlan.from_dict(data))
        self.assertIn(
            "Waypoint 1 is above the aircraft profile maximum altitude",
            estimate.warnings,
        )

    def test_invalid_reserve_is_rejected(self) -> None:
        data = load_fixture("synthetic_aircraft.json")
        data["required_reserve_fraction"]["value"] = 1.2
        with self.assertRaisesRegex(ValueError, "required_reserve_fraction"):
            AircraftProfile.from_dict(data)

    def test_empty_mission_is_rejected(self) -> None:
        data = load_fixture("example_mission.json")
        data["waypoints"] = []
        with self.assertRaisesRegex(ValueError, "at least one waypoint"):
            MissionPlan.from_dict(data)


if __name__ == "__main__":
    unittest.main()

