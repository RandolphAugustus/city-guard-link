import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:getCityGuardReportCount")
  .addParam("contract", "Address of the CityGuard contract")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const contractAddress = taskArguments.contract;
    const CityGuard = await ethers.getContractAt("CityGuard", contractAddress);
    const count = await CityGuard.getReportCount();
    console.log("Total reports:", count.toString());
  });

task("task:getCityGuardReportsByReporter")
  .addParam("contract", "Address of the CityGuard contract")
  .addParam("reporter", "Address of the reporter")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const contractAddress = taskArguments.contract;
    const reporter = taskArguments.reporter;
    const CityGuard = await ethers.getContractAt("CityGuard", contractAddress);
    const ids = await CityGuard.getReportIdsByReporter(reporter);
    console.log("Report IDs for", reporter, ":", ids.toString());
  });
