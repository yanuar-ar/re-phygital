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
      await phygital.createMintPhase(maxPerWallet, maxSupply, startTime, endTime, price, true);

      const [tMaxPerWallet, tMaxSupply, tStartTime, tEndTime, tPrice, tActive] =
        await phygital.mintPhase(1);

      expect(tMaxPerWallet).to.eq(ethers.BigNumber.from(maxPerWallet));
      expect(tMaxSupply).to.eq(ethers.BigNumber.from(maxSupply));
      expect(tStartTime).to.eq(ethers.BigNumber.from(startTime));
      expect(tEndTime).to.eq(ethers.BigNumber.from(endTime));
      expect(tPrice).to.eq(ethers.BigNumber.from(price));
      expect(tActive).to.eq(true);
    });

    it('should create Second Mint Phase', async () => {
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

    it('should update Mint Phase', async () => {
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
    it('should revert with: mint phase does not exists ! ', async () => {
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
      await phygital.createBurnPhase(1, startTime, endTime, true);

      const [tId, tStartTime, tEndTime, tActive] = await phygital.burnPhase(1);

      expect(tId).to.eq(ethers.BigNumber.from(1));
      expect(tStartTime).to.eq(ethers.BigNumber.from(startTime));
      expect(tEndTime).to.eq(ethers.BigNumber.from(endTime));
      expect(tActive).to.eq(true);
    });

    it('should revert with: Token does not exists !', async () => {
      await expect(phygital.createBurnPhase(999, startTime, endTime, true)).to.be.revertedWith(
        'Token does not exists !',
      );
    });

    it('should update Burn Phase', async () => {
      await phygital.createBurnPhase(1, 10, 10, false);

      const [tId, tStartTime, tEndTime, tActive] = await phygital.burnPhase(1);

      expect(tId).to.eq(ethers.BigNumber.from(1));
      expect(tStartTime).to.eq(ethers.BigNumber.from(10));
      expect(tEndTime).to.eq(ethers.BigNumber.from(10));
      expect(tActive).to.eq(false);
    });

    it('should revert with: burn phase does not exists !', async () => {
      await expect(phygital.updateBurnPhase(99999, startTime, endTime, true)).to.be.revertedWith(
        'burn phase does not exists !',
      );
    });

    it('should active changed to true', async () => {
      await phygital.setBurnPhaseActive(1, true);

      const [, , , tActive] = await phygital.burnPhase(1);

      expect(tActive).to.eq(true);
    });
  });
});
