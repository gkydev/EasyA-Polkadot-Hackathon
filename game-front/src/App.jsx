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
            p: 1.5,
            bgcolor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent background
            borderRadius: '8px',
            boxShadow: 3,
            color: 'white'
        }}>
           <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
               Wallet Connected
           </Typography>
           <Chip 
            icon={<AccountBalanceWalletIcon fontSize='small' sx={{ color: 'white'}}/>}
            label={`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
            variant="outlined"
            size="small"
            sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)' }}
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
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mb: 3 }}>
              <ConnectWallet 
                // Pass only necessary props now
                isLoading={isLoading} 
                error={error}
                connectWallet={handleConnectWallet}
              />
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
                        Stake Selected Pet for Playtime
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