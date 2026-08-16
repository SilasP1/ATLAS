# ATLAS project truth

Updated: 2026-08-16

## Operator problem

An operator needs to determine whether a planned SUBTUS mission is feasible and
how much time and energy it is likely to consume, without replacing the approved
autopilot or ground-control workflow.

## Present phase

Expose the validated deterministic mission-estimation core through a static,
device-local browser testing interface, while preparing the next QGroundControl
mission-export gate.

## Current gate

The Python and browser estimators must remain numerically equivalent for the
same versioned inputs. The interface must expose assumptions, altitude semantics,
warnings, and evidence status without presenting estimates as flight authority.

## Largest uncertainty

Whether a deliberately simple phase-based energy model will become accurate
enough after calibration to make conservative go/no-go planning decisions.

## Numbers

All values in `fixtures/` are synthetic and labeled `estimate`. They are neither
measured nor verified SUBTUS performance.

## Explicitly deferred

Navigation-map tiles, user accounts, server-side storage, direct MAVLink control,
ArduPilot log ingestion, weather, airspace, customer workflows, automated route
optimization, fleet scheduling, and regulatory automation. QGroundControl export
is the next bounded integration milestone.
