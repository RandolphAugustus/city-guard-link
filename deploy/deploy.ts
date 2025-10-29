import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  // Deploy CityGuard contract
  const deployedCityGuard = await deploy("CityGuard", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log(`CityGuard contract: `, deployedCityGuard.address);
};

export default func;
func.id = "deploy_cityGuard"; // id required to prevent reexecution
func.tags = ["CityGuard"];
