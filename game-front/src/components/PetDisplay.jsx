import React, { useState, useEffect } from 'react'
import { Box, Grid, Card, CardContent, CardMedia, Typography, Skeleton, Button, CircularProgress } from '@mui/material'
// Import colors for direct use in sx prop if needed
import { RARITY_COLORS, COLOR_WHITE_GRAD_START, COLOR_WHITE_GRAD_END } from '../theme' 
import { calculateRemainingTime } from '../utils/formatTime' // Import the helper

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
function PetCard({ pet, isLoading, isSelected, onSelect, onClaimReward, isClaiming }) {
  const [imageSrc, setImageSrc] = useState(null); // State to hold resolved image URL
  const [remainingPlaytime, setRemainingPlaytime] = useState({ seconds: 0, formatted: ''});

  // Effect to load the image source when pet data is available
  useEffect(() => {
    if (pet && !isLoading) {
      setImageSrc(null); // Reset image while loading new one
      getPetImageSrc(pet.petType)
        .then(module => {
          setImageSrc(module.default);
        })
        .catch(err => {
          console.error("Error loading pet image:", err);
          setImageSrc('https://via.placeholder.com/200/FF0000/FFFFFF?text=Error');
        });
    } else if (isLoading) { // Explicitly reset on loading state change
        setImageSrc(null);
    }
  }, [pet, isLoading]);

  // Effect for calculating remaining playtime and updating it every second
  useEffect(() => {
      let intervalId = null; // Declare intervalId outside updateTimer

      const updateTimer = () => {
          if (!pet) return; // Guard clause if pet becomes null
          const time = calculateRemainingTime(pet.playtimeStakedUntil);
          setRemainingPlaytime(time);

          // We check for <= 0 *after* setting state, 
          // and clear the interval outside this function if needed.
      };

      if (pet && pet.playtimeStakedUntil > 0 && !isLoading) {
          updateTimer(); // Initial calculation
          intervalId = setInterval(() => {
              // Recalculate time inside interval
              const currentTime = calculateRemainingTime(pet.playtimeStakedUntil);
              setRemainingPlaytime(currentTime);
              // Check if time has run out inside the interval callback
              if (currentTime.seconds <= 0 && intervalId) {
                  console.log(`Timer finished for pet ${pet.tokenId}, clearing interval.`);
                  clearInterval(intervalId); 
                  intervalId = null; // Prevent trying to clear again
              }
          }, 1000); // Update every second

          // Cleanup interval on component unmount or when pet data changes
          return () => {
              if (intervalId) {
                  console.log(`Cleaning up timer interval for pet ${pet.tokenId}.`);
                  clearInterval(intervalId);
              }
          };
      } else {
          // Reset if not staked or loading
          setRemainingPlaytime({ seconds: 0, formatted: '' });
          // Ensure any lingering interval is cleared if dependencies change
          return () => {
             if (intervalId) clearInterval(intervalId);
          }
      }
  }, [pet, isLoading]); // Dependencies remain the same

  // Determine rarity color
  const rarityName = (Rarity[pet?.rarity] || 'common').toLowerCase();
  const rarityColor = RARITY_COLORS[rarityName] || RARITY_COLORS.common;

  // Determine if pet is currently staked for playtime and time is left
  const isPlaytimeStaked = remainingPlaytime.seconds > 0;
  // Determine if staked for age (used for the small badge)
  const isAgeStaked = pet?.stakedUntil > 0;

  // Determine if the timer has finished
  const isTimerFinished = pet?.playtimeStakedUntil > 0 && remainingPlaytime.seconds <= 0;

  // Define card style here for reuse
  const cardSx = {
    maxWidth: 345, 
    m: 1, 
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out', // Added border-color transition
    height: '100%', // Ensure cards in the same row have same height
    display: 'flex', // Allow content to take full height
    flexDirection: 'column', // Stack media and content vertically
    // Apply gradient background using imported colors
    background: `linear-gradient(145deg, ${COLOR_WHITE_GRAD_START} 0%, ${COLOR_WHITE_GRAD_END} 100%)`, 
    border: `3px solid ${isSelected ? '#FFFFFF' : rarityColor}`, // White border if selected, else rarity color
    cursor: isLoading ? 'default' : 'pointer', // Pointer cursor only if not loading
    position: 'relative', // For potential overlay/checkmark
    // Apply stronger shadow if selected
    boxShadow: isSelected 
        ? `0 0 20px 5px ${rarityColor}, 0 8px 25px rgba(0, 0, 0, 0.2)` 
        : '0 4px 12px rgba(0, 0, 0, 0.1)', 
    '&:hover': {
        transform: isLoading ? 'none' : 'scale(1.03)', 
        // Keep selection style on hover if selected, otherwise apply hover glow
        boxShadow: isSelected 
            ? `0 0 20px 5px ${rarityColor}, 0 8px 25px rgba(0, 0, 0, 0.2)` 
            : `0 0 15px 3px ${rarityColor}, 0 6px 18px rgba(0, 0, 0, 0.15)`,
        borderColor: isSelected ? '#FFFFFF' : rarityColor, 
    }
  };

  if (isLoading || (!imageSrc && pet)) {
    // Skeleton card: Apply base styles but maybe a neutral border
    const skeletonCardSx = {
        ...cardSx,
        cursor: 'default',
        borderWidth: '3px', // Match selected border width
        borderColor: 'rgba(0, 0, 0, 0.1)', 
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', // Use base shadow
        '&:hover': { 
            transform: 'none',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            borderColor: 'rgba(0, 0, 0, 0.1)',
        }
    }
    return (
      <Card sx={skeletonCardSx}> 
        <Skeleton variant="rectangular" sx={{ height: 140, flexShrink: 0 }} /> {/* Fixed height for skeleton image area */}
        <CardContent sx={{ flexGrow: 1 }}> {/* Allow content to grow */}
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

  // Define styles for card info text
  const infoTextStyle = {
      fontFamily: 'Nunito, sans-serif', // Use Nunito for card info
      color: 'text.primary', // Increase contrast (darker grey/black)
      // mb: 0.5 // Optional: add some margin between lines
  };

  return (
    <Card sx={cardSx} onClick={isLoading || isPlaytimeStaked || isTimerFinished ? undefined : onSelect}> {/* Disable select click if playtime staked/finished */}
      {/* Age Staked Badge */} 
      {isAgeStaked && !isPlaytimeStaked && !isTimerFinished && (
          <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', px: 1, py: 0.5, borderRadius: '4px', fontSize: '0.7rem', zIndex: 2 }}>
              Staked (Age)
          </Box>
      )}

      {/* Playtime Staked Overlay */} 
      {(isPlaytimeStaked || isTimerFinished) && (
          <Box sx={{
              position: 'absolute', 
              top: 0, left: 0, right: 0, bottom: 0, // Cover the card
              bgcolor: 'rgba(0, 0, 0, 0.6)', // Darker overlay
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 1,
              textAlign: 'center',
              zIndex: 1 // Below age badge if both present
          }}>
              {isPlaytimeStaked && (
                  <>
                      <Typography variant="button" sx={{ mb: 0.5 }}>Staked for Playtime</Typography>
                      <Typography variant="h6">{remainingPlaytime.formatted}</Typography>
                      <Typography variant="caption">remaining</Typography>
                  </>
              )}
              {isTimerFinished && (
                  <>
                      <Typography variant="button" sx={{ mb: 1 }}>Ready to Claim!</Typography>
                      <Button 
                          variant="contained"
                          color="success" // Use a distinct color for claim
                          size="small"
                          disabled={isClaiming} // Disable if claim is in progress
                          onClick={(e) => {
                              e.stopPropagation(); // Prevent card selection click
                              onClaimReward(); 
                          }}
                          sx={{ mt: 1}}
                      >
                          {isClaiming ? <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} /> : null}
                           Claim Reward
                      </Button>
                  </>
              )}
          </Box>
      )}

      <CardMedia
        component="img"
        sx={{ 
            height: 140, // Fixed height for image area
            objectFit: 'contain', 
            flexShrink: 0,
            // Dim image slightly if playtime overlay is active
            opacity: (isPlaytimeStaked || isTimerFinished) ? 0.2 : 1, 
            transition: 'opacity 0.3s'
        }} 
        image={imageSrc} 
        alt={`${typeName} Pet NFT ${pet.tokenId}`}
      />
      <CardContent sx={{ flexGrow: 1, pointerEvents: (isPlaytimeStaked || isTimerFinished) ? 'none' : 'auto' /* Prevent text selection under overlay */ }}> {/* Allow content to grow */}
        <Typography gutterBottom variant="h6" component="div" noWrap title={petName}> 
          {petName} (#{pet.tokenId})
        </Typography>
        <Typography variant="body2" sx={infoTextStyle}>
          Type: {typeName}
        </Typography>
        <Typography variant="body2" sx={infoTextStyle}>
          Rarity: {rarityStr}
        </Typography>
        <Typography variant="body2" sx={infoTextStyle}>
          Age: {ageStageStr}
        </Typography>
        {/* Only show detailed stake times if not showing playtime overlay */}
        {!isPlaytimeStaked && !isTimerFinished && isAgeStaked && (
            <Typography variant="caption" color="info.main" display="block" sx={{mt: 1}}>
                Staked (Age) until: {new Date(pet.stakedUntil * 1000).toLocaleDateString()}
            </Typography>
        )}
      </CardContent>
    </Card>
  )
}

// Main Pet Display Component
export function PetDisplay({ pets, isLoading, selectedPetId, onSelectPet, onClaimReward, claimingPetId }) {
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
      <Typography 
        variant="h4"
        component="h2" 
        gutterBottom 
        align="center" 
        sx={{ 
            color: 'white', 
            textShadow: '1px 1px 3px rgba(0,0,0,0.6)' 
        }}
      >
        Your Pets
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        {displayPets.map((pet, index) => {
            const petTokenId = isLoading ? `skeleton-${index}` : pet.tokenId;
            const isClaimingThisPet = !isLoading && claimingPetId === pet.tokenId;
            return (
                <Grid item key={petTokenId} xs={12} sm={6} md={4} lg={3}>
                    <PetCard 
                        pet={pet} 
                        isLoading={isLoading} 
                        isSelected={!isLoading && pet?.tokenId === selectedPetId}
                        onSelect={() => onSelectPet(pet?.tokenId)}
                        onClaimReward={() => onClaimReward(pet?.tokenId)}
                        isClaiming={isClaimingThisPet}
                    />
                </Grid>
            )
        })}
      </Grid>
    </Box>
  )
} 