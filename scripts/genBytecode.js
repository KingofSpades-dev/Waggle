const fs = require('fs');
const path = require('path');

const bin = fs.readFileSync(path.join(__dirname, '../contracts/build/contracts_src_WaggleAttestor_sol_WaggleAttestor.bin'), 'utf-8').trim();
const content = `export const WAGGLE_ATTESTOR_BYTECODE_HEX = "0x${bin}" as const;\n`;
fs.writeFileSync(path.join(__dirname, '../src/lib/contracts/waggleAttestorBytecode.ts'), content);
console.log('Successfully wrote bytecode TS file. Length:', bin.length);
