// ClinicPro Color Palette - Premium Emerald/Teal Theme
export const colors = {
  // Primary color: Emerald/Teal
  primary: {
    hex: '#0F766E',
    oklch: 'oklch(0.53 0.11 190)',
    rgb: 'rgb(15, 118, 110)',
  },
  
  // Secondary color: Dark Teal
  secondary: {
    hex: '#134E4A',
    oklch: 'oklch(0.35 0.08 180)',
    rgb: 'rgb(19, 78, 74)',
  },
  
  // Variations for different use cases
  primaryLight: {
    hex: '#14B8A6',
    oklch: 'oklch(0.7 0.14 175)',
  },
  
  primaryDark: {
    hex: '#0D5E58',
    oklch: 'oklch(0.45 0.1 185)',
  },
  
  secondaryLight: {
    hex: '#2DD4BF',
    oklch: 'oklch(0.8 0.15 170)',
  },
  
  secondaryDark: {
    hex: '#0A3B37',
    oklch: 'oklch(0.28 0.06 185)',
  },
} as const;

export type ColorKey = keyof typeof colors;

