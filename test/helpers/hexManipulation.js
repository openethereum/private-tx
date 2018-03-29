export function zeroPadded64Hex(value) {
  let hexed = web3.toHex(value).slice(2,);
  return ("0000000000000000000000000000000000000000000000000000000000000000" + hexed).slice(-64)
}