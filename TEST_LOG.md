# ATLAS test log

## 2026-08-16 — Milestone 1 calculation kernel

- **Revision/configuration:** Working tree before first repository commit; Python
  3.12.13; synthetic aircraft profile revision 1.
- **Question:** Can versioned JSON inputs produce deterministic mission distance,
  duration, energy, reserve, and warning outputs while rejecting invalid inputs?
- **Hypothesis:** A dependency-free, phase-based estimator is sufficient to
  freeze the initial calculation interface.
- **Procedure:** Run `python -m unittest discover -s tests -v`, followed by the
  example CLI calculation documented in `README.md`.
- **Controls:** Known one-degree latitude distance; route with and without return
  to home; nominal mission; excessive loiter; excessive altitude; invalid reserve;
  empty waypoint list.
- **Result:** 7/7 tests passed. The fictional Null Island example produced a
  2,179.42 m route, 241.08 s total time, 35.99 Wh predicted energy use, and no
  warnings.
- **Evidence status:** The calculations and validation behavior are verified by
  automated tests. All aircraft performance values and the resulting mission
  performance are synthetic estimates, not measured SUBTUS results.
- **Anomalies:** None observed.
- **Decision:** `advance` to QGroundControl plan export using this contract.
- **Next experiment:** Export several mission shapes, load them into QGroundControl
  and ArduPilot SITL, and verify waypoint order, units, commands, and round-trip
  identity before building the map interface.

## 2026-08-16 — GitHub Pages testing interface

- **Revision/configuration:** Static HTML/CSS/JavaScript interface; Vite 8.2.1
  used only for development preview and production-build validation.
- **Question:** Can a polished browser interface expose the same deterministic
  ATLAS calculation without changing results or hiding model limits?
- **Hypothesis:** A dependency-free deployed application can reproduce the Python
  kernel while keeping all mission data local to the device.
- **Procedure:** Run the Python suite, browser estimator parity test, JavaScript
  syntax check, and Vite production build.
- **Controls:** Shared synthetic aircraft and fictional Null Island mission;
  known geodesic distance; nominal model pass; excessive-loiter model failure.
- **Result:** 7/7 Python tests passed; browser parity and warning tests passed;
  JavaScript syntax check passed; production build completed successfully.
- **Evidence status:** Calculation parity and static build are verified. Visual
  browser preview was unavailable because the preview browser blocked the healthy
  internal service, so live deployment inspection remains required.
- **Decision:** `advance` to GitHub Pages deployment and live interaction check.
- **Next experiment:** Verify the deployed interface on desktop and mobile, then
  implement QGroundControl `.plan` export against a known-good control mission.
