import React, { useState, useEffect, useCallback } from 'react'
import { Container, Box, Typography, CssBaseline, Chip } from '@mui/material'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import { ethers } from 'ethers' // Keep main ethers for Contract, decodeBytes32String etc.
import { Web3Provider } from '@ethersproject/providers' // Import the specific provider
import { ConnectWallet } from './components/ConnectWallet'
import { OpenBoxButton } from './components/OpenBoxButton'
import { PetsPage } from './pages/PetsPage'
import logo from './assets/petidotlogonobg.png'
import bgImage from './assets/petidotbg.png'
// Import ABI as a raw string
import contractAbiString from './abi.json?raw';

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
      
      // Format the data, handling bytes32 name decoding safely
      const formattedPets = ownedPetInfos.map(pet => {
        let decodedName = '';
        try {
          // Attempt to decode the name
          decodedName = ethers.decodeBytes32String(pet.name).replace(/\0/g, ''); // Remove null terminators
        } catch (e) {
          // If decoding fails, log a warning and prepare to use default
          console.warn(`Could not decode bytes32 name for token ${pet.tokenId}:`, pet.name, e.message);
          decodedName = '' // Ensure it's empty to trigger default logic
        }

        // Use the decoded name only if it's not empty after trimming nulls
        // Otherwise, fall back to the PetType name from the enum mapping (we'll add the mapping here too)
        const PetTypeName = {
            0: 'Barkley',
            1: 'Nibbles',
            2: 'Whiskoo',
            3: 'Peepin',
            4: 'Slowmi'
        };
        const petTypeNumber = Number(pet.petType);
        const typeName = PetTypeName[petTypeNumber] || `Type ${petTypeNumber}`;
        const finalName = decodedName.trim() !== '' ? decodedName : typeName;

        return {
          tokenId: Number(pet.tokenId),
          name: finalName, // Use the safely determined name
          petType: petTypeNumber,
          rarity: Number(pet.rarity), 
          ageStage: Number(pet.ageStage),
          birthTime: Number(pet.birthTime),
          stakedUntil: Number(pet.stakedUntil),
          playtimeStakedUntil: Number(pet.playtimeStakedUntil)
        }
      })

      setPets(formattedPets)
      console.log('Pets fetched:', formattedPets)
    } catch (err) {
      console.error('Failed to fetch pets:', err)
      setError('Could not load your pets. Please ensure you are on the correct network and try again.')
      setPets([]) 
    } finally {
      setIsPetsLoading(false)
    }
  }, []) 

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
    if (!contract || !provider) { 
        setError("Contract or Provider not initialized. Please connect wallet first.") 
        console.log("handleOpenBox: Contract or Provider not ready.")
        return
    }
    console.log('Open Box clicked')
    setIsLoading(true)
    setError(null)
    try {
      const tx = await contract.openBox() 
      console.log('Open box transaction sent:', tx.hash)
      const receipt = await waitForTransaction(tx.hash);
      console.log('Transaction Receipt obtained via polling:', receipt); 

      if (receipt.status !== 1) { 
         throw new Error(`Transaction failed: status code ${receipt.status}`);
      }
      console.log('Box opened successfully! Transaction confirmed.')
      fetchPets(account, contract)
    } catch (err) {
      console.error('Open Box failed:', err)
      setError(`Failed to open box: ${err.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
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
                <OpenBoxButton 
                  openBox={handleOpenBox}
                  isLoading={isLoading} 
                />
                <PetsPage 
                  pets={pets}
                  isLoading={isPetsLoading} 
                />
            </Box>
          )}

        </Box>
      </Container>
    </Box>
  )
}

export default App 