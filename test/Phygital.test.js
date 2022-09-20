const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('NOMO NOUNS Testing', async () => {
  let phygital;

  before(async () => {
    [owner, nonOwner] = await ethers.getSigners();

    const Phygital = await ethers.getContractFactory('Phygital');
    phygital = await Phygital.deploy('https://google.com/');
  });

  describe('Deployment', async () => {
    it('should deployed', async function () {
      expect(phygital.address).to.not.equal('');
    });
  });

  describe('Testing ERC1155 functionality', async () => {
    it('should set contract URI', async () => {
      await phygital.setBaseURI('ipfs://qm6yUiaiak');

      expect(await phygital.baseTokenURI()).to.eq('ipfs://qm6yUiaiak');
    });
  });

  describe('Testing Create/Update Mint Phase Function', async () => {
    let startTime = Math.floor(Date.now() / 1000);
    let endTime = startTime + 60;
    let price = ethers.utils.parseUnits((1).toString(), 'ether');
    let maxPerWallet = 3;
    let maxSupply = 100;

    it('should create Mint Phase', async () => {
      await phygital.createMintPhase(maxPerWallet, maxSupply, startTime, endTime, price, false);

      const [tMaxPerWallet, tMaxSupply, tStartTime, tEndTime, tPrice, tActive] =
        await phygital.mintPhase(1);

      expect(tMaxPerWallet).to.eq(ethers.BigNumber.from(maxPerWallet));
      expect(tMaxSupply).to.eq(ethers.BigNumber.from(maxSupply));
      expect(tStartTime).to.eq(ethers.BigNumber.from(startTime));
      expect(tEndTime).to.eq(ethers.BigNumber.from(endTime));
      expect(tPrice).to.eq(ethers.BigNumber.from(price));
      expect(tActive).to.eq(false);
    });

    it('should revert if Mint Phase not active', async () => {
      await expect(phygital.mint(1, 1)).to.be.revertedWith('Mint not active');
    });

    it('should revert if a user mint for an expired Mint Phase', async () => {
      // change endTime backward 120 second
      endTime = endTime - 120;
      startTime = startTime - 120;
      await phygital.updateMintPhase(1, maxPerWallet, maxSupply, startTime, endTime, price, true);
      await expect(phygital.mint(1, 1)).to.be.revertedWith('Minting expired');
    });

    it('should revert if a user mint before Mint Phase started', async () => {
      startTime = Math.floor(Date.now() / 1000) + 60;
      endTime = startTime + 60;

      await phygital.updateMintPhase(1, maxPerWallet, maxSupply, startTime, endTime, price, true);
      await expect(phygital.mint(1, 1)).to.be.revertedWith('Minting not started');
    });

    it('should revert if a user mint more then max quantity perwallet', async () => {
      startTime = Math.floor(Date.now() / 1000) - 1;
      endTime = startTime + 60;

      await phygital.updateMintPhase(1, maxPerWallet, maxSupply, startTime, endTime, price, true);
      await expect(phygital.mint(1, 4)).to.be.revertedWith('Max mint exceeds the limit');
    });

    it('should revert if a user pay less then price', async () => {
      await expect(phygital.mint(1, 3, { value: 0 })).to.be.revertedWith('Not enough ETH to pay');
    });

    it('should not reverted', async () => {
      await expect(phygital.mint(1, 3, { value: ethers.utils.parseUnits((3).toString(), 'ether') }))
        .not.to.be.reverted;

      expect(await phygital.balanceOf(owner.address, 1)).to.eq(ethers.BigNumber.from('3'));
    });

    it('should revert if a user mint more then max quantity perwallet', async () => {
      await expect(phygital.mint(1, 1)).to.be.revertedWith('Max mint exceeds the limit');
    });

    it('should create Second Mint Phase', async () => {
      startTime = Math.floor(Date.now() / 1000) - 1;
      endTime = startTime + 60;
      price = ethers.utils.parseUnits((1).toString(), 'ether');
      maxPerWallet = 3;
      maxSupply = 100;

      await phygital.createMintPhase(maxPerWallet, maxSupply, startTime, endTime, price, true);

      const [tMaxPerWallet, tMaxSupply, tStartTime, tEndTime, tPrice, tActive] =
        await phygital.mintPhase(2);

      expect(tMaxPerWallet).to.eq(ethers.BigNumber.from(maxPerWallet));
      expect(tMaxSupply).to.eq(ethers.BigNumber.from(maxSupply));
      expect(tStartTime).to.eq(ethers.BigNumber.from(startTime));
      expect(tEndTime).to.eq(ethers.BigNumber.from(endTime));
      expect(tPrice).to.eq(ethers.BigNumber.from(price));
      expect(tActive).to.eq(true);
    });

    it('should not reverted for second mint', async () => {
      await expect(phygital.mint(2, 3, { value: ethers.utils.parseUnits((3).toString(), 'ether') }))
        .not.to.be.reverted;

      expect(await phygital.balanceOf(owner.address, 2)).to.eq(ethers.BigNumber.from('3'));
    });

    it('should update second Mint Phase', async () => {
      await phygital.updateMintPhase(1, 10, 10, startTime, endTime, price, false);

      const [tMaxPerWallet, tMaxSupply, tStartTime, tEndTime, tPrice, tActive] =
        await phygital.mintPhase(1);

      expect(tMaxPerWallet).to.eq(ethers.BigNumber.from(10));
      expect(tMaxSupply).to.eq(ethers.BigNumber.from(10));
      expect(tStartTime).to.eq(ethers.BigNumber.from(startTime));
      expect(tEndTime).to.eq(ethers.BigNumber.from(endTime));
      expect(tPrice).to.eq(ethers.BigNumber.from(price));
      expect(tActive).to.eq(false);
    });

    it('should revert with if mint phase does not exists', async () => {
      await expect(
        phygital.updateMintPhase(9999, 10, 10, startTime, endTime, price, false),
      ).to.be.revertedWith('mint phase does not exists !');
    });

    it('should active changed to true', async () => {
      await phygital.setMintPhaseActive(1, true);

      const [, , , , , tActive] = await phygital.mintPhase(1);

      expect(tActive).to.eq(true);
    });
  });

  describe('Testing Create/Update Burn Function', async () => {
    let startTime = Math.floor(Date.now() / 1000);
    let endTime = startTime + 60;

    it('should create Burn Phase', async () => {
      await phygital.createBurnPhase(1, startTime, endTime, false);

      const [tStartTime, tEndTime, tActive] = await phygital.burnPhase(1);

      expect(tStartTime).to.eq(ethers.BigNumber.from(startTime));
      expect(tEndTime).to.eq(ethers.BigNumber.from(endTime));
      expect(tActive).to.eq(false);
    });

    it('should revert if token does not exists', async () => {
      await expect(phygital.createBurnPhase(999, startTime, endTime, true)).to.be.revertedWith(
        'Token does not exists !',
      );
    });

    it('should revert if Burn Phase not active', async () => {
      await expect(phygital.burn(1, 1)).to.be.revertedWith('Burn not active');
    });

    it('should revert if a user burn for an expired Burn Phase', async () => {
      // change endTime backward 120 second
      endTime = endTime - 120;
      startTime = startTime - 120;
      await phygital.updateBurnPhase(1, startTime, endTime, true);
      await expect(phygital.burn(1, 1)).to.be.revertedWith('Burn expired');
    });

    it('should revert if a user burn before Burn Phase started', async () => {
      startTime = Math.floor(Date.now() / 1000) + 60;
      endTime = startTime + 60;

      await phygital.updateBurnPhase(1, startTime, endTime, true);
      await expect(phygital.burn(1, 1)).to.be.revertedWith('Burn not started');
    });

    it('Burn should NOT revert', async () => {
      startTime = Math.floor(Date.now() / 1000) - 1;
      endTime = startTime + 60;

      await phygital.updateBurnPhase(1, startTime, endTime, true);
      await expect(phygital.burn(1, 1)).not.to.be.reverted;
    });

    it('should update Burn Phase', async () => {
      await phygital.createBurnPhase(1, 10, 10, false);

      const [tStartTime, tEndTime, tActive] = await phygital.burnPhase(1);

      expect(tStartTime).to.eq(ethers.BigNumber.from(10));
      expect(tEndTime).to.eq(ethers.BigNumber.from(10));
      expect(tActive).to.eq(false);
    });

    it('should revert if a user update Burn Phase that the token does not exists !', async () => {
      await expect(phygital.updateBurnPhase(99999, startTime, endTime, true)).to.be.revertedWith(
        'burn phase does not exists !',
      );
    });

    it('should active changed to true', async () => {
      await phygital.setBurnPhaseActive(1, true);

      const [, , tActive] = await phygital.burnPhase(1);

      expect(tActive).to.eq(true);
    });
  });
});
