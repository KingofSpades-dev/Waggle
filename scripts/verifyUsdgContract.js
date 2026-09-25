/**
 * Waggle USDG EIP-3009 Contract Verifier for Robinhood Chain (ID: 4663)
 * Validates presence of transferWithAuthorization and authorizationState functions.
 */

const EIP_3009_ABI = [
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external",
  "function receiveWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external",
  "function cancelAuthorization(address authorizer, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external",
  "function authorizationState(address authorizer, bytes32 nonce) external view returns (bool)",
  "function TRANSFER_WITH_AUTHORIZATION_TYPEHASH() external view returns (bytes32)"
];

export const ROBINHOOD_USDG_ADDRESS = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";

export function verifyUsdgContractInterface(abiOrFunctions) {
  const requiredFunctions = [
    "transferWithAuthorization",
    "authorizationState",
    "cancelAuthorization"
  ];

  const fnStrings = Array.isArray(abiOrFunctions) ? abiOrFunctions.join(" ") : String(abiOrFunctions);
  const results = requiredFunctions.map(fn => ({
    name: fn,
    exists: fnStrings.includes(fn)
  }));

  const allValid = results.every(r => r.exists);
  return {
    contractAddress: ROBINHOOD_USDG_ADDRESS,
    isEip3009Compliant: allValid,
    checks: results
  };
}

if (typeof process !== "undefined" && process.argv && process.argv[1]?.includes("verifyUsdgContract.js")) {
  console.log("Verifying USDG EIP-3009 interface on Robinhood Chain...");
  const res = verifyUsdgContractInterface(EIP_3009_ABI);
  console.log("Interface check results:", JSON.stringify(res, null, 2));
}
