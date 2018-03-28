//! Private Transactions State Storage
//! By Parity Team, 2017.
//!
//! This contract keeps track of a private transaction state (supposedly encrypted)
//! and allows its change only if all the Validators (from a static list, initialized in constructor)
//! have signed a new state (hashed together with a current nonce, for replay protection).

pragma solidity ^0.4.18;


contract PrivateContract {
    address[] public validators;
    bytes public state;
    bytes public code;
    uint256 public nonce;

    function PrivateContract(address[] initialValidators, bytes initialCode, bytes initialState) public {
        validators = initialValidators;
        code = initialCode;
        state = initialState;
        nonce = 1;
    }
    
    function getValidators() public constant returns (address[]) {
        return validators;
    }

    function setState(bytes newState, uint8[] v, bytes32[] r, bytes32[] s) public {
        var noncedStateHash = keccak256([keccak256(newState), bytes32(nonce)]);

        for (uint i = 0; i < validators.length; i++) {
            assert(ecrecover(noncedStateHash, v[i], r[i], s[i]) == validators[i]);
        }

        state = newState;
        nonce = nonce + 1;
    }
}
