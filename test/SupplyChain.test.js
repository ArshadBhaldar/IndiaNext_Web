const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChain", function () {
  let supplyChain;
  let admin, farmer, logistics, retailer, unauthorised;

  const Role = { None: 0, Admin: 1, Farmer: 2, Logistics: 3, Retailer: 4 };
  const BatchState = { Harvested: 0, InTransit: 1, AtRetail: 2, Sold: 3 };

  const BATCH_ID = "BATCH-MANGO-001";
  const IPFS_CID = "QmTestCIDforOrganicCertificate123";

  beforeEach(async function () {
    [admin, farmer, logistics, retailer, unauthorised] =
      await ethers.getSigners();

    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment();

    await supplyChain.grantRole(farmer.address, Role.Farmer);
    await supplyChain.grantRole(logistics.address, Role.Logistics);
    await supplyChain.grantRole(retailer.address, Role.Retailer);
  });

  // ----- Role Assignment -----
  describe("Role Assignment", function () {
    it("should set deployer as admin", async function () {
      expect(await supplyChain.roles(admin.address)).to.equal(Role.Admin);
    });

    it("should allow admin to grant roles", async function () {
      expect(await supplyChain.roles(farmer.address)).to.equal(Role.Farmer);
      expect(await supplyChain.roles(logistics.address)).to.equal(Role.Logistics);
      expect(await supplyChain.roles(retailer.address)).to.equal(Role.Retailer);
    });

    it("should emit RoleGranted event", async function () {
      const [, , , , , newUser] = await ethers.getSigners();
      await expect(supplyChain.grantRole(newUser.address, Role.Farmer))
        .to.emit(supplyChain, "RoleGranted")
        .withArgs(newUser.address, Role.Farmer);
    });

    it("should revert when non-admin tries to grant role", async function () {
      await expect(
        supplyChain.connect(farmer).grantRole(unauthorised.address, Role.Farmer)
      ).to.be.revertedWith("Access denied: admin only");
    });
  });

  // ----- Batch Creation -----
  describe("Batch Creation", function () {
    it("should allow a farmer to create a batch", async function () {
      await supplyChain.connect(farmer).createBatch(BATCH_ID, IPFS_CID);

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.batchId).to.equal(BATCH_ID);
      expect(batch.farmerAddress).to.equal(farmer.address);
      expect(batch.ipfsCID).to.equal(IPFS_CID);
      expect(batch.state).to.equal(BatchState.Harvested);
    });

    it("should emit BatchCreated event", async function () {
      await expect(
        supplyChain.connect(farmer).createBatch(BATCH_ID, IPFS_CID)
      ).to.emit(supplyChain, "BatchCreated");
    });

    it("should revert on duplicate batch IDs", async function () {
      await supplyChain.connect(farmer).createBatch(BATCH_ID, IPFS_CID);
      await expect(
        supplyChain.connect(farmer).createBatch(BATCH_ID, IPFS_CID)
      ).to.be.revertedWith("Batch ID already exists");
    });

    it("should revert when non-farmer tries to create a batch", async function () {
      await expect(
        supplyChain.connect(logistics).createBatch(BATCH_ID, IPFS_CID)
      ).to.be.revertedWith("Access denied: insufficient role");
    });
  });

  // ----- Transit Checkpoints -----
  describe("Transit Checkpoints", function () {
    beforeEach(async function () {
      await supplyChain.connect(farmer).createBatch(BATCH_ID, IPFS_CID);
    });

    it("should transition batch to InTransit on first checkpoint", async function () {
      await supplyChain
        .connect(logistics)
        .updateTransit(BATCH_ID, "Ratnagiri Warehouse", "16.9902", "73.3120");

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.state).to.equal(BatchState.InTransit);
    });

    it("should emit CheckpointLogged event", async function () {
      await expect(
        supplyChain
          .connect(logistics)
          .updateTransit(BATCH_ID, "Ratnagiri Warehouse", "16.9902", "73.3120")
      ).to.emit(supplyChain, "CheckpointLogged");
    });

    it("should emit BatchStateChanged on first checkpoint", async function () {
      await expect(
        supplyChain
          .connect(logistics)
          .updateTransit(BATCH_ID, "Ratnagiri Warehouse", "16.9902", "73.3120")
      ).to.emit(supplyChain, "BatchStateChanged");
    });

    it("should allow multiple checkpoints while InTransit", async function () {
      await supplyChain
        .connect(logistics)
        .updateTransit(BATCH_ID, "Ratnagiri Warehouse", "16.9902", "73.3120");
      await supplyChain
        .connect(logistics)
        .updateTransit(BATCH_ID, "Pune Hub", "18.5204", "73.8567");

      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.state).to.equal(BatchState.InTransit);
    });

    it("should revert when non-logistics tries to update transit", async function () {
      await expect(
        supplyChain.connect(farmer).updateTransit(BATCH_ID, "Warehouse", "0", "0")
      ).to.be.revertedWith("Access denied: insufficient role");
    });
  });

  // ----- Full Lifecycle -----
  describe("Full Lifecycle", function () {
    beforeEach(async function () {
      await supplyChain.connect(farmer).createBatch(BATCH_ID, IPFS_CID);
      await supplyChain
        .connect(logistics)
        .updateTransit(BATCH_ID, "Pickup Point", "16.99", "73.31");
    });

    it("should allow retailer to receive batch (InTransit → AtRetail)", async function () {
      await supplyChain.connect(retailer).receiveAtRetail(BATCH_ID);
      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.state).to.equal(BatchState.AtRetail);
    });

    it("should allow retailer to mark batch as sold (AtRetail → Sold)", async function () {
      await supplyChain.connect(retailer).receiveAtRetail(BATCH_ID);
      await supplyChain.connect(retailer).markSold(BATCH_ID);
      const batch = await supplyChain.getBatch(BATCH_ID);
      expect(batch.state).to.equal(BatchState.Sold);
    });

    it("should revert if retailer tries to receive a Harvested batch", async function () {
      await supplyChain.connect(farmer).createBatch("FRESH-BATCH", IPFS_CID);
      await expect(
        supplyChain.connect(retailer).receiveAtRetail("FRESH-BATCH")
      ).to.be.revertedWith("Batch must be InTransit to receive at retail");
    });

    it("should revert if retailer tries to mark a non-AtRetail batch as sold", async function () {
      await expect(
        supplyChain.connect(retailer).markSold(BATCH_ID)
      ).to.be.revertedWith("Batch must be AtRetail to mark as sold");
    });

    it("should revert for non-existent batch IDs", async function () {
      await expect(
        supplyChain.getBatch("DOES-NOT-EXIST")
      ).to.be.revertedWith("Batch does not exist");
    });
  });
});
