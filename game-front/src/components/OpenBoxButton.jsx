import React from 'react'
import { Button, CircularProgress, Box } from '@mui/material'
// import AddBoxIcon from '@mui/icons-material/AddBox' // Not used in the new style

// Define bubble styles (same as ConnectWallet)
const bubbleStyle = {
  position: 'absolute',
  borderRadius: '9999px',
  backgroundColor: '#f472b6', // pink-400
  opacity: 0.7,
}

export function OpenBoxButton({ openBox, isLoading }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', my: 2 }}>
      <Button
        variant="contained" // Keep variant for base styles
        onClick={openBox}
        disabled={isLoading}
        sx={{
          position: 'relative',
          py: '12px', // py-3
          px: '32px', // px-8
          borderRadius: '9999px', // rounded-full
          bgcolor: isLoading ? '#a16207' : '#ca8a04', // yellow-700 when loading, yellow-600 otherwise
          color: 'white', // text-white
          fontWeight: 'bold', // font-bold
          fontSize: '1.125rem', // text-lg
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)', // shadow-lg
          textTransform: 'none', // Prevent MUI default uppercase
          opacity: isLoading ? 0.6 : 1, // Dim when loading
          cursor: isLoading ? 'wait' : 'pointer',
          transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out, background-color 0.15s ease-in-out', // transition-transform
          '&:hover': {
            transform: isLoading ? 'none' : 'scale(1.05)', // hover:scale-105 (only when not loading)
            bgcolor: isLoading ? '#a16207' : '#ca8a04', // Keep color on hover
            boxShadow: isLoading 
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)' 
              : '0 15px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', // Slightly enhance shadow on hover (only when not loading)
          },
          '&:active': {
            transform: isLoading ? 'none' : 'scale(0.95)', // active:scale-95 (only when not loading)
          },
          '&:focus': {
            outline: 'none', // focus:outline-none
          }
        }}
      >
        {/* Bubbles */}
        <Box sx={{ ...bubbleStyle, top: '-4px', left: '-4px', width: '16px', height: '16px' }} />
        <Box sx={{ ...bubbleStyle, top: '-4px', right: '-8px', width: '12px', height: '12px' }} />
        <Box sx={{ ...bubbleStyle, bottom: '-4px', right: '-4px', width: '16px', height: '16px' }} />
        
        {/* Button Content (Text or Loader) */}
        {isLoading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <CircularProgress size={20} sx={{ color: 'white', mr: 1}} />
            Opening Box...
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