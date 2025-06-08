// MockAxelarGateway.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarExecutable.sol";

contract MockAxelarGateway {
    address public receiver;

    event ContractCalled(string destinationChain, string destinationAddress, bytes payload);

    event ExecuteBegin(string destinationChain, string destinationAddress, bytes payload, address receiver);

    constructor(address _receiver) {
        receiver = _receiver;
    }

    function setReceiver(address _receiver) external {
        // Set bridge address
        receiver = _receiver;
    }

    function validateContractCall(
        bytes32 commandId,
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes32 payloadHash
    ) external pure returns (bool){
        return true;
    }

    function callContract(
        string calldata destinationChain,
        string calldata destinationAddress,
        bytes calldata payload
    ) external {
        emit ContractCalled(destinationChain, destinationAddress, payload);
    }

    function execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) external {
        IAxelarExecutable executor = IAxelarExecutable(receiver);
        executor.execute(bytes32("1"), sourceChain, sourceAddress, payload);
    }
}
