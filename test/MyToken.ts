import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const mintingAmount = 100n;
const decimals = 18n;

describe("My Token", () => {
  let myTokenC: MyToken;
  let signers: HardhatEthersSigner[];
  beforeEach("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      18,
      100,
    ]);
  });
  describe("Basic state value check", () => {
    it("shoud return name", async () => {
      expect(await myTokenC.name()).to.equal("MyToken");
    });
    it("shoud return symbol", async () => {
      expect(await myTokenC.symbol()).to.equal("MT");
    });
    it("shoud return decimals", async () => {
      expect(await myTokenC.decimals()).to.equal(decimals);
    });
    it("shoud return 100 totalSupply", async () => {
      expect(await myTokenC.totalSupply()).equal(
        mintingAmount * 10n ** decimals
      );
    });
  });
  // 1MT =  1 * 10^18
  describe("Mint", () => {
    it("shoud return 1MT balance for signer 0", async () => {
      const signer0 = signers[0];
      expect(await myTokenC.balanceOf(signer0)).equal(
        mintingAmount * 10n ** decimals
      );
    });
  });
  describe("Transfer", () => {
    it("shoud have 0.5MT", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await expect(
        myTokenC.transfer(
          hre.ethers.parseUnits("0.5", decimals),
          signer1.address
        )
      )
        .to.emit(myTokenC, "Transfer")
        .withArgs(
          signer0.address,
          signer1.address,
          hre.ethers.parseUnits("0.5", decimals)
        );
      expect(await myTokenC.balanceOf(signer1.address)).equal(
        hre.ethers.parseUnits("0.5", decimals)
      );
    });
    it("shoud be reverted with insufficient balance error", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenC.transfer(
          hre.ethers.parseUnits((mintingAmount + 1n).toString(), decimals),
          signer1.address
        )
      ).to.be.revertedWith("insufficient balance");
    });
  });
  describe("TransferFrom", () => {
    it("shoud emit Approval event", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenC.approve(signer1.address, hre.ethers.parseUnits("10", decimals))
      )
        .to.emit(myTokenC, "Approval")
        .withArgs(signer1.address, hre.ethers.parseUnits("10", decimals));
    });
    it("should be reberted with insufficient allowance error", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await expect(
        myTokenC
          .connect(signer1)
          .transferFrom(
            signer0.address,
            signer1.address,
            hre.ethers.parseUnits("1", decimals)
          )
      ).to.be.revertedWith("insufficient allowance");
    });
    // 과제
    describe("assignment", () => {
      it("signer1 should transfer signer0's tokens after approval", async () => {
        const signer0 = signers[0];
        const signer1 = signers[1];

        // 1. approve
        await expect(
          myTokenC.approve(
            signer1.address,
            hre.ethers.parseUnits("1", decimals)
          )
        )
          .to.emit(myTokenC, "Approval")
          .withArgs(signer1.address, hre.ethers.parseUnits("1", decimals));

        // 2. transferFrom
        await expect(
          myTokenC
            .connect(signer1)
            .transferFrom(
              signer0.address,
              signer1.address,
              hre.ethers.parseUnits("1", decimals)
            )
        )
          .to.emit(myTokenC, "Transfer")
          .withArgs(
            signer0.address,
            signer1.address,
            hre.ethers.parseUnits("1", decimals)
          );

        // 3. Balance 확인
        const balanceSigner0 = await myTokenC.balanceOf(signer0.address);
        const balanceSigner1 = await myTokenC.balanceOf(signer1.address);

        expect(balanceSigner0).to.equal(
          hre.ethers.parseUnits((mintingAmount - 1n).toString(), decimals)
        );
        expect(balanceSigner1).to.equal(hre.ethers.parseUnits("1", decimals));
      });
    });
  });
});
