import React, { useState, useEffect } from 'react';
import {
    Modal,
    Box,
    Typography,
    Card,
    CardContent,
    CardMedia,
    IconButton,
    Skeleton,
    Fade, // For smooth transition
    Backdrop // For modal background
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { RARITY_COLORS, COLOR_WHITE_GRAD_START, COLOR_WHITE_GRAD_END } from '../theme'; 

// --- Reusable Enum Mappings (Consider moving these to a shared utils/constants file) ---
const Rarity = { 0: 'Common', 1: 'Uncommon', 2: 'Rare', 3: 'Legendary' };
const AgeStage = { 0: 'Baby', 1: 'Teen', 2: 'Adult' };
const PetType = { 0: 'Barkley', 1: 'Nibbles', 2: 'Whiskoo', 3: 'Peepin', 4: 'Slowmi' };

// --- Reusable Image Loading (Consider moving to utils) ---
const petImageSources = {
  barkley: () => import('../assets/pets/barkley.png'),
  nibbles: () => import('../assets/pets/nibbles.png'),
  whiskoo: () => import('../assets/pets/whiskoo.png'),
  peepin: () => import('../assets/pets/peepin.png'),
  slowmi: () => import('../assets/pets/slowmi.png'),
};
const getPetImageSrc = (petType) => {
  const typeName = (PetType[petType] || 'unknown').toLowerCase();
  const importFn = petImageSources[typeName];
  return importFn ? importFn() : Promise.resolve({ default: 'https://via.placeholder.com/200/CCCCCC/FFFFFF?text=Unknown' });
};
// ----------------------------------------------------------------------------------------

// Style for the modal content box
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 400,
  bgcolor: 'background.paper', 
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  outline: 'none',
  background: `linear-gradient(145deg, ${COLOR_WHITE_GRAD_START} 0%, ${COLOR_WHITE_GRAD_END} 100%)`, // Use gradient
};

export function RewardModal({ open, onClose, pet, title }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  // Load image when pet data changes
  useEffect(() => {
    if (pet) {
      setImageLoading(true);
      getPetImageSrc(pet.petType)
        .then(module => setImageSrc(module.default))
        .catch(err => {
          console.error("Error loading reward pet image:", err);
          setImageSrc('https://via.placeholder.com/200/FF0000/FFFFFF?text=Error');
        })
        .finally(() => setImageLoading(false));
    } else {
      setImageSrc(null); // Clear image if no pet (modal closed or loading)
    }
  }, [pet]);

  if (!pet) {
    return null; // Don't render anything if no pet data
  }

  // Safely access pet details
  const rarityStr = Rarity[pet.rarity] || 'Unknown';
  const ageStageStr = AgeStage[pet.ageStage] || 'Unknown';
  const typeName = PetType[pet.petType] || 'Unknown Type';
  const petName = pet.name && pet.name !== '' ? pet.name : typeName;
  const rarityColor = RARITY_COLORS[(rarityStr || 'common').toLowerCase()] || RARITY_COLORS.common;

  const infoTextStyle = {
      fontFamily: 'Nunito, sans-serif', 
      color: 'text.primary',
      mb: 0.5
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
      aria-labelledby="reward-modal-title"
      aria-describedby="reward-modal-description"
    >
      <Fade in={open}>
        <Box sx={style}>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography id="reward-modal-title" variant="h5" component="h2" align="center" gutterBottom sx={{ color: '#6a1b9a', fontWeight: 'bold' }}>
            {title || 'Reward Acquired! 🎉'}
          </Typography>
          <Typography id="reward-modal-description" sx={{ mt: 1, mb: 3 }} align="center">
            {title && title.includes('New Pet') ? 'You received a new pet:' : 'You received this reward:'}
          </Typography>

          <Card sx={{ 
              maxWidth: 300, 
              m: 'auto', 
              border: `3px solid ${rarityColor}`,
              boxShadow: `0 0 15px 2px ${rarityColor}, 0 4px 10px rgba(0, 0, 0, 0.1)`,
              background: 'rgba(255, 255, 255, 0.9)' // Slightly transparent card background
           }}>
            {imageLoading || !imageSrc ? (
                <Skeleton variant="rectangular" sx={{ height: 140 }} />
            ) : (
                <CardMedia
                    component="img"
                    sx={{ height: 140, objectFit: 'contain' }} 
                    image={imageSrc} 
                    alt={`${typeName} Pet NFT ${pet.tokenId}`}
                />
            )}
            <CardContent>
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
            </CardContent>
          </Card>
        </Box>
      </Fade>
    </Modal>
  );
} 