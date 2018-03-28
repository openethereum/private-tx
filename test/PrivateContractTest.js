const Promise = require("bluebird");
const PrivateContract = artifacts.require("./PrivateContract.sol");

import {parseSignature, multisignWithoutPrefixing} from './helpers/crypto';
import {zeroPadded64Hex} from './helpers/hexManipulation';

contract('Private', function(accounts) {
  let defaultUser = accounts[0];

  // We need to know private keys to simulate signing is JS, so I've generated those with `ethkey generate random`
  let validator1 = {
    public: '0xd230b17d59a0a3c32e9cdbd55cb64f7d5322f985f854542a7619314364f274cd7984efc0f12d1ad29a0998e936d44e4143c7b8dc0f79ec0580d5b069d1ecacf2',
    private: '0x95698c0184c58f24c3587dda4aedd6ed378729f23fc19f7ca0fde21b3bfe92a2',
    address: '0x484817497433b8f896f4230398140c79d6e71bbe'
  };
  let validator2 = {
    public: '0x85497867467e7337a86631e23d7c4ef8edc1a7a8701a9065859f874777a257f4d5465d00fd56deb6790cf00bb899720902cc6c8cfeb53ba8399ff606b66e5094',
    private: '0x3b3801207c2d6851d389fccd5e52621e9dbfe2d7aee5f691c350ccc739f0943b',
    address: '0xee613015ccea088566d50a865d49d3ef970442b5'
  };
  let validator3 = {
    public: '0xd59ebab1811934dbbeb01020aea9bd4850da167c704b4e5310345df77d5ba1196206de1cbb22e299a6c38ab4a7ea1648f2f6a81781fe4e7db31c36317738b2e6',
    private: '0x323f25528bca4eac32e75590ec62a6674240468de6ae7633f580d727642d00a6',
    address: '0xc274fcaf830aa911f1b5a32c8af21c6ee7c3d264'
  };
  
  describe("getValidators", () => {
    let privateContract;

    const InitialState = "Asdfg";

    beforeEach(() => PrivateContract.new([validator1.address, validator2.address, validator3.address], '', web3.fromAscii(InitialState))
      .then(_contract => privateContract = _contract)
    );

    it("should return the list of validators", () => Promise
      .try(() => privateContract.getValidators())
      .then(validators => assert.equal(JSON.stringify(validators), JSON.stringify([validator1.address, validator2.address, validator3.address]), "The list of validators doesnt coincide with initial, expected: " + [validator1.address, validator2.address, validator3.address] + ", returned: " + validators))
    );
  });

  describe("setState", () => {
    let privateContract;

    const InitialState = "Asdfg";
    const ExpectedState = "Qwerty";

    beforeEach(() => PrivateContract.new([validator1.address, validator2.address, validator3.address], '', web3.fromAscii(InitialState))
      .then(_contract => privateContract = _contract)
    );

    it("should allow state change if all the signatures are OK", () => Promise
      .try(() => privateContract.nonce())
      .then(nonceObject => nonceObject.toNumber())
      .then(nonce => assert.equal(nonce, 1, "Freshly deployed contract should have its nonce set to 1"))

      .then(() => web3.sha3(
        web3.sha3(web3.fromAscii(ExpectedState), {encoding: 'hex'}) + zeroPadded64Hex(1),
        {encoding: 'hex'}
      ))
      .then(newStateHash => multisignWithoutPrefixing(newStateHash, [validator1.private, validator2.private, validator3.private]))
      .then(([vs, rs, ss]) => privateContract.setState(web3.fromAscii(ExpectedState), vs, rs, ss))

      .then(() => privateContract.state())
      .then(state => web3.toAscii(state))
      .then(state => assert.equal(state, ExpectedState, "With all the signatures are in place, the contract state should be updated"))

      .then(() => privateContract.nonce())
      .then(nonceObject => nonceObject.toNumber())
      .then(nonce => assert.equal(nonce, 2, "Nonce should be incremented after successfull update"))
    );

    it("should deny changes if some signatures are missing", () => Promise
      .try(() => web3.sha3(
        web3.sha3(web3.fromAscii(ExpectedState), {encoding: 'hex'}) + zeroPadded64Hex(1),
        {encoding: 'hex'}
      ))
      .then(newStateHash => multisignWithoutPrefixing(newStateHash, [validator1.private, validator2.private]))
      .then(([vs, rs, ss]) => privateContract.setState(web3.fromAscii(ExpectedState), vs, rs, ss))
      .catch(e => console.log("Transaction rolled back, reason: " + e)) // Won't be necessary when Ganache will support REVERT opcode

      .then(() => privateContract.state())
      .then(state => web3.toAscii(state))
      .then(state => assert.equal(state, InitialState, "With only two out of three signatures, the changes are reverted"))

      .then(() => privateContract.nonce())
      .then(nonceObject => nonceObject.toNumber())
      .then(nonce => assert.equal(nonce, 1, "Nonce is not increased after a failed attempt"))
    );

    it("should deny changes in case of a nonce mismatch", () => Promise
      .try(() => privateContract.nonce())
      .then(nonceObject => nonceObject.toNumber() + 1)
      .then(wrongNonce => {
        let hashableValue = web3.sha3(web3.fromAscii(ExpectedState), {encoding: 'hex'}) + zeroPadded64Hex(wrongNonce);
        return web3.sha3(hashableValue, {encoding: 'hex'})
      })
      .then(newStateHash => multisignWithoutPrefixing(newStateHash, [validator1.private, validator2.private, validator3.private]))
      .then(([vs, rs, ss]) => privateContract.setState(web3.fromAscii(ExpectedState), vs, rs, ss))
      .catch(e => console.log("Transaction rolled back, reason: " + e)) // Won't be necessary when Ganache will support REVERT opcode

      .then(() => privateContract.state())
      .then(state => web3.toAscii(state))
      .then(state => assert.equal(state, InitialState, "With incorrect nonce, the changes are reverted"))

      .then(() => privateContract.nonce())
      .then(nonceObject => nonceObject.toNumber())
      .then(nonce => assert.equal(nonce, 1, "Nonce is not increased after a failed attempt"))
    );
  });
});
