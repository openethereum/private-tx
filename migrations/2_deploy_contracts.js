"use strict";

const PrivateContract = artifacts.require("./PrivateContract.sol");

module.exports = deployer => {
  // We actually deploy manually in `beforeEach()` to pass the validators in constructor
  // deployer.deploy(PrivateContract);
};
