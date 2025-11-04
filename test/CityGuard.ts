import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { CityGuard, CityGuard__factory } from "../types";
import { expect } from "chai";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("CityGuard")) as CityGuard__factory;
  const cityGuardContract = (await factory.deploy()) as CityGuard;
  const cityGuardContractAddress = await cityGuardContract.getAddress();

  return { cityGuardContract, cityGuardContractAddress };
}

describe("CityGuard", function () {
  let signers: Signers;
  let cityGuardContract: CityGuard;
  let cityGuardContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ cityGuardContract, cityGuardContractAddress } = await deployFixture());
  });

  it("should have zero reports after deployment", async function () {
    const count = await cityGuardContract.getReportCount();
    expect(count).to.eq(0);
  });

  it("should submit a report with encrypted key", async function () {
    const title = "Test Report";
    const encryptedData = ethers.toUtf8Bytes("encrypted content placeholder");

    // Create a mock address as the encryption key
    const mockKey = "0x1234567890123456789012345678901234567890";

    // Encrypt the key using FHE
    const encryptedKey = await fhevm
      .createEncryptedInput(cityGuardContractAddress, signers.alice.address)
      .addAddress(mockKey)
      .encrypt();

    // Submit the report
    const tx = await cityGuardContract
      .connect(signers.alice)
      .submitReport(title, encryptedData, encryptedKey.handles[0], encryptedKey.inputProof);
    await tx.wait();

    // Verify report count
    const count = await cityGuardContract.getReportCount();
    expect(count).to.eq(1);

    // Verify report metadata
    const [reporter, reportTitle, createdAt, status] = await cityGuardContract.getReportMeta(0);
    expect(reporter).to.eq(signers.alice.address);
    expect(reportTitle).to.eq(title);
    expect(createdAt).to.be.gt(0);
    expect(status).to.eq(0); // Pending
  });

  it("should track reports by reporter", async function () {
    const encryptedData = ethers.toUtf8Bytes("test data");
    const mockKey = "0x1234567890123456789012345678901234567890";

    // Alice submits 2 reports
    for (let i = 0; i < 2; i++) {
      const encryptedKey = await fhevm
        .createEncryptedInput(cityGuardContractAddress, signers.alice.address)
        .addAddress(mockKey)
        .encrypt();

      await cityGuardContract
        .connect(signers.alice)
        .submitReport(`Report ${i}`, encryptedData, encryptedKey.handles[0], encryptedKey.inputProof);
    }

    // Bob submits 1 report
    const bobEncryptedKey = await fhevm
      .createEncryptedInput(cityGuardContractAddress, signers.bob.address)
      .addAddress(mockKey)
      .encrypt();

    await cityGuardContract
      .connect(signers.bob)
      .submitReport("Bob Report", encryptedData, bobEncryptedKey.handles[0], bobEncryptedKey.inputProof);

    // Verify counts
    const aliceCount = await cityGuardContract.getReportCountByReporter(signers.alice.address);
    const bobCount = await cityGuardContract.getReportCountByReporter(signers.bob.address);
    expect(aliceCount).to.eq(2);
    expect(bobCount).to.eq(1);

    // Verify Alice's report IDs
    const aliceIds = await cityGuardContract.getReportIdsByReporter(signers.alice.address);
    expect(aliceIds.length).to.eq(2);
    expect(aliceIds[0]).to.eq(0);
    expect(aliceIds[1]).to.eq(1);
  });

  it("should store and retrieve encrypted key handle", async function () {
    const title = "Encrypt Test";
    const encryptedData = ethers.toUtf8Bytes("secret content");
    const mockKey = "0xABCDEF1234567890ABCDEF1234567890ABCDEF12";

    // Encrypt the key
    const encryptedKey = await fhevm
      .createEncryptedInput(cityGuardContractAddress, signers.alice.address)
      .addAddress(mockKey)
      .encrypt();

    // Submit the report
    await cityGuardContract
      .connect(signers.alice)
      .submitReport(title, encryptedData, encryptedKey.handles[0], encryptedKey.inputProof);

    // Get the encrypted key handle - verify it is not zero
    const storedEncKey = await cityGuardContract.getEncryptedKey(0);
    expect(storedEncKey).to.not.eq(ethers.ZeroHash);

    // Verify report data can be retrieved
    const storedData = await cityGuardContract.getReportData(0);
    expect(ethers.toUtf8String(storedData)).to.eq("secret content");
  });

  it("should update report status by reporter", async function () {
    const encryptedData = ethers.toUtf8Bytes("test");
    const mockKey = "0x1234567890123456789012345678901234567890";

    const encryptedKey = await fhevm
      .createEncryptedInput(cityGuardContractAddress, signers.alice.address)
      .addAddress(mockKey)
      .encrypt();

    await cityGuardContract
      .connect(signers.alice)
      .submitReport("Status Test", encryptedData, encryptedKey.handles[0], encryptedKey.inputProof);

    // Update status to Reviewed
    await cityGuardContract.connect(signers.alice).updateReportStatus(0, 1);
    let [, , , status] = await cityGuardContract.getReportMeta(0);
    expect(status).to.eq(1); // Reviewed

    // Update status to Resolved
    await cityGuardContract.connect(signers.alice).updateReportStatus(0, 2);
    [, , , status] = await cityGuardContract.getReportMeta(0);
    expect(status).to.eq(2); // Resolved
  });

  it("should reject status update from non-reporter", async function () {
    const encryptedData = ethers.toUtf8Bytes("test");
    const mockKey = "0x1234567890123456789012345678901234567890";

    const encryptedKey = await fhevm
      .createEncryptedInput(cityGuardContractAddress, signers.alice.address)
      .addAddress(mockKey)
      .encrypt();

    await cityGuardContract
      .connect(signers.alice)
      .submitReport("Access Test", encryptedData, encryptedKey.handles[0], encryptedKey.inputProof);

    // Bob tries to update Alice's report - should fail
    await expect(
      cityGuardContract.connect(signers.bob).updateReportStatus(0, 1)
    ).to.be.revertedWith("Only reporter can update status");
  });

  it("should validate input parameters", async function () {
    const mockKey = "0x1234567890123456789012345678901234567890";
    const encryptedKey = await fhevm
      .createEncryptedInput(cityGuardContractAddress, signers.alice.address)
      .addAddress(mockKey)
      .encrypt();

    // Test empty title
    await expect(
      cityGuardContract
        .connect(signers.alice)
        .submitReport("", ethers.toUtf8Bytes("content"), encryptedKey.handles[0], encryptedKey.inputProof)
    ).to.be.revertedWith("Title cannot be empty");

    // Test empty encrypted data
    await expect(
      cityGuardContract
        .connect(signers.alice)
        .submitReport("Title", "0x", encryptedKey.handles[0], encryptedKey.inputProof)
    ).to.be.revertedWith("Encrypted data cannot be empty");
  });
});
