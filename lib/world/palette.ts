/**
 * Scene palette: natural, city-builder realism — concrete, glass, asphalt,
 * terracotta, tropical greens, a deep South China Sea. The UI has its own
 * tokens in `components/world/world.css`.
 */
export const palette = {
  ocean: '#2c6f8c',
  turquoise: '#2f8a92',
  deepSea: '#174a66',
  grass: '#6c8a4a',
  grassLight: '#7f9c55',
  forest: '#3d5c34',
  forestDark: '#2f4a2a',
  sunlight: '#fff1d6',
  wood: '#8a6446',
  woodDark: '#5e4331',
  sand: '#dccaa1',
  sandWet: '#b9a47c',
  warmWhite: '#f2eee6',
  stone: '#a8a397',
  road: '#4b4e53',
  roadEdge: '#3d4044',
  asphalt: '#46494e',
  sidewalk: '#b8b2a6',
  limestone: '#bfb9ac',
  limestoneShade: '#a49d8f',
  gold: '#e3a72b',
  goldGlow: '#ffae1a',
  heart: '#e85d75',
  lantern: '#ffc977',
  window: '#ffd98a',
  pagodaRed: '#a8432f',
  /** Flat concrete roofs dominate; terracotta on older houses. */
  roofs: ['#9e998f', '#a9a49a', '#8f8a80', '#b2ada3', '#a5553a', '#b0603d', '#96988f'],
  /** Mid- and high-rise walls: concrete, render, stone. */
  walls: ['#d9d4c8', '#cfc8b9', '#e4ded2', '#c4bdae', '#d8cfbd', '#bfc3c4', '#e0d9c9'],
  /** Tube-house facades: Da Nang's painted street fronts, sun-faded. */
  facades: ['#e6d6a3', '#e9c8ae', '#c7d8c5', '#dfc0a6', '#ece3cc', '#c9d7dc', '#e8cf93', '#d9b8b8'],
  cars: ['#e9e9e6', '#bfc2c4', '#2b2e33', '#8e1f1f', '#2a4f86', '#d7d3c8', '#5b6066', '#c2a052'],
  bikes: ['#b8261f', '#1f3f7a', '#2b2b2b', '#d9d9d6', '#3f6f3f', '#c99b2e'],
  sky: { top: '#5b8fc7', horizon: '#c9d9e3', bottom: '#9fb4bf' },
  fog: '#b8cad8',
} as const
