import React from 'react'
import { Button, CircularProgress, Box } from '@mui/material'
import { keyframes } from '@mui/system' // Import keyframes
// import AddBoxIcon from '@mui/icons-material/AddBox' // Not used in the new style

// Define bubble styles 
const bubbleStyle = {
  position: 'absolute',
  borderRadius: '9999px',
  backgroundColor: '#9D4EDD', // Use theme primary purple for bubbles
  opacity: 0.7,
}

// Define pulse animation keyframes (slightly adjust shadow for contrast)
const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); }
  50% { transform: scale(1.02); box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.15), 0 5px 8px -4px rgba(0, 0, 0, 0.15); }
  100% { transform: scale(1); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1); }
`;

export function OpenBoxButton({ openBox, isLoading }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', my: 2 }}>
      <Button
        variant="contained" // Use contained variant for background
        onClick={openBox}
        disabled={isLoading}
        // Use theme object directly for consistency (requires passing theme or using useContext/useTheme)
        // For simplicity here, we manually use colors defined in theme.js
        // Ensure base styles (padding, radius, shadow) are inherited from theme overrides for MuiButton
        sx={theme => ({ // Access theme for palette colors
          position: 'relative',
          fontSize: '1.125rem', 
          color: 'black', // Text color for gold button
          // Apply gold gradient background
          background: isLoading 
            ? theme.palette.grey[400] // Use a grey background when disabled/loading
            : `linear-gradient(145deg, ${theme.palette.gold.light} 0%, ${theme.palette.gold.main} 100%)`,
          // Override default shadow from MuiButton if needed, ensure it's present
          boxShadow: theme.shadows[4], // Example: use theme shadow level
          opacity: isLoading ? 0.6 : 1, 
          cursor: isLoading ? 'wait' : 'pointer',
          transition: theme.transitions.create(['transform', 'box-shadow', 'background'], { // Use theme transitions
             duration: theme.transitions.duration.short,
          }), 
          animation: isLoading ? 'none' : `${pulse} 2.5s infinite ease-in-out`,
          '&:hover': {
            background: isLoading 
                ? theme.palette.grey[400] 
                : `linear-gradient(145deg, ${theme.palette.gold.main} 0%, ${theme.palette.gold.light} 100%)`, // Flip gradient on hover
            transform: isLoading ? 'none' : 'scale(1.05)', 
            boxShadow: isLoading ? theme.shadows[4] : theme.shadows[8], // Increase shadow on hover
          },
          '&:active': {
            transform: isLoading ? 'none' : 'scale(0.95)', 
          },
          '&:focus': {
            outline: 'none', 
          }
          // Base padding, border-radius etc. should come from theme MuiButton overrides
        })}
      >
        {/* Bubbles (now purple) */}
        <Box sx={{ ...bubbleStyle, top: '-4px', left: '-4px', width: '16px', height: '16px' }} />
        <Box sx={{ ...bubbleStyle, top: '-4px', right: '-8px', width: '12px', height: '12px' }} />
        <Box sx={{ ...bubbleStyle, bottom: '-4px', right: '-4px', width: '16px', height: '16px' }} />
        
        {/* Button Content (Text or Loader) */}
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <CircularProgress size={20} sx={{ color: 'black' }} /> {/* Loader color for gold button */}
            <Box component="span" sx={{ ml: 1 }}>Opening Box...</Box>
          </Box>
        ) : (
          <Box component="span" sx={{ position: 'relative', zIndex: 1 }}>
            🎁 Open a New Pet Box!
          </Box>
        )}
      </Button>
    </Box>
  )
} 