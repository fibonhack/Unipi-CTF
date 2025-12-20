import crypto from 'crypto';

function stringToBigInt(str) {
  return bytesToBigInt(Buffer.from(str));
}

function bytesToBigInt(bytes) {
  let hex = Buffer.from(bytes).toString('hex');
  if (hex.length === 0) return 0n;
  return BigInt('0x' + hex);
}

function gcd(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

async function generatePrime(bits) {
  return crypto.generatePrimeSync(bits, { bigint: true });
}

function generateRandomString(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


export async function afterDeploy({ signer, moduleAddress, invokeEntry }) {
  const primeBits = 124;
  const p = await generatePrime(primeBits);
  let q = await generatePrime(primeBits);
  while (q === p) q = await generatePrime(primeBits);
  const n = p * q;

  const e1 = 65537n;
  const e2 = 65539n;

  let m;
  while (true) {
    const mStr = generateRandomString(31);
    const candidate = stringToBigInt(mStr);
    if (candidate > 0n && candidate < n && gcd(candidate, n) === 1n) {
      m = mStr;
      break;
    }
  }

  const nStr = n.toString(10);
  const e1Str = e1.toString(10);
  const e2Str = e2.toString(10);
  const functionId = `${moduleAddress}::challenge::start_challenge`;

  const { hash, result } = await invokeEntry({
    functionId,
    typeArguments: [],
    functionArguments: [nStr, e1Str, e2Str, m],
  });

  const success = Boolean(result?.success);
  return { ran: true, hash, success };
}


