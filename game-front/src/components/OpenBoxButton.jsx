import React from 'react'
import { Button, CircularProgress, Box } from '@mui/material'
import { keyframes } from '@mui/system' // Import keyframes
import PetsIcon from '@mui/icons-material/Pets'; // Import PetsIcon
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
        variant="contained"
        onClick={openBox}
        disabled={isLoading}
        startIcon={isLoading ? <CircularProgress size={20} sx={{ color: '#6B157D' }} /> : <PetsIcon sx={{ color: '#6B157D' }}/>}
        sx={{
          minWidth: '200px',
          fontWeight: 'bold',
          fontSize: '1rem',
          borderRadius: '50px',
          padding: '10px 25px',
          color: '#6B157D',
          background: 'linear-gradient(135deg, #FFD3E2, #CFAEFF)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
            background: 'linear-gradient(135deg, #FFC8DB, #C0A0F8)',
          },
          '&:disabled': {
            background: 'linear-gradient(135deg, #E0E0E0, #D0D0D0)',
            color: '#A0A0A0',
            boxShadow: 'none',
          }
        }}
      >
        {/* Bubbles (now purple) */}
        <Box sx={{ ...bubbleStyle, top: '-4px', left: '-4px', width: '16px', height: '16px' }} />
        <Box sx={{ ...bubbleStyle, top: '-4px', right: '-8px', width: '12px', height: '12px' }} />
        <Box sx={{ ...bubbleStyle, bottom: '-4px', right: '-4px', width: '16px', height: '16px' }} />
        
        {/* Button Content Text - Use isLoading to change text */}
        {/* Loader is now handled ONLY by startIcon */} 
        <Box component="span" sx={{ position: 'relative', zIndex: 1 }}>
           {isLoading ? 'Opening Box...' : 'Open a New Pet Box!'}
        </Box>
      </Button>
    </Box>
  )
} 