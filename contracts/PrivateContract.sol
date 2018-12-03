// Private Transactions State Storage
//
// Copyright 2018 Parity Technologies Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This contract keeps track of a private transaction state (supposedly encrypted)
// and allows its change only if all the Validators (from a static list, initialized in constructor)
// have signed a new state (hashed together with a current nonce, for replay protection).

pragma solidity ^0.4.18;


contract PrivateContract {
	address[] public validators;
	bytes public state;
	bytes public code;
	uint256 public nonce;
	
	event PrivateStateChanged(
		address changesOriginator,
		bytes originalTransactionHash
	);

	constructor(
		address[] initialValidators,
		bytes initialCode,
		bytes initialState
	)
		public
	{
		validators = initialValidators;
		code = initialCode;
		state = initialState;
		nonce = 1;
	}

	function getValidators()
		public
		view
		returns (address[])
	{
		return validators;
	}

	function setState(
		bytes newState,
		uint8[] v,
		bytes32[] r,
		bytes32[] s
	)
		public
	{
		bytes32 noncedStateHash = keccak256(
			abi.encodePacked([keccak256(newState), bytes32(nonce)])
		);

		for (uint i = 0; i < validators.length; i++) {
			assert(
				ecrecover(
					noncedStateHash,
					v[i],
					r[i],
					s[i]
				) == validators[i]
			);
		}

		state = newState;
		nonce = nonce + 1;
	}
	
	function notifyChanges(
		address changesOriginator,
		bytes originalTransactionHash
	)
		public
	{
		emit PrivateStateChanged(changesOriginator, originalTransactionHash);
	}
	
	function getVersion()
		public
		pure
		returns (uint8)
	{
		return 2;
	}
}
