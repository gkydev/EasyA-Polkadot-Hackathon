import React from 'react'
import { Box, Typography } from '@mui/material'
import { PetDisplay } from '../components/PetDisplay' // Adjust path as needed

export function PetsPage({ pets, isLoading }) {
  return (
    <Box sx={{ width: '100%', my: 4 }}>
      {/* Removed title from here, PetDisplay has its own title */}
      {/* <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
        Your Pets
      </Typography> */}
      <PetDisplay 
        pets={pets}
        isLoading={isLoading} 
      />
    </Box>
  )
} 