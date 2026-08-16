# ATLAS

ATLAS is Underseer Technologies' mission-planning and flight-evidence layer for
SUBTUS aircraft. This public V0 proves a narrow loop: describe an aircraft and a
mission, calculate a conservative estimate, and later compare that estimate with
an ArduPilot flight log.

## Current milestone

Milestone 1 is the deterministic calculation kernel. It accepts versioned JSON
aircraft and mission records and produces:

- route distance and maximum distance from home;
- predicted duration and energy use;
- predicted landing reserve;
- explicit safety-review warnings.

It does **not** command, arm, or upload missions to an aircraft. Results are
planning aids and require review in the ground-control station.

## Run the example

```bash
python -m atlas.cli estimate \
  fixtures/synthetic_aircraft.json \
  fixtures/example_mission.json
```

## Run tests

```bash
python -m unittest discover -s tests -v
```

## Data policy

Only synthetic fixtures belong in this public repository. Real flight logs,
site coordinates, aircraft calibration data, credentials, and customer data must
never be committed.

## Copyright

Copyright (c) 2026 Underseer Technologies LLC. All rights reserved. Source is
publicly viewable for development demonstration and evaluation. No license is
granted to use, modify, distribute, or create derivative works.

