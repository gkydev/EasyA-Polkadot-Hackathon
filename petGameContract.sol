// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract PetGameContract is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    enum Rarity { Common, Uncommon, Rare, Legendary }
    enum AgeStage { Baby, Teen, Adult }

    struct Pet {
        Rarity rarity;
        AgeStage ageStage;
        uint256 birthTime;
        uint8 petType;
        bytes32 name;
    }

    // Struct to return detailed pet info including tokenId
    struct PetInfo {
        uint256 tokenId;
        bytes32 name;
        uint8 petType;
        Rarity rarity;
        AgeStage ageStage;
        uint256 birthTime;
        uint256 stakedUntil;
        uint256 playtimeStakedUntil;
    }

    // Mapping from token ID to Pet details
    mapping(uint256 => Pet) private _pets;

    // Mapping from token ID to the timestamp when staking ends
    mapping(uint256 => uint256) private _stakedUntil;

    // Mapping from token ID to the timestamp when playtime staking ends
    mapping(uint256 => uint256) private _playtimeStakedUntil;

    // Available pet type names - REMOVED to save space
    // string[] private _petTypeNames = ["Barkley", "Nibbles", "Whiskoo", "Peepin", "Slowmi"];
    uint8 private constant NUM_PET_TYPES = 5; // Store the count

    // Constants
    uint256 private constant STAKING_DURATION = 30 days; // For age progression
    uint256 private playtimeStakingDuration; // For playtime reward (adjustable by owner)

    // Events
    event Staked(uint256 indexed tokenId, address indexed owner, uint256 stakedUntilTimestamp); // Age stake
    event Unstaked(uint256 indexed tokenId, address indexed owner);
    event PetAgeStageUpdated(uint256 indexed tokenId, AgeStage newStage);
    event PetNameChanged(uint256 indexed tokenId, bytes32 newName);
    event StakedForPlaytime(uint256 indexed tokenId, address indexed owner, uint256 stakedUntilTimestamp);
    event UnstakedFromPlaytime(uint256 indexed tokenId, address indexed owner);
    event PlaytimeRewardMinted(uint256 indexed rewardTokenId, address indexed owner, uint256 indexed sourceTokenId);
    event PlaytimeDurationChanged(uint256 newDuration);

    constructor()
        ERC721("PetiDot", "Peti")
        Ownable(msg.sender)
    {
        playtimeStakingDuration = 7 days; // Initialize playtime duration
    }

    // Function to open a box and mint a new pet NFT
    function openBox() public {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);

        bytes32 randomHash = keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender, tokenId));

        // Determine initial rarity randomly
        Rarity initialRarity;
        uint256 rarityRand = uint256(randomHash) % 100;
        if (rarityRand < 50) { initialRarity = Rarity.Common; }
        else if (rarityRand < 80) { initialRarity = Rarity.Uncommon; }
        else if (rarityRand < 95) { initialRarity = Rarity.Rare; }
        else { initialRarity = Rarity.Legendary; }

        // Determine initial PetType randomly
        // uint256 typeIndex = uint256(randomHash) % _petTypeNames.length;
        // string memory initialPetType = _petTypeNames[typeIndex];
        uint8 initialPetType = uint8(uint256(randomHash) % NUM_PET_TYPES); // Use uint8 ID

        _pets[tokenId] = Pet({
            rarity: initialRarity,
            ageStage: AgeStage.Baby,
            birthTime: block.timestamp,
            petType: initialPetType, // Use uint8 ID
            name: bytes32(uint256(initialPetType)) // Default name is bytes32 representation of type ID
        });
    }

    // Function to get pet details
    // Returns a struct to avoid stack too deep error
    function getPetDetails(uint256 tokenId) public view returns (PetInfo memory) {
        require(_ownerOf(tokenId) != address(0), "GetPetDetails: Token does not exist");
        Pet storage pet = _pets[tokenId];
        uint256 stakedUntilTimestamp = _stakedUntil[tokenId];
        uint256 playtimeStakedUntilTimestamp = _playtimeStakedUntil[tokenId];

        return PetInfo({
            tokenId: tokenId,
            name: pet.name,
            petType: pet.petType,
            rarity: pet.rarity,
            ageStage: pet.ageStage,
            birthTime: pet.birthTime,
            stakedUntil: stakedUntilTimestamp,
            playtimeStakedUntil: playtimeStakedUntilTimestamp
        });
    }

    // Function to set a new name for a pet
    function setPetName(uint256 tokenId, bytes32 newName) public {
        require(ownerOf(tokenId) == msg.sender, "SetPetName: Not owner");
        require(_stakedUntil[tokenId] == 0, "SetPetName: Pet is staked for age");
        require(_playtimeStakedUntil[tokenId] == 0, "SetPetName: Pet is staked for playtime");
        // require(bytes(newName).length > 0, "SetPetName: Name cannot be empty"); // Use bytes32 check
        require(newName != bytes32(0), "SetPetName: Name cannot be empty");

        _pets[tokenId].name = newName;
        emit PetNameChanged(tokenId, newName); // Emit bytes32
    }

    // --- Staking Logic (Age Progression) ---

    function stake(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Stake: Not owner");
        require(_stakedUntil[tokenId] == 0, "Stake: Pet is already staked for age");
        require(_playtimeStakedUntil[tokenId] == 0, "Stake: Pet is staked for playtime");
        require(_pets[tokenId].ageStage != AgeStage.Adult, "Stake: Pet is already Adult");

        uint256 stakedUntilTimestamp = block.timestamp + STAKING_DURATION;
        _stakedUntil[tokenId] = stakedUntilTimestamp;

        emit Staked(tokenId, msg.sender, stakedUntilTimestamp);
    }

    function unstake(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Unstake: Not owner");
        uint256 stakedUntilTimestamp = _stakedUntil[tokenId];
        require(stakedUntilTimestamp > 0, "Unstake: Pet is not staked");
        require(block.timestamp >= stakedUntilTimestamp, "Unstake: Staking period not yet complete");

        _promoteAgeStage(tokenId);

        _stakedUntil[tokenId] = 0;

        emit Unstaked(tokenId, msg.sender);
    }

    // Function to check if a pet is currently staked and until when
    function getStakeStatus(uint256 tokenId) public view returns (uint256 stakedUntilTimestamp) {
        require(_ownerOf(tokenId) != address(0), "GetStakeStatus: Token does not exist");
        return _stakedUntil[tokenId];
    }

    // --- Staking Logic (Playtime Reward) ---

    function stakeForPlaytime(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "PlaytimeStake: Not owner");
        require(_stakedUntil[tokenId] == 0, "PlaytimeStake: Pet is staked for age progression");
        require(_playtimeStakedUntil[tokenId] == 0, "PlaytimeStake: Pet is already staked for playtime");

        uint256 playtimeStakedUntilTimestamp = block.timestamp + playtimeStakingDuration; // Use variable
        _playtimeStakedUntil[tokenId] = playtimeStakedUntilTimestamp;

        emit StakedForPlaytime(tokenId, msg.sender, playtimeStakedUntilTimestamp);
    }

    function claimPlaytimeReward(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "PlaytimeClaim: Not owner");
        uint256 playtimeStakedUntilTimestamp = _playtimeStakedUntil[tokenId];
        require(playtimeStakedUntilTimestamp > 0, "PlaytimeClaim: Pet is not staked for playtime");
        require(block.timestamp >= playtimeStakedUntilTimestamp, "PlaytimeClaim: Playtime staking period not yet complete");

        // Reset playtime stake *before* minting reward (re-entrancy)
        _playtimeStakedUntil[tokenId] = 0;
        emit UnstakedFromPlaytime(tokenId, msg.sender);

        // --- Determine Reward --- //
        Pet storage sourcePet = _pets[tokenId];
        // Placeholder Reward Logic: Rarity based on source rarity/age, type random
        Rarity rewardRarity;
        uint8 sourceRarityLevel = uint8(sourcePet.rarity);
        uint8 sourceAgeLevel = uint8(sourcePet.ageStage); // Baby=0, Teen=1, Adult=2

        // Simple logic: Higher rarity/age -> better base for reward
        // Example: Reduce rarity by 1, but Teen adds +1, Adult adds +2. Max Legendary.
        int8 calculatedLevel = int8(sourceRarityLevel) - 1 + int8(sourceAgeLevel);
        if (calculatedLevel < 0) calculatedLevel = 0; // Min Common
        if (calculatedLevel > 3) calculatedLevel = 3; // Max Legendary
        rewardRarity = Rarity(uint8(calculatedLevel));

        bytes32 randomHash = keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender, tokenId, "reward")); // Add salt
        // uint256 typeIndex = uint256(randomHash) % _petTypeNames.length;
        // string memory rewardPetType = _petTypeNames[typeIndex];
        // string memory rewardName = rewardPetType; // Default name is type
        uint8 rewardPetType = uint8(uint256(randomHash) % NUM_PET_TYPES); // Use uint8 ID
        bytes32 rewardName = bytes32(uint256(rewardPetType)); // Default name is bytes32 representation of type ID

        // --- Mint Reward NFT --- //
        uint256 rewardTokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, rewardTokenId);

        _pets[rewardTokenId] = Pet({
            rarity: rewardRarity,
            ageStage: AgeStage.Baby, // Rewards always start as Baby
            birthTime: block.timestamp,
            petType: rewardPetType, // Use uint8 ID
            name: rewardName // Use bytes32 name
        });

        emit PlaytimeRewardMinted(rewardTokenId, msg.sender, tokenId);
    }

    // Function to check playtime stake status
    function getPlaytimeStakeStatus(uint256 tokenId) public view returns (uint256 playtimeStakedUntilTimestamp) {
        require(_ownerOf(tokenId) != address(0), "GetPlaytimeStatus: Token does not exist");
        return _playtimeStakedUntil[tokenId];
    }

    // Function to get all pets owned by an address
    function getPetsByOwner(address owner) public view returns (PetInfo[] memory) {
        uint256 ownerBalance = balanceOf(owner);
        PetInfo[] memory ownedPetInfos = new PetInfo[](ownerBalance);

        for (uint256 i = 0; i < ownerBalance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            Pet storage pet = _pets[tokenId];
            ownedPetInfos[i] = PetInfo({
                tokenId: tokenId,
                name: pet.name,
                petType: pet.petType,
                rarity: pet.rarity,
                ageStage: pet.ageStage,
                birthTime: pet.birthTime,
                stakedUntil: _stakedUntil[tokenId],
                playtimeStakedUntil: _playtimeStakedUntil[tokenId]
            });
        }
        return ownedPetInfos;
    }

    // --- Combining Logic Placeholder ---
    // function combinePets(uint256[] calldata tokenIds) public { ... }

    // --- Internal Functions ---

    function _promoteAgeStage(uint256 tokenId) internal {
        Pet storage pet = _pets[tokenId];
        if (pet.ageStage == AgeStage.Baby) {
            pet.ageStage = AgeStage.Teen;
            emit PetAgeStageUpdated(tokenId, AgeStage.Teen);
        } else if (pet.ageStage == AgeStage.Teen) {
            pet.ageStage = AgeStage.Adult;
            emit PetAgeStageUpdated(tokenId, AgeStage.Adult);
        }
        // If already Adult, do nothing
    }

    // The following functions are overrides required by Solidity.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        // Get 'from' address before calling super._update which changes the owner
        address from = _ownerOf(tokenId);

        // Add stake check here: Prevent actual transfers (not mints/burns) if staked
        if (from != address(0) && to != address(0)) {
            require(_stakedUntil[tokenId] == 0 && _playtimeStakedUntil[tokenId] == 0, "ERC721: token transfer while staked");
        }

        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // --- Owner Functions ---

    function setPlaytimeStakingDuration(uint256 newDurationInSeconds) public onlyOwner {
        require(newDurationInSeconds > 0, "Duration must be positive");
        playtimeStakingDuration = newDurationInSeconds;
        emit PlaytimeDurationChanged(newDurationInSeconds);
    }
}
