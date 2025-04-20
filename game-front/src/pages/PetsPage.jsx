import React from 'react'
import { Box, Typography, Button, CircularProgress } from '@mui/material'
import { PetDisplay } from '../components/PetDisplay' // Adjust path as needed

// Updated props to include staking and claiming related props
export function PetsPage({
  pets,
  isLoading,
  selectedPetId,
  onSelectPet,
  onClaimReward,
  claimingPetId,
  error // Keep for error display
}) {
  return (
    <Box sx={{ width: '100%', my: 0 }}> {/* Reduced top margin slightly */} 
      {/* Removed title from here, PetDisplay has its own title */}
      {/* <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
        Your Pets
      </Typography> */}

      {/* --- Error Display within PetsPage --- */}
      {error && selectedPetId && ( // Show errors related to staking/claiming only when a pet is selected perhaps
        <Typography color="error" align="center" sx={{ mb: 2, backgroundColor: 'rgba(255,0,0,0.1)', p:1, borderRadius: 1 }}>
          {error}
        </Typography>
      )}

      {/* --- Pet Display Grid --- */}
      <PetDisplay 
        pets={pets}
        isLoading={isLoading} 
        selectedPetId={selectedPetId} 
        onSelectPet={onSelectPet} 
        onClaimReward={onClaimReward} // Pass down claim handler
        claimingPetId={claimingPetId} // Pass down claiming ID
      />
    </Box>
  )
} 