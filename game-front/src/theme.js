import { createTheme } from '@mui/material/styles';

// --- Color Definitions ---
const COLOR_PRIMARY = '#9D4EDD'; // Purple (matches logo? Adjust if needed)
const COLOR_SECONDARY = '#FF69B4'; // Pink (for accents/hover)
const COLOR_GOLD = '#FFD700'; // Gold (for CTA)
const COLOR_GOLD_LIGHT = '#FFEA70'; // Lighter gold for gradient
const COLOR_BG_LIGHT = '#F3E5F5'; // Light Lavender
const COLOR_BG_DARK = '#E1BEE7';  // Darker Lavender
const COLOR_WHITE_GRAD_START = 'rgba(255,255,255,0.98)';
const COLOR_WHITE_GRAD_END = 'rgba(245,240,255,0.92)'; // Very light purple tint

// --- Font Definitions ---
const FONT_PRIMARY = '\'Fredoka One\', cursive';
const FONT_SECONDARY = '\'Nunito\', sans-serif';
const FONT_BODY = '\'Quicksand\', sans-serif';

// --- Rarity Colors ---
const RARITY_COLORS = {
  common: '#A7D8FF',    // Soft Blue
  uncommon: '#98FB98',  // Light Green
  rare: COLOR_SECONDARY, // Pink
  epic: COLOR_PRIMARY,   // Purple
  legendary: COLOR_GOLD, // Gold
};

// --- Theme Creation ---
const theme = createTheme({
  palette: {
    primary: {
      main: COLOR_PRIMARY,
    },
    secondary: {
      main: COLOR_SECONDARY,
    },
    background: {
      // Default background (can be used by Paper, etc.)
      default: COLOR_BG_LIGHT,
      paper: COLOR_WHITE_GRAD_START, // Card background starts similar to paper
    },
    // Custom colors can be added if needed elsewhere
    gold: {
        main: COLOR_GOLD,
        light: COLOR_GOLD_LIGHT,
    },
    rarity: RARITY_COLORS, // Add rarity colors to theme for potential reuse
  },
  typography: {
    fontFamily: FONT_BODY, // Default font
    h1: { fontFamily: FONT_PRIMARY },
    h2: { fontFamily: FONT_PRIMARY },
    h3: { fontFamily: FONT_PRIMARY },
    h4: { fontFamily: FONT_PRIMARY }, // Used for 'Your Pets'
    h5: { fontFamily: FONT_PRIMARY },
    h6: { fontFamily: FONT_PRIMARY },
    subtitle1: { fontFamily: FONT_SECONDARY, fontWeight: 600 },
    subtitle2: { fontFamily: FONT_SECONDARY, fontWeight: 600 },
    body1: { fontFamily: FONT_BODY },
    body2: { fontFamily: FONT_BODY }, // Overridden in PetCard for Nunito
    button: { fontFamily: FONT_SECONDARY, fontWeight: 700 },
    caption: { fontFamily: FONT_BODY },
    overline: { fontFamily: FONT_SECONDARY },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: FONT_SECONDARY,
          fontWeight: 700,
          textTransform: 'none',
          borderRadius: '9999px', // Consistent rounded corners for all buttons
          paddingTop: '12px', // Consistent padding
          paddingBottom: '12px',
          paddingLeft: '32px',
          paddingRight: '32px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)', // Base shadow
        },
      },
      // Define disabled state style globally
      variants: [
        {
            props: { disabled: true },
            style: {
                opacity: 0.6,
                // Consider adding desaturated background/color if needed
                // backgroundColor: 'grey', 
            }
        }
      ]
    },
    MuiChip: {
        styleOverrides: {
            root: {
                 // Ensure consistent corner style with buttons/cards if desired
                borderRadius: '16px',
            },
            label: { fontFamily: FONT_SECONDARY }, 
        }
    },
    MuiCard: {
        styleOverrides: {
            root: {
                borderRadius: '12px', // Consistent card radius
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', // Consistent base shadow
            }
        }
    }
  },
});

export default theme;
export { COLOR_BG_LIGHT, COLOR_BG_DARK, COLOR_WHITE_GRAD_START, COLOR_WHITE_GRAD_END, RARITY_COLORS }; // Export colors for direct use if needed 