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

describe("CityGuard (Sepolia)", function () {
  let signers: Signers;
  let cityGuardContract: CityGuard;
  let cityGuardContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Only run on Sepolia testnet
    if (fhevm.isMock) {
      console.warn(`This test suite is designed for Sepolia Testnet, skipping in mock mode`);
      this.skip();
    }

    ({ cityGuardContract, cityGuardContractAddress } = await deployFixture());
  });

  it("should have zero reports after deployment", async function () {
    const count = await cityGuardContract.getReportCount();
    expect(count).to.eq(0);
  });

  it("should submit a report with encrypted key on Sepolia", async function () {
    const title = "Sepolia Test Report";
    const encryptedData = ethers.toUtf8Bytes("encrypted content for sepolia");

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

  it("should get encrypted data from report on Sepolia", async function () {
    const title = "Data Test";
    const originalData = "secret message for sepolia test";
    const encryptedData = ethers.toUtf8Bytes(originalData);
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

    // Retrieve the encrypted data
    const storedData = await cityGuardContract.getReportData(0);
    expect(ethers.toUtf8String(storedData)).to.eq(originalData);
  });
});
