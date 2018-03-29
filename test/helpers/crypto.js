import {secp256k1, toBuffer, bufferToHex} from "ethereumjs-util";

export function parseSignature(signatureString) {
  return {
    r: signatureString.slice(0, 66),
    s: '0x' + signatureString.slice(66, 130),
    v: web3.toHex(27 + Number.parseInt(signatureString.slice(130), 16))
  }
};

// Since https://github.com/ethereum/go-ethereum/commit/b59c8399fbe42390a3d41e945d03b1f21c1a9b8d
// `eth_sign` messes with message to sign before actually signing; since we're only signing from the code,
// we want to avoid that prefixing; so this function mimicks the actual signing used in production.
export function ethSignWithoutPrefixing(privateKey, messageHashInHex) {
  let res = secp256k1.sign(toBuffer(messageHashInHex), toBuffer(privateKey));
  return {
    r: bufferToHex(res.signature.slice(0, 32)),
    s: bufferToHex(res.signature.slice(32, 64)),
    v: res.recovery + 27
  }
}

export function multisignWithoutPrefixing(message, privateKeys) {
  let vs = [];
  let rs = [];
  let ss = [];

  privateKeys.forEach(privateKey => {
    let signature = ethSignWithoutPrefixing(privateKey, message);
    vs.push(signature.v);
    rs.push(signature.r);
    ss.push(signature.s);
  });

  return [ vs, rs, ss ];
}