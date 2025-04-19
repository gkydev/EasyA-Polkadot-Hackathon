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
        string petType;
        string name;
    }

    // Struct to return detailed pet info including tokenId
    struct PetInfo {
        uint256 tokenId;
        string name;
        string petType;
        Rarity rarity;
        AgeStage ageStage;
        uint256 birthTime;
        uint256 stakedUntil;
    }

    // Mapping from token ID to Pet details
    mapping(uint256 => Pet) private _pets;

    // Mapping from token ID to the timestamp when staking ends
    mapping(uint256 => uint256) private _stakedUntil;

    // Available pet type names
    string[] private _petTypeNames = ["Barkley", "Nibbles", "Whiskoo", "Peepin", "Slowmi"];

    // Constants
    uint256 private constant STAKING_DURATION = 30 days;

    // Events
    event Staked(uint256 indexed tokenId, address indexed owner, uint256 stakedUntilTimestamp);
    event Unstaked(uint256 indexed tokenId, address indexed owner);
    event PetAgeStageUpdated(uint256 indexed tokenId, AgeStage newStage);
    event PetNameChanged(uint256 indexed tokenId, string newName);

    constructor()
        ERC721("PetiDot", "Peti")
        Ownable(msg.sender)
    {}

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

        // Determine initial PetType randomly from the array
        uint256 typeIndex = uint256(randomHash) % _petTypeNames.length;
        string memory initialPetType = _petTypeNames[typeIndex];

        _pets[tokenId] = Pet({
            rarity: initialRarity,
            ageStage: AgeStage.Baby,
            birthTime: block.timestamp,
            petType: initialPetType,
            name: initialPetType
        });
    }

    // Function to get pet details
    function getPetDetails(uint256 tokenId) public view returns (string memory name, string memory petType, Rarity rarity, AgeStage ageStage, uint256 birthTime, uint256 stakedUntil) {
        require(_ownerOf(tokenId) != address(0), "GetPetDetails: Token does not exist");
        Pet storage pet = _pets[tokenId];
        return (pet.name, pet.petType, pet.rarity, pet.ageStage, pet.birthTime, _stakedUntil[tokenId]);
    }

    // Function to set a new name for a pet
    function setPetName(uint256 tokenId, string calldata newName) public {
        require(ownerOf(tokenId) == msg.sender, "SetPetName: Not owner");
        require(_stakedUntil[tokenId] == 0, "SetPetName: Pet is staked");
        require(bytes(newName).length > 0, "SetPetName: Name cannot be empty");

        _pets[tokenId].name = newName;
        emit PetNameChanged(tokenId, newName);
    }

    // --- Staking Logic (Age Progression) ---

    function stake(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Stake: Not owner");
        require(_stakedUntil[tokenId] == 0, "Stake: Pet is already staked");
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
                stakedUntil: _stakedUntil[tokenId]
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
            require(_stakedUntil[tokenId] == 0, "ERC721: token transfer while staked");
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
}
