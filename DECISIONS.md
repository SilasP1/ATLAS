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

