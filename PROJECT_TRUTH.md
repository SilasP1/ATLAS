# ATLAS project truth

Updated: 2026-08-16

## Operator problem

An operator needs to determine whether a planned SUBTUS mission is feasible and
how much time and energy it is likely to consume, without replacing the approved
autopilot or ground-control workflow.

## Present phase

Build and validate the deterministic mission-estimation core. Mapping, mission
export, log ingestion, and prediction-versus-actual analysis follow only after
the data contracts and unit handling pass this gate.

## Current gate

Given versioned synthetic inputs, the estimator must produce deterministic
distance, duration, energy, reserve, and warning outputs. It must reject malformed
or physically impossible inputs and preserve the evidence status of aircraft
parameters.

## Largest uncertainty

Whether a deliberately simple phase-based energy model will become accurate
enough after calibration to make conservative go/no-go planning decisions.

## Numbers

All values in `fixtures/` are synthetic and labeled `estimate`. They are neither
measured nor verified SUBTUS performance.

## Explicitly deferred

Map UI, user accounts, cloud deployment, direct MAVLink control, QGroundControl
export, ArduPilot log ingestion, weather, airspace, customer workflows, automated
route optimization, fleet scheduling, and regulatory automation.

