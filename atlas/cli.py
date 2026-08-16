from __future__ import annotations

import argparse
import json
from pathlib import Path

from .estimator import estimate_mission
from .models import AircraftProfile, MissionPlan


def _load_json(path: Path) -> dict[str, object]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main() -> None:
    parser = argparse.ArgumentParser(prog="atlas")
    subparsers = parser.add_subparsers(dest="command", required=True)
    estimate = subparsers.add_parser("estimate", help="Estimate a mission from JSON inputs")
    estimate.add_argument("aircraft", type=Path)
    estimate.add_argument("mission", type=Path)
    args = parser.parse_args()

    profile = AircraftProfile.from_dict(_load_json(args.aircraft))
    mission = MissionPlan.from_dict(_load_json(args.mission))
    result = estimate_mission(profile, mission)
    print(json.dumps(result.to_dict(), indent=2, sort_keys=True))


if __name__ == "__main__":
    main()

