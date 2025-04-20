import { createTheme } from '@mui/material/styles';

// Define font families
const FONT_PRIMARY = '\'Fredoka One\', cursive';
const FONT_SECONDARY = '\'Nunito\', sans-serif';
const FONT_BODY = '\'Quicksand\', sans-serif';

// Create a theme instance.
const theme = createTheme({
  typography: {
    fontFamily: FONT_BODY, // Default font
    h1: { fontFamily: FONT_PRIMARY },
    h2: { fontFamily: FONT_PRIMARY },
    h3: { fontFamily: FONT_PRIMARY },
    h4: { fontFamily: FONT_PRIMARY },
    h5: { fontFamily: FONT_PRIMARY },
    h6: { fontFamily: FONT_PRIMARY },
    subtitle1: { fontFamily: FONT_SECONDARY, fontWeight: 600 },
    subtitle2: { fontFamily: FONT_SECONDARY, fontWeight: 600 },
    body1: { fontFamily: FONT_BODY },
    body2: { fontFamily: FONT_BODY },
    button: { fontFamily: FONT_SECONDARY, fontWeight: 700 }, // Ensure buttons use Nunito Bold
    caption: { fontFamily: FONT_BODY },
    overline: { fontFamily: FONT_SECONDARY },
  },
  // Override component defaults if needed
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: FONT_SECONDARY, // Explicitly set button font family
          fontWeight: 700, // Ensure bold weight
          textTransform: 'none', // Keep consistent with our custom buttons
        },
      },
    },
    MuiChip: {
        styleOverrides: {
            label: { fontFamily: FONT_SECONDARY }, // Use Nunito for Chip labels
            // icon styling usually uses svgs, font family may not apply directly
        }
    }
    // Add overrides for other components as needed
  },
  // You can also customize colors, spacing, breakpoints etc.
  // palette: {
  //   primary: {
  //     main: '#a855f7', // Your purple
  //   },
  //   secondary: {
  //     main: '#ca8a04', // Your yellow
  //   },
  // },
});

export default theme; 