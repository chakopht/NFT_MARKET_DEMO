// MockAxelarGasService.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockAxelarGasService {
    event NativeGasPaid(
        address sender,
        string destinationChain,
        string destinationAddress,
        bytes payload,
        uint256 amount
    );

    function payNativeGasForContractCall(
        address sender,
        string calldata destinationChain,
        string calldata destinationAddress,
        bytes calldata payload,
        address refundAddress
    ) external payable {
        emit NativeGasPaid(sender, destinationChain, destinationAddress, payload, msg.value);
        // No-op: you can extend to simulate refunds if needed
    }
}
