# ATLAS repository rules

- Preserve the boundary between planning software and flight-critical control.
- ATLAS V0 must not arm, command, or directly upload to an aircraft.
- Store all internal calculations in SI units.
- Every aircraft performance number must carry an evidence label: `target`,
  `estimate`, `measured`, or `verified`.
- Preserve raw failures and incomplete test runs; never curate only successes.
- Never commit real flight logs, customer/site coordinates, secrets, or real
  aircraft calibration profiles to the public repository.
- Keep calculation code independent of the future web interface.
- Run `python -m unittest discover -s tests -v` before handoff.

