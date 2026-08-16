# ATLAS decision log

## 2026-08-16 — Build the calculation kernel before the map

- **Decision:** Freeze JSON aircraft/mission contracts and a deterministic,
  phase-based estimator before building a graphical route editor.
- **Alternatives:** Begin with a Leaflet/MapLibre interface; begin with direct
  MAVLink integration; begin with QGroundControl export.
- **Evidence:** Every later interface needs the same validated mission and
  aircraft data, while a map would make unit and reserve errors harder to see.
- **Tradeoff:** The first milestone is useful through a CLI rather than visually.
- **Reversal condition:** If QGroundControl mission commands require information
  the current mission contract cannot represent, revise the contract before
  building the UI.

## 2026-08-16 — Keep ATLAS out of the flight-control loop

- **Decision:** V0 produces planning artifacts and warnings but does not arm,
  command, or directly upload to an aircraft.
- **Evidence:** ArduPilot and QGroundControl already own flight-critical setup,
  checks, mission upload, and execution.
- **Tradeoff:** The operator manually reviews and uploads every early mission.
- **Reversal condition:** Consider a controlled integration only after the
  offline mission round-trip gate passes and a separate safety review is defined.

## 2026-08-16 — Publish a static, device-local testing interface

- **Decision:** Serve the ATLAS V0 estimator through GitHub Pages with no backend,
  accounts, map provider, or external data transmission.
- **Evidence:** The current estimator is deterministic and can run fully in the
  browser. A static interface makes assumptions and warnings testable without
  expanding ATLAS into a flight-control or customer-data system.
- **Tradeoff:** State remains on one device and the route view is a schematic,
  not a navigation map.
- **Reversal condition:** Add persistence or map services only when a specific
  deployment experiment requires them and privacy/security requirements exist.

## 2026-08-16 — Make altitude references explicit before export

- **Decision:** Separate home altitude AMSL from waypoint altitude relative to
  home in both Python and browser schemas.
- **Evidence:** The former generic `altitude_m` field could not safely express a
  QGroundControl/MAVLink altitude frame.
- **Tradeoff:** This intentionally breaks compatibility with the first synthetic
  fixture rather than preserving an ambiguous interface.
- **Reversal condition:** Introduce additional altitude frames only with explicit
  conversion, validation, and mission-export tests.
