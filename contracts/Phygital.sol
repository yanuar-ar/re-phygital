// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol';
import '@openzeppelin/contracts/utils/Strings.sol';

contract Phygital is ERC1155, Ownable, ERC1155Supply {
    struct Mint {
        uint256 maxPerWallet;
        uint256 maxSupply;
        uint256 startTime;
        uint256 endTime;
        uint256 price;
        bool active;
    }

    struct Burn {
        uint256 startTime;
        uint256 endTime;
        bool active;
    }

    // burn Phase
    mapping(uint256 => Mint) public mintPhase;

    // burn Phase
    mapping(uint256 => Burn) public burnPhase;

    // has minted
    mapping(uint256 => mapping(address => uint256)) public hasMinted;

    // has burned
    mapping(uint256 => mapping(address => uint256)) public hasBurned;

    string public baseTokenURI;

    // The internal ID tracker
    uint256 private _currentId = 0;

    constructor(string memory _baseTokenURI) ERC1155('') {
        baseTokenURI = _baseTokenURI;
    }

    // token URI
    function setBaseURI(string calldata _baseTokenURI) external onlyOwner {
        baseTokenURI = _baseTokenURI;
    }

    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        require(exists(tokenId), 'Token does not exists !');
        return bytes(baseTokenURI).length > 0 ? string(abi.encodePacked(baseTokenURI, Strings.toString(tokenId))) : '';
    }

    function mint(uint256 id, uint256 quantity) public payable returns (uint256) {
        // check active
        require(mintPhase[id].active == true, 'Mint not active');

        // check endTime minting
        require(block.timestamp < mintPhase[id].endTime, 'Minting expired');

        // check startTime minting
        require(block.timestamp > mintPhase[id].startTime, 'Minting not started');

        // check has minted
        require(hasMinted[id][msg.sender] + quantity <= mintPhase[id].maxPerWallet, 'Max mint exceeds the limit');

        //check ETH being paid is sufficient
        require(msg.value >= (mintPhase[id].price * quantity), 'Not enough ETH to pay');

        hasMinted[id][msg.sender] += quantity;

        _mint(msg.sender, id, quantity, '');

        return (id);
    }

    function burn(uint256 id, uint256 quantity) public virtual {
        // check active
        require(burnPhase[id].active == true, 'Burn not active');

        // check endTime burn
        require(block.timestamp < burnPhase[id].endTime, 'Burn expired');

        // check startTime burn
        require(block.timestamp > burnPhase[id].startTime, 'Burn not started');

        hasBurned[id][msg.sender] += quantity;

        _burn(msg.sender, id, quantity);
    }

    function createMintPhase(
        uint256 maxPerWallet,
        uint256 maxSupply,
        uint256 startTime,
        uint256 endTime,
        uint256 price,
        bool active
    ) external onlyOwner {
        _currentId++;
        mintPhase[_currentId] = Mint({
            maxPerWallet: maxPerWallet,
            maxSupply: maxSupply,
            startTime: startTime,
            endTime: endTime,
            price: price,
            active: active
        });
    }

    function updateMintPhase(
        uint256 id,
        uint256 maxPerWallet,
        uint256 maxSupply,
        uint256 startTime,
        uint256 endTime,
        uint256 price,
        bool active
    ) external onlyOwner {
        require(mintPhase[id].startTime != 0, 'mint phase does not exists !');
        mintPhase[id] = Mint({
            maxPerWallet: maxPerWallet,
            maxSupply: maxSupply,
            startTime: startTime,
            endTime: endTime,
            price: price,
            active: active
        });
    }

    function setMintPhaseActive(uint256 id, bool _active) external onlyOwner {
        mintPhase[id].active = _active;
    }

    function createBurnPhase(
        uint256 id,
        uint256 startTime,
        uint256 endTime,
        bool active
    ) external onlyOwner {
        require(exists(id), 'Token does not exists !');
        burnPhase[id] = Burn({ startTime: startTime, endTime: endTime, active: active });
    }

    function updateBurnPhase(
        uint256 id,
        uint256 startTime,
        uint256 endTime,
        bool active
    ) external onlyOwner {
        require(burnPhase[id].startTime != 0, 'burn phase does not exists !');
        burnPhase[id] = Burn({ startTime: startTime, endTime: endTime, active: active });
    }

    function setBurnPhaseActive(uint256 id, bool _active) external onlyOwner {
        burnPhase[id].active = _active;
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
