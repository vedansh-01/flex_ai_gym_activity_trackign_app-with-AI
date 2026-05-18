export const theme = {
  colors: {
    // Backgrounds
    background: '#0E0E0E',
    surface: '#1A1A1A',
    surfaceLight: '#27272A',
    
    // Brand
    primary: '#FF5722',
    primarySoft: '#FF572220', // For badges or disabled states
    
    // Text
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textTertiary: '#52525B',
    
    // Status
    success: '#10B981',
    successDark: '#047857',
    error: '#EF4444',
    errorDark: '#B91C1C',
    warning: '#F59E0B',
    info: '#60A5FA',
    
    // Borders
    border: '#1F1F1F',
    borderLight: '#27272A',
  },
  typography: {
    fontFamily: {
      regular: 'System', // React Native default font is system font
      bold: 'System',
    },
    sizes: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 24,
      xxxl: 32,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
      black: '900' as const,
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    layout: 16, // Standard horizontal padding for layout
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    pill: 9999,
  }
};

// Common shadows or elevations
export const elevation = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  }
};
