import React from 'react'
import { Box, Grid, Card, CardContent, CardMedia, Typography, Skeleton } from '@mui/material'

// --- Enum Mappings --- 
const Rarity = {
  0: 'Common',
  1: 'Uncommon',
  2: 'Rare',
  3: 'Legendary'
};

const AgeStage = {
  0: 'Baby',
  1: 'Teen',
  2: 'Adult'
};

const PetType = {
  0: 'Barkley',
  1: 'Nibbles',
  2: 'Whiskoo',
  3: 'Peepin',
  4: 'Slowmi'
  // Add more if NUM_PET_TYPES increases in contract
};
// ---------------------

// --- Dynamic Image Imports --- 
// Note: Vite handles these dynamic imports efficiently.
// Ensure filenames match the keys (lowercase) derived from PetType enum.
const petImageSources = {
  barkley: () => import('../assets/pets/barkley.png'),
  nibbles: () => import('../assets/pets/nibbles.png'),
  whiskoo: () => import('../assets/pets/whiskoo.png'),
  peepin: () => import('../assets/pets/peepin.png'),
  slowmi: () => import('../assets/pets/slowmi.png'),
};

// Helper to get the image source based on pet type
const getPetImageSrc = (petType) => {
  const typeName = (PetType[petType] || 'unknown').toLowerCase();
  const importFn = petImageSources[typeName];
  // Return the promise that resolves to the module with the default export (image src)
  // We'll handle the promise resolution within the PetCard component
  return importFn ? importFn() : Promise.resolve({ default: 'https://via.placeholder.com/200/CCCCCC/FFFFFF?text=Unknown' }); // Fallback
};
// -------------------------

// Single Pet Card Component
function PetCard({ pet, isLoading }) {
  const [imageSrc, setImageSrc] = React.useState(null); // State to hold resolved image URL

  // Effect to load the image source when pet data is available
  React.useEffect(() => {
    if (pet && !isLoading) {
      getPetImageSrc(pet.petType)
        .then(module => {
          setImageSrc(module.default); // Set the resolved image URL
        })
        .catch(err => {
          console.error("Error loading pet image:", err);
          // Optionally set a fallback image source on error
          setImageSrc('https://via.placeholder.com/200/FF0000/FFFFFF?text=Error');
        });
    } else {
      setImageSrc(null); // Reset if loading or no pet data
    }
  }, [pet, isLoading]);

  if (isLoading || !imageSrc) { // Show skeleton if loading data OR loading image
    return (
      <Card sx={{ maxWidth: 345, m: 1 }}>
        <Skeleton variant="rectangular" width='100%' height={140} />
        <CardContent>
          <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
          <Skeleton variant="text" sx={{ fontSize: '0.8rem' }} />
          <Skeleton variant="text" sx={{ fontSize: '0.8rem' }} />
        </CardContent>
      </Card>
    )
  }

  // Safely access potentially undefined enum values
  const rarityStr = Rarity[pet.rarity] || 'Unknown';
  const ageStageStr = AgeStage[pet.ageStage] || 'Unknown';
  const typeName = PetType[pet.petType] || 'Unknown Type';
  const petName = pet.name && pet.name !== '' ? pet.name : typeName; 

  return (
    <Card sx={{ maxWidth: 345, m: 1, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.03)' } }}>
      <CardMedia
        component="img"
        height="140"
        image={imageSrc} // Use the resolved image source from state
        alt={`${typeName} Pet NFT ${pet.tokenId}`}
        sx={{ objectFit: 'contain' }} // Use 'contain' or 'cover' based on preference
      />
      <CardContent>
        <Typography gutterBottom variant="h6" component="div" noWrap title={petName}> 
          {petName} (#{pet.tokenId})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Type: {typeName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Rarity: {rarityStr}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Age: {ageStageStr}
        </Typography>
        {/* Optionally display stake status */}
        {pet.stakedUntil > 0 && (
            <Typography variant="caption" color="info.main" display="block" sx={{mt: 1}}>
                Staked (Age) until: {new Date(pet.stakedUntil * 1000).toLocaleDateString()}
            </Typography>
        )}
        {pet.playtimeStakedUntil > 0 && (
            <Typography variant="caption" color="warning.main" display="block" sx={{mt: 1}}>
                Staked (Play) until: {new Date(pet.playtimeStakedUntil * 1000).toLocaleDateString()}
            </Typography>
        )}
      </CardContent>
    </Card>
  )
}

// Main Pet Display Component (remains the same)
export function PetDisplay({ pets, isLoading }) {
  const displayPets = isLoading ? Array.from(new Array(3)) : pets 

  if (!isLoading && pets.length === 0) {
    return (
      <Box sx={{ width: '100%', textAlign: 'center', my: 4, p: 2, bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2 }}>
        <Typography variant="h6" color="white">
          You don't own any pets yet. Open a box to get started!
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', my: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
        Your Pets
      </Typography>
      <Grid container spacing={2} justifyContent="center">
        {displayPets.map((pet, index) => (
          <Grid item key={isLoading ? index : pet.tokenId} xs={12} sm={6} md={4} lg={3}>
            <PetCard pet={pet} isLoading={isLoading} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
} 