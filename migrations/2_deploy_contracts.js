var Auction = artifacts.require("./ConceptAuction.sol");

module.exports = function(deployer) {
  deployer.deploy(Auction);
};