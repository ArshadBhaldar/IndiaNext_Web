const hre = require("hardhat");

async function main() {
  console.log("Deploying SupplyChain contract...\n");

  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.waitForDeployment();

  const address = await supplyChain.getAddress();

  console.log(`✅ SupplyChain deployed to: ${address}`);
  console.log(`   Network: ${hre.network.name}`);
  console.log(
    `   Deployer (admin): ${(await hre.ethers.getSigners())[0].address}\n`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
