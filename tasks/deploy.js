const { task } = require('hardhat/config');

task('deploy', 'Deploy contract').setAction(async ({}, { ethers, upgrades }) => {
  const Phygital = await ethers.getContractFactory('Phygital');

  const phygital = await Phygital.deploy('', { gasLimit: 3000000 });

  await phygital.deployed();

  console.log('Contract deployed to: ', projectRe.address);
});
