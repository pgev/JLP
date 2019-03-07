const Web3 = require('web3');
const Package = require('@openstfoundation/openst.js');

const logger = require('./logger');

class OpenSTDeployer {
  constructor(chainConfig) {
    this.chainConfig = chainConfig;
    this.auxiliary = {
      web3: new Web3(chainConfig.auxiliaryWeb3Provider),
      chainId: chainConfig.auxiliaryChainId,
      deployer: chainConfig.auxiliaryDeployerAddress,
      txOptions: {
        gasPrice: chainConfig.auxiliaryGasPrice,
        from: chainConfig.auxiliaryDeployerAddress,
      },
    };
  }

  async deployTokenRules(auxiliaryOrganization, auxiliaryEIP20Token) {
    logger.info('Deploying TokenRules');
    const tokenRules = Package.ContractInteract.TokenRules;
    const tokenRulesTxOptions = this.auxiliary.options;
    const response = await tokenRules.deploy(
      tokenRulesTxOptions,
      auxiliaryOrganization,
      auxiliaryEIP20Token,
      tokenRulesTxOptions,
    );
    logger.info(`Deployed TokenRules address: ${response.receipt.contractAddress}`);
    return response.receipt.contractAddress;
  }

  async setupOpenst(auxiliaryOrganization, auxiliaryEIP20Token) {
    logger.info('Starting Setup of OpenST');
    const openst = new Package.Setup.OpenST(this.auxiliary.web3);
    const tokenHolderTxOptions = this.auxiliary.txOptions;
    const gnosisTxOptions = this.auxiliary.txOptions;
    const recoveryTxOptions = this.auxiliary.txOptions;
    const userWalletFactoryTxOptions = this.auxiliary.txOptions;
    const proxyFactoryTxOptions = this.auxiliary.txOptions;
    const createAndAddModulesTxOptions = this.auxiliary.txOptions;

    const {
      tokenHolder,
      gnosisSafe,
      recovery,
      userWalletFactory,
      proxyFactory,
      createAndAddModules,
    } = await openst.setup(
      tokenHolderTxOptions,
      gnosisTxOptions,
      recoveryTxOptions,
      userWalletFactoryTxOptions,
      proxyFactoryTxOptions,
      createAndAddModulesTxOptions,
    );

    const tokenRulesAddress = await this.deployTokenRules(
      auxiliaryOrganization,
      auxiliaryEIP20Token,
    );

    const setupData = {
      tokenHolderMasterCopy: tokenHolder.address,
      gnosisSafeMasterCopy: gnosisSafe.address,
      recoveryMasterCopy: recovery.address,
      userWalletFactory: userWalletFactory.address,
      proxyFactory: proxyFactory.address,
      createAndAddModules: createAndAddModules.address,
      tokenRules: tokenRulesAddress,
    };
    Object.assign(this.chainConfig.openst, setupData);
    logger.info('Completed Setup of OpenST');
  }
}

module.exports = OpenSTDeployer;
