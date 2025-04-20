import React, { useState, useEffect, useCallback } from 'react'
import { Container, Box, Typography, CssBaseline, Chip, Button, CircularProgress } from '@mui/material'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { ethers } from 'ethers' // Keep main ethers for Contract, decodeBytes32String etc.
import { Web3Provider } from '@ethersproject/providers' // Import the specific provider
import { ConnectWallet } from './components/ConnectWallet'
import { OpenBoxButton } from './components/OpenBoxButton'
import { PetsPage } from './pages/PetsPage'
import { RewardModal } from './components/RewardModal' // Import RewardModal
import logo from './assets/petidotlogonobg.png'
import bgImage from './assets/petidotbg.png'
// Import ABI as a raw string
import contractAbiString from './abi.json?raw';
import { COLOR_BG_LIGHT, COLOR_BG_DARK } from './theme'; // Import specific colors if needed from theme export

// --- Contract Details --- (Replace with your actual values)
const CONTRACT_ADDRESS = '0x6f584c0ad33d447fd7d8faCc00f4D5603b582Bc2'; // <-- Replace this!
// Parse the raw string into a JavaScript object
const CONTRACT_ABI = JSON.parse(contractAbiString);
// --- -------------- --- 

function App() {
  const [account, setAccount] = useState(null)
  const [provider, setProvider] = useState(null)
  const [contract, setContract] = useState(null)
  const [isLoading, setIsLoading] = useState(false) // General loading (connect/open box)
  const [isPetsLoading, setIsPetsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pets, setPets] = useState([])
  const [selectedPetId, setSelectedPetId] = useState(null); // <-- New state for selected pet
  const [claimingPetId, setClaimingPetId] = useState(null); // ID of pet currently being claimed
  const [isStakingLoading, setIsStakingLoading] = useState(false); // <-- Add state for staking button
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false); // Control claim reward modal visibility
  const [rewardPet, setRewardPet] = useState(null); // Details of the claim reward pet for the modal
  const [isBoxOpenModalOpen, setIsBoxOpenModalOpen] = useState(false); // Control box open modal visibility
  const [boxOpenPet, setBoxOpenPet] = useState(null); // Details of the pet from opening a box
  const [editingNamePetId, setEditingNamePetId] = useState(null); // ID of pet whose name is being edited
  const [newNameInput, setNewNameInput] = useState(''); // Input field value for new name
  const [ageStakingPetId, setAgeStakingPetId] = useState(null); // ID of pet being staked for age
  const [ageUnstakingPetId, setAgeUnstakingPetId] = useState(null); // ID of pet being unstaked for age

  // Define PetTypeName map here so it's accessible by formatPetInfo
  const PetTypeName = {
       0: 'Barkley',
       1: 'Nibbles',
       2: 'Whiskoo',
       3: 'Peepin',
       4: 'Slowmi'
  };

  // --- Helper Function to Format Pet Info --- (Moved outside fetchPets)
  const formatPetInfo = (petInfo) => {
    let decodedName = '';
    try {
      decodedName = ethers.decodeBytes32String(petInfo.name).replace(/\0/g, '');
    } catch (e) {
      console.warn(`Could not decode bytes32 name for token ${petInfo.tokenId}:`, petInfo.name, e.message);
      decodedName = '';
    }
    const petTypeNumber = Number(petInfo.petType);
    const typeName = PetTypeName[petTypeNumber] || `Type ${petTypeNumber}`; // Use map defined above
    const finalName = decodedName.trim() !== '' ? decodedName : typeName;

    return {
      tokenId: Number(petInfo.tokenId),
      name: finalName,
      petType: petTypeNumber,
      rarity: Number(petInfo.rarity),
      ageStage: Number(petInfo.ageStage),
      birthTime: Number(petInfo.birthTime),
      stakedUntil: Number(petInfo.stakedUntil),
      playtimeStakedUntil: Number(petInfo.playtimeStakedUntil)
    };
  }

  // Initialize Ethers provider and signer using the confirmed method
  const initEthers = useCallback(async () => {
    console.log("Attempting to initialize Ethers...");
    if (window.ethereum) {
      try {
        console.log("Requesting accounts via window.ethereum.request...");
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts found/approved.");
        }
        console.log("Accounts obtained:", accounts);

        console.log("Creating Web3Provider..."); 
        const web3Provider = new Web3Provider(window.ethereum)
        setProvider(web3Provider) // Set provider state
        
        console.log("Requesting signer..."); 
        const signer = await web3Provider.getSigner()
        console.log("Signer obtained."); 

        console.log("Requesting signer address..."); 
        const connectedAccount = await signer.getAddress()
        console.log("Signer address obtained:", connectedAccount);
        setAccount(connectedAccount) // Set account state

        console.log("Creating contract instance..."); 
        const gameContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer) // Use signer
        setContract(gameContract) // Set contract state
        console.log("Contract instance created.");

        console.log('Ethers initialized successfully, account:', connectedAccount)
        return connectedAccount 

      } catch (err) {
        console.error('Error initializing Ethers:', err)
        setError(`Failed to connect wallet: ${err.message || 'Unknown error'}`)
        setAccount(null)
        setProvider(null)
        setContract(null) 
        return null
      }
    } else {
      setError('MetaMask (or other Web3 wallet) not detected. Please install it.')
      return null
    }
  }, []) 

  // Fetch pets using the actual contract
  const fetchPets = useCallback(async (currentAccount, gameContract) => {
    if (!currentAccount || !gameContract) {
      console.log('Account or contract not ready for fetching pets')
      setPets([])
      return
    }

    console.log('Fetching pets for account:', currentAccount)
    setIsPetsLoading(true)
    setError(null)
    try {
      const ownedPetInfos = await gameContract.getPetsByOwner(currentAccount)

      // Format the data using the helper function defined outside
      const formattedPets = ownedPetInfos.map(formatPetInfo); // Now uses the outer function

      setPets(formattedPets)
      console.log('Pets fetched:', formattedPets)
    } catch (err) {
      console.error('Failed to fetch pets:', err)
      setError('Could not load your pets. Please ensure you are on the correct network and try again.')
      setPets([])
    } finally {
      setIsPetsLoading(false)
    }
  }, []) // Removed formatPetInfo from dependencies as it's stable

  // Effect to fetch pets when contract and account are ready
  useEffect(() => {
    if (account && contract) {
      fetchPets(account, contract)
    }
    // Clear pets if account disconnects or contract becomes invalid
    if (!account || !contract) {
        setPets([]);
    }
  }, [account, contract, fetchPets])

  // Helper function to poll for transaction receipt
  const waitForTransaction = (txHash) => {
    console.log(`Waiting for transaction: ${txHash}...`);
    return new Promise(async (resolve, reject) => {
      if (!provider) {
        return reject(new Error("Provider not available to wait for transaction."));
      }
      let receipt = null;
      let attempts = 0;
      const maxAttempts = 60; // Approx 2 minutes with 2s interval
      const interval = 2000; // 2 seconds

      while (receipt === null && attempts < maxAttempts) {
        try {
          receipt = await provider.getTransactionReceipt(txHash);
          if (receipt !== null) {
            console.log("Transaction confirmed!");
            resolve(receipt);
            return;
          }
        } catch (error) {
          console.error("Error fetching receipt:", error);
          // Don't reject immediately, maybe temporary network issue
        }
        attempts++;
        await new Promise(res => setTimeout(res, interval));
      }

      if (receipt === null) {
        reject(new Error(`Transaction not confirmed after ${maxAttempts} attempts.`));
      } else {
         // Should have resolved already, but as a fallback:
         resolve(receipt);
      }
    });
  };

  // Connect Wallet Handler
  const handleConnectWallet = async () => {
    console.log("App.jsx handleConnectWallet called");
    setIsLoading(true)
    setError(null)
    setPets([]) // Clear pets during connection attempt
    try {
      console.log("Calling initEthers...");
      const connectedAccount = await initEthers() // Initialize ethers and get account
      if (!connectedAccount) {
         console.log("initEthers failed or returned no account");
      } else {
         console.log("initEthers succeeded, account:", connectedAccount);
      }
    } catch (err) {
      console.error('Connection process failed in handleConnectWallet:', err)
      setAccount(null)
      setContract(null)
      setProvider(null)
    } finally {
      console.log("handleConnectWallet finally block");
      setIsLoading(false)
    }
  }

  // Open Box Handler (needs contract)
  const handleOpenBox = async () => {
    if (!contract || !provider || !account) { // Added account check
        setError("Wallet not connected or contract not initialized.")
        console.log("handleOpenBox: Wallet/Contract/Provider not ready.")
        return
    }
    console.log('Open Box clicked')
    setIsLoading(true) // Use general isLoading for opening box
    setError(null)
    // Store current pet IDs to compare later
    const currentPetIds = new Set(pets.map(p => p.tokenId));
    try {
      const tx = await contract.openBox()
      console.log('Open box transaction sent:', tx.hash)
      const receipt = await waitForTransaction(tx.hash);
      console.log('Transaction Receipt obtained via polling:', receipt);

      if (receipt.status !== 1) {
         throw new Error(`Transaction failed: status code ${receipt.status}`);
      }
      console.log('Box opened successfully! Transaction confirmed. Refreshing pets...')
      
      // --- Workaround: Fetch all pets again and find the new one --- 
      await fetchPets(account, contract); // fetchPets updates the 'pets' state
      
      // We need to access the *updated* pets state after fetchPets completes.
      // Since fetchPets updates state asynchronously, we get the latest state
      // via a function passed to the state setter, or more reliably, by waiting
      // for the state update (though that's complex). A simpler approach here
      // is to re-fetch *specifically* for the purpose of finding the new pet,
      // assuming fetchPets is relatively quick.
      
      // Let's slightly modify fetchPets to *return* the fetched pets
      // Or, more simply for now, assume fetchPets has updated the state
      // and access it in the 'finally' block *after* setIsLoading(false) is set?
      // No, that's not reliable. Let's use the state directly after await.
      
      // This relies on the 'pets' state being updated by the time the next line runs
      // which *should* be the case after awaiting fetchPets.
      let newPet = null;
      // Access the LATEST pets state via a functional update pattern won't work here.
      // We need the state *value* after fetchPets(). Let's assume the state is updated.
      const updatedPets = await contract.getPetsByOwner(account); // Refetch manually to be sure
      const formattedUpdatedPets = updatedPets.map(formatPetInfo);

      for (const pet of formattedUpdatedPets) {
          if (!currentPetIds.has(pet.tokenId)) {
              newPet = pet;
              break;
          }
      }

      if (newPet) {
          console.log("Found new pet:", newPet);
          setBoxOpenPet(newPet); // Set the found pet for the modal
          setIsBoxOpenModalOpen(true); // Open the modal
      } else {
          console.warn("Could not identify the newly minted pet after opening the box.");
          // Optionally set an error or just don't show the modal
          setError("Opened box, but couldn't identify the new pet. Check your pets list.");
      }
      // --- End Workaround ---

    } catch (err) {
      console.error('Open Box failed:', err)
      setError(`Failed to open box: ${err.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false) // Stop general isLoading
    }
  }

  // Handler for selecting a pet
  const handleSelectPet = (tokenId) => {
    setSelectedPetId(prevId => (prevId === tokenId ? null : tokenId)); // Toggle selection
    console.log("Selected Pet ID:", selectedPetId === tokenId ? null : tokenId);
  };

  // --- Handle Staking for Playtime ---
  const handleStakeForPlaytime = async () => {
      if (!contract || !provider || !selectedPetId) {
          setError("Contract not ready or no pet selected.")
          console.log("Stake: Contract or Pet ID missing.", { contract, provider, selectedPetId });
          return
      }
      console.log(`Staking pet ${selectedPetId} for playtime...`)
      setIsStakingLoading(true) // <-- Use specific staking loading state
      setError(null)
      try {
          const tx = await contract.stakeForPlaytime(selectedPetId);
          console.log('Stake for playtime transaction sent:', tx.hash);
          const receipt = await waitForTransaction(tx.hash);
          console.log('Transaction Receipt for staking:', receipt);

          if (receipt.status !== 1) {
              throw new Error(`Staking transaction failed: status code ${receipt.status}`);
          }
          console.log('Pet staked successfully!');
          setSelectedPetId(null); // Deselect pet after successful staking
          await fetchPets(account, contract); // Refresh pets list
      } catch (err) {
          console.error('Stake for playtime failed:', err);
          setError(`Failed to stake pet: ${err.message || 'Unknown error'}`);
      } finally {
          setIsStakingLoading(false); // <-- Stop specific staking loading state
      }
  };

  // --- Handle Claiming Playtime Reward ---
  const handleClaimReward = async (tokenIdToClaim) => {
    if (!contract || !provider || !tokenIdToClaim) {
      setError("Contract not ready or no Token ID provided for claim.");
      console.log("Claim: Contract or Token ID missing.", { contract, provider, tokenIdToClaim });
      return;
    }
    console.log(`Attempting to claim reward for pet ${tokenIdToClaim}...`);
    setClaimingPetId(tokenIdToClaim); // Set loading state for this specific pet
    setError(null);
    try {
      const tx = await contract.claimPlaytimeReward(tokenIdToClaim);
      console.log('Claim reward transaction sent:', tx.hash);

      // Wait for the transaction receipt
      const receipt = await waitForTransaction(tx.hash);
      console.log('Transaction Receipt for claiming:', receipt);

      if (receipt.status !== 1) {
        throw new Error(`Claim transaction failed: status code ${receipt.status}`);
      }
      console.log('Claim successful! Now finding the reward pet...');

      // --- Find the PlaytimeRewardMinted event ---
      let rewardTokenId = null;
      const eventInterface = new ethers.Interface(CONTRACT_ABI); // Use ABI to parse logs
      for (const log of receipt.logs) {
         try {
             // Check if the log address matches the contract address
             if (log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
                const parsedLog = eventInterface.parseLog(log);
                if (parsedLog && parsedLog.name === 'PlaytimeRewardMinted') {
                    console.log('Found PlaytimeRewardMinted event:', parsedLog.args);
                    // Ensure the owner matches the current account and source matches claimed token
                    if (parsedLog.args.owner.toLowerCase() === account.toLowerCase() &&
                        Number(parsedLog.args.sourceTokenId) === tokenIdToClaim) {
                        rewardTokenId = Number(parsedLog.args.rewardTokenId);
                        console.log(`Reward Pet Token ID: ${rewardTokenId}`);
                        break; // Found the relevant event
                    }
                }
             }
         } catch (parseError) {
             // Log might not be from our contract ABI, ignore
             // console.warn("Could not parse log:", parseError);
         }
      }

      if (rewardTokenId === null || rewardTokenId === undefined) {
        throw new Error("Could not find the reward pet token ID in the transaction logs.");
      }

      // --- Fetch details of the new reward pet ---
      console.log(`Fetching details for reward pet ID: ${rewardTokenId}`);
      const rewardPetInfo = await contract.getPetDetails(rewardTokenId);
      const formattedRewardPet = formatPetInfo(rewardPetInfo); // THIS CALL WILL NOW WORK
      console.log("Reward Pet Details:", formattedRewardPet);

      // --- Show Modal & Refresh List ---
      setRewardPet(formattedRewardPet); 
      setIsRewardModalOpen(true);

      await fetchPets(account, contract);

    } catch (err) {
      console.error('Claim reward failed:', err);
      setError(`Failed to claim reward: ${err.message || 'Unknown error'}`);
    } finally {
      setClaimingPetId(null); // Clear loading state regardless of success/failure
    }
  };

  // --- Close Reward Modal ---
  const handleCloseRewardModal = () => {
    setIsRewardModalOpen(false);
    setRewardPet(null);
  };

  // --- Close Box Open Modal ---
  const handleCloseBoxOpenModal = () => {
    setIsBoxOpenModalOpen(false);
    setBoxOpenPet(null);
  };

  // --- Pet Name Editing Handlers ---
  const handleInitiateEditName = (tokenId, currentName) => {
    console.log(`Initiating name edit for token ${tokenId}, current name: ${currentName}`);
    setEditingNamePetId(tokenId);
    setNewNameInput(currentName);
    setError(null); // Clear previous errors
  };

  const handleCancelEditName = () => {
    console.log("Cancelling name edit.");
    setEditingNamePetId(null);
    setNewNameInput('');
  };

  const handleNewNameInputChange = (event) => {
    setNewNameInput(event.target.value);
  };

  const handleSavePetName = async () => {
    if (!contract || !editingNamePetId || newNameInput.trim() === '') {
        setError("Cannot save name: Missing contract, pet selection, or name input.");
        console.error("Save Name Error:", { contract, editingNamePetId, newNameInput });
        return;
    }

    // Basic validation (optional: add more robust checks)
    if (newNameInput.length > 31) { // bytes32 limit approximation
        setError("Pet name is too long (max ~31 characters).");
        return;
    }

    console.log(`Saving new name "${newNameInput}" for pet ${editingNamePetId}`);
    setIsLoading(true); // Use general loading, or add specific isSavingName state
    setError(null);
    let encodedName;
    try {
        // Encode the name to bytes32
        encodedName = ethers.encodeBytes32String(newNameInput.trim());
        console.log(`Encoded name: ${encodedName}`);

        const tx = await contract.setPetName(editingNamePetId, encodedName);
        console.log('Set name transaction sent:', tx.hash);
        const receipt = await waitForTransaction(tx.hash);
        console.log('Set name transaction confirmed:', receipt);

        if (receipt.status !== 1) {
            throw new Error(`Set name transaction failed: status code ${receipt.status}`);
        }

        console.log(`Pet ${editingNamePetId} name updated successfully!`);
        await fetchPets(account, contract); // Refresh pet list
        handleCancelEditName(); // Reset editing state on success

    } catch (err) {
        console.error('Set pet name failed:', err);
        setError(`Failed to set pet name: ${err.message || 'Unknown error'}`);
        // Don't cancel edit on error, let user try again or cancel
    } finally {
        setIsLoading(false); 
    }
  };

  // --- Age Staking Handlers ---
  const handleStakeForAge = async (tokenId) => {
    if (!contract || !tokenId) {
        setError("Cannot stake for age: Missing contract or token ID.");
        return;
    }
    console.log(`Staking pet ${tokenId} for age...`);
    setAgeStakingPetId(tokenId); // Set loading state for this pet
    setError(null);
    try {
        const tx = await contract.stake(tokenId);
        console.log('Stake for age transaction sent:', tx.hash);
        const receipt = await waitForTransaction(tx.hash);
        console.log('Stake for age transaction confirmed:', receipt);

        if (receipt.status !== 1) {
            throw new Error(`Stake for age transaction failed: status code ${receipt.status}`);
        }
        console.log(`Pet ${tokenId} staked for age successfully!`);
        await fetchPets(account, contract); // Refresh pet list

    } catch (err) {
        console.error('Stake for age failed:', err);
        setError(`Failed to stake for age: ${err.message || 'Unknown error'}`);
    } finally {
        setAgeStakingPetId(null); // Clear loading state
    }
  };

  const handleUnstakeForAge = async (tokenId) => {
    if (!contract || !tokenId) {
        setError("Cannot unstake for age: Missing contract or token ID.");
        return;
    }
    console.log(`Unstaking pet ${tokenId} for age...`);
    setAgeUnstakingPetId(tokenId); // Set loading state for this pet
    setError(null);
    try {
        const tx = await contract.unstake(tokenId);
        console.log('Unstake for age transaction sent:', tx.hash);
        const receipt = await waitForTransaction(tx.hash);
        console.log('Unstake for age transaction confirmed:', receipt);

        if (receipt.status !== 1) {
            throw new Error(`Unstake for age transaction failed: status code ${receipt.status}`);
        }
        console.log(`Pet ${tokenId} unstaked for age successfully! Age may have updated.`);
        await fetchPets(account, contract); // Refresh pet list to show new age stage

    } catch (err) {
        console.error('Unstake for age failed:', err);
        setError(`Failed to unstake for age: ${err.message || 'Unknown error'}`);
    } finally {
        setAgeUnstakingPetId(null); // Clear loading state
    }
  };

  // Find the currently selected pet object for the stake button logic
  const selectedPetObject = pets.find(p => p.tokenId === selectedPetId);
  const canStakeSelectedPet = selectedPetObject
      && selectedPetObject.stakedUntil === 0
      && selectedPetObject.playtimeStakedUntil === 0;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      // Apply lavender gradient background
      background: `linear-gradient(180deg, ${COLOR_BG_LIGHT} 0%, ${COLOR_BG_DARK} 100%)`,
      py: 4, 
      position: 'relative' // Needed for absolute positioning of children
    }}>
      <CssBaseline />

      {/* Top Right Connected Wallet Info */} 
      {account && (
        <Box sx={{ 
            position: 'absolute',
            top: 16, // Adjust spacing as needed
            right: 16, // Adjust spacing as needed
            p: '12px 16px', // Adjusted padding
            // bgcolor: 'rgba(0, 0, 0, 0.6)', // Removed black background
            background: 'rgba(56, 19, 107, 0.7)', // Semi-transparent dark purple (adjust color/opacity as needed)
            borderRadius: '12px', // Slightly more rounded
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)', // Slightly softer shadow
            color: 'white',
            backdropFilter: 'blur(5px)', // Add blur effect for frosted glass look
            WebkitBackdropFilter: 'blur(5px)', // For Safari support
            border: '1px solid rgba(255, 255, 255, 0.1)' // Subtle border
        }}>
           <Typography variant="caption" display="block" sx={{ mb: 0.5, opacity: 0.8 }}>
               Wallet Connected
        </Typography>
           <Chip 
            icon={<AccountBalanceWalletIcon fontSize='small' color='#6B157D' /* Dark Purple Icon */ />}
            label={`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
            variant="outlined"
            size="small"
            sx={{ 
                color: 'white', 
                borderColor: 'rgba(255, 255, 255, 0.5)', 
                backgroundColor: 'rgba(255, 255, 255, 0.05)', // Very subtle background for the chip itself
                height: '28px' // Adjust height if needed
            }}
          />
        </Box>
      )}

      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box 
            component="img"
            sx={{ 
                height: account ? 200 : 400, // Conditional height
                width: 'auto', 
                mb: 3,
                transition: 'height 0.3s ease-in-out' // Smooth transition
            }}
            alt="Petidot Logo"
            src={logo}
          />

          {/* Only show ConnectWallet button if account is NOT connected */} 
          {!account && (
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <ConnectWallet 
                // Pass only necessary props now
                isLoading={isLoading} 
                error={error}
                connectWallet={handleConnectWallet}
              />
              {/* Add tagline below ConnectWallet when not loading */}
              {!isLoading && (
                  <Typography variant="h6" sx={{ mt: 5, color: 'white', textAlign: 'center' }}>
                      Get Your Paws on Polkadot's Cutest Pets!
                  </Typography>
              )}
            </Box>
          )}

          {/* Show Pet actions and display only if account IS connected */} 
          {account && (
             <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Action Buttons Row */} 
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'row', // Explicitly set direction to row
                    gap: 2, 
                    mb: 3, 
                    flexWrap: 'wrap', 
                    justifyContent: 'center' 
                }}>
                    <OpenBoxButton 
                      openBox={handleOpenBox}
                      isLoading={isLoading} // Use isLoading for OpenBox
                    />
                    {/* Add Stake Button - Enabled only if a non-staked pet is selected */} 
                    <Button 
                        variant="contained"
                        color="secondary" // Use Pink for this action
                        onClick={handleStakeForPlaytime}
                        
                        // Disable if:
                        // - No pet is selected OR
                        // - Selected pet cannot be staked OR
                        // - Staking is currently in progress (isStakingLoading) OR
                        // - Box opening is in progress (isLoading) OR
                        // - Claiming is in progress (claimingPetId)
                        disabled={!selectedPetId || !canStakeSelectedPet || isStakingLoading || isLoading || !!claimingPetId}
                        sx={{ 
                            minWidth: '220px', // Match other button width
                            color: 'white' // Set text color to white
                        }}
                    >
                        {isStakingLoading ? <CircularProgress size={20} sx={{ color: 'white', mr: 1}} /> : null} {/* Show loading based on isStakingLoading */} 
                        Sent your pet to Playtime
                    </Button>
                </Box>

                {/* Pass selection handler and selected ID to PetsPage */} 
                <PetsPage 
                  pets={pets}
                  isLoading={isPetsLoading} 
                  selectedPetId={selectedPetId}
                  onSelectPet={handleSelectPet}
                  onClaimReward={handleClaimReward}
                  claimingPetId={claimingPetId}
                  error={error}
                  editingNamePetId={editingNamePetId}
                  newNameInput={newNameInput}
                  onInitiateEditName={handleInitiateEditName}
                  onCancelEditName={handleCancelEditName}
                  onNewNameChange={handleNewNameInputChange}
                  onSavePetName={handleSavePetName}
                  ageStakingPetId={ageStakingPetId}
                  ageUnstakingPetId={ageUnstakingPetId}
                  onStakeForAge={handleStakeForAge}
                  onUnstakeForAge={handleUnstakeForAge}
                />
              </Box>
          )}

        </Box>
      </Container>

      {/* Reward Modal */}
      <RewardModal
         open={isRewardModalOpen}
         onClose={handleCloseRewardModal}
         pet={rewardPet}
         title="🎉 Reward Claimed! 🎉" // Explicit title for claim
      />

      {/* Box Open Modal */}
      <RewardModal
         open={isBoxOpenModalOpen}
         onClose={handleCloseBoxOpenModal}
         pet={boxOpenPet}
         title="✨ New Pet Acquired! ✨" // Title for opening box
      />
    </Box>
  )
}

export default App 