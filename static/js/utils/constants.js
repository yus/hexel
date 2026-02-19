export const HEXEL_SIZE = 24;
export const H_STEP = HEXEL_SIZE * 2;
export const V_STEP = HEXEL_SIZE * Math.sqrt(3);

export const GRID_COLOR = '#b388ff';
export const DEFAULT_COLOR = '#ffaa66';

export const ZOOM_CONFIG = [
    { max: 0.5, horiz: { alpha: 0.15, width: 0.3 }, diag: { alpha: 0.1, width: 0.2 } },
    { max: 1.0, horiz: { alpha: 0.15, width: 0.3 }, diag: { alpha: 0.1, width: 0.3 } },
    { max: Infinity, horiz: { alpha: 0.15, width: (s) => 0.5 / s }, diag: { alpha: 0.1, width: (s) => 0.5 / s } }
];
