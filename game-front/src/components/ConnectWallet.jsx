import React from 'react'
import { Box, Button, Typography, CircularProgress } from '@mui/material'
// import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet' // Not used in the new style

// Define bubble styles to avoid repetition
const bubbleStyle = {
  position: 'absolute',
  borderRadius: '9999px',
  backgroundColor: '#f472b6', // pink-400
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
        sx={{
          position: 'relative',
          py: '12px',
          px: '32px',
          borderRadius: '9999px',
          bgcolor: '#a855f7',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.125rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          textTransform: 'none',
          opacity: 0.6,
          cursor: 'wait',
          '&:hover': {
            bgcolor: '#a855f7',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)'
          }
        }}
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
        sx={{
          position: 'relative',
          py: '12px',
          px: '32px',
          borderRadius: '9999px',
          bgcolor: '#a855f7',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.125rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          textTransform: 'none',
          transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
          '&:hover': {
            transform: 'scale(1.05)',
            bgcolor: '#a855f7',
            boxShadow: '0 15px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          },
          '&:active': { transform: 'scale(0.95)' },
          '&:focus': { outline: 'none' }
        }}
      >
        {/* Bubbles */}
        <Box sx={{ ...bubbleStyle, top: '-4px', left: '-4px', width: '16px', height: '16px' }} />
        <Box sx={{ ...bubbleStyle, top: '-4px', right: '-8px', width: '12px', height: '12px' }} />
        <Box sx={{ ...bubbleStyle, bottom: '-4px', right: '-4px', width: '16px', height: '16px' }} />
        
        {/* Button Text */}
        <Box component="span" sx={{ position: 'relative', zIndex: 1 }}>
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