/**
 * App-level configuration (non-tax). A single place for storage keys and UI
 * thresholds so they aren't hard-coded across components.
 *
 * Tax rates, brackets, and the Section 102 holding period live in
 * `src/tax/constants.ts` (the tax engine's configuration).
 */

/** localStorage key for the persisted lots + profile. */
export const STORAGE_KEY = "ietc.state.v1";
/** localStorage key for the light/dark theme. */
export const THEME_KEY = "ietc.theme";

/** Days-to-qualification at/under which a lot is "approaching" (vs breach risk). */
export const APPROACHING_DAYS = 90;

/** Scenario simulator resolution (number of sample points) and date horizon. */
export const SIMULATOR_STEPS = 72;
export const SIMULATOR_HORIZON_MONTHS = 36;
