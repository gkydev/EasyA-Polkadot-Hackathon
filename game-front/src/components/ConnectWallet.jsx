import React from 'react'
import { Box, Button, Typography, CircularProgress } from '@mui/material'
// import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet' // Not used in the new style

// Define bubble styles to avoid repetition
const bubbleStyle = {
  position: 'absolute',
  borderRadius: '9999px',
  backgroundColor: '#9D4EDD', // Use theme primary purple for bubbles
  opacity: 0.7,
}

// This component now ONLY shows the button to initiate connection or its loading/error state.
// The connected state is displayed in App.jsx.
export function ConnectWallet({ isLoading, error, connectWallet }) {

  const handleButtonClick = () => {
    console.log("ConnectWallet component button clicked");
    connectWallet();
  }

  // Loading state
  if (isLoading) {
    return (
      <Button 
        variant="contained"
        disabled={true}
        // Inherits base styles from theme, only specify changes for loading
        sx={theme => ({ 
          bgcolor: theme.palette.primary.dark, // Darker purple when loading/disabled
          cursor: 'wait',
          opacity: 0.6, // Use theme's disabled variant opacity if preferred
          // Prevent hover effects when loading
          '&:hover': { 
             bgcolor: theme.palette.primary.dark, 
             boxShadow: theme.shadows[4] // Keep base shadow 
          } 
        })}
      >
        <CircularProgress size={20} sx={{ color: 'white', mr: 1}} />
        Connecting...
      </Button>
    )
  }

  // Default state: Connect Wallet button
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
      <Button 
        variant="contained"
        onClick={handleButtonClick}
        // Inherits base styles from theme, only specify unique color and interactions
        sx={theme => ({ 
          position: 'relative', // Needed for bubbles
          bgcolor: theme.palette.primary.main, // Purple from theme
          transition: theme.transitions.create(['transform', 'box-shadow', 'background-color']), 
          '&:hover': { 
            transform: 'scale(1.05)', 
            bgcolor: theme.palette.primary.light, // Slightly lighter purple on hover
            boxShadow: theme.shadows[8], // Enhance shadow
          },
          '&:active': { 
            transform: 'scale(0.95)' 
          },
          '&:focus': { 
            outline: 'none' 
          }
        })}
      >
        {/* Bubbles */}
        <Box sx={{ ...bubbleStyle, top: '-4px', left: '-4px', width: '16px', height: '16px' }} />
        <Box sx={{ ...bubbleStyle, top: '-4px', right: '-8px', width: '12px', height: '12px' }} />
        <Box sx={{ ...bubbleStyle, bottom: '-4px', right: '-4px', width: '16px', height: '16px' }} />
        
        {/* Button Text */}
        <Box component="span" sx={{ position: 'relative', zIndex: 1, color: 'white' }}>
          Connect Wallet
        </Box>
      </Button>
      {/* Display error below the button if it occurs during connection attempt */}
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 1.5, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.8)', px:1, borderRadius: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  )
} 