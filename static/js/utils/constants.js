// static/js/utils/constants.js
export const HEXEL_SIZE = 24;

export const H_STEP = HEXEL_SIZE * 2;
export const V_STEP = HEXEL_SIZE * 1.73205080757;

export const SQRT3 = 1.73205080757;
export const TAU = 6.28318530718;

// GRID_COLOR as separate components for shaders
export const GRID_COLOR_R = 0.784;
export const GRID_COLOR_G = 0.576;
export const GRID_COLOR_B = 0.824;

// Or as a hex string for JavaScript
export const GRID_COLOR = '#c893d2';  // ← ADD THIS!
export const DEFAULT_POINT_COLOR = '#ffaa66';

export const GRID_LINE_WIDTH = Math.max(1, HEXEL_SIZE / 24);
export const POINT_SIZE = HEXEL_SIZE / 3;
