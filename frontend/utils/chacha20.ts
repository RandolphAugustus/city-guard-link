// ChaCha20 encryption/decryption implementation
// This is a simplified implementation for browser use

function quarterRound(state: Uint32Array, a: number, b: number, c: number, d: number): void {
  state[a] += state[b];
  state[d] = rotl32(state[d] ^ state[a], 16);
  state[c] += state[d];
  state[b] = rotl32(state[b] ^ state[c], 12);
  state[a] += state[b];
  state[d] = rotl32(state[d] ^ state[a], 8);
  state[c] += state[d];
  state[b] = rotl32(state[b] ^ state[c], 7);
}

function rotl32(v: number, c: number): number {
  return ((v << c) | (v >>> (32 - c))) >>> 0;
}

function chacha20Block(key: Uint8Array, counter: number, nonce: Uint8Array): Uint8Array {
  const constants = new Uint8Array([
    0x65, 0x78, 0x70, 0x61, 0x6e, 0x64, 0x20, 0x33,
    0x32, 0x2d, 0x62, 0x79, 0x74, 0x65, 0x20, 0x6b
  ]);

  const state = new Uint32Array(16);
  const view = new DataView(new ArrayBuffer(64));

  // Constants
  for (let i = 0; i < 4; i++) {
    state[i] = (constants[i * 4] | (constants[i * 4 + 1] << 8) | (constants[i * 4 + 2] << 16) | (constants[i * 4 + 3] << 24)) >>> 0;
  }

  // Key
  for (let i = 0; i < 8; i++) {
    state[4 + i] = (key[i * 4] | (key[i * 4 + 1] << 8) | (key[i * 4 + 2] << 16) | (key[i * 4 + 3] << 24)) >>> 0;
  }

  // Counter
  state[12] = counter >>> 0;

  // Nonce
  for (let i = 0; i < 3; i++) {
    state[13 + i] = (nonce[i * 4] | (nonce[i * 4 + 1] << 8) | (nonce[i * 4 + 2] << 16) | (nonce[i * 4 + 3] << 24)) >>> 0;
  }

  const working = new Uint32Array(state);

  // 20 rounds (10 double rounds)
  for (let i = 0; i < 10; i++) {
    // Column rounds
    quarterRound(working, 0, 4, 8, 12);
    quarterRound(working, 1, 5, 9, 13);
    quarterRound(working, 2, 6, 10, 14);
    quarterRound(working, 3, 7, 11, 15);
    // Diagonal rounds
    quarterRound(working, 0, 5, 10, 15);
    quarterRound(working, 1, 6, 11, 12);
    quarterRound(working, 2, 7, 8, 13);
    quarterRound(working, 3, 4, 9, 14);
  }

  // Add original state
  for (let i = 0; i < 16; i++) {
    working[i] = (working[i] + state[i]) >>> 0;
  }

  // Serialize
  const output = new Uint8Array(64);
  for (let i = 0; i < 16; i++) {
    view.setUint32(i * 4, working[i], true);
  }
  output.set(new Uint8Array(view.buffer));

  return output;
}

export function chacha20Encrypt(key: Uint8Array, nonce: Uint8Array, plaintext: Uint8Array): Uint8Array {
  const ciphertext = new Uint8Array(plaintext.length);
  let counter = 0;
  let pos = 0;

  while (pos < plaintext.length) {
    const block = chacha20Block(key, counter, nonce);
    const remaining = plaintext.length - pos;
    const blockSize = Math.min(64, remaining);

    for (let i = 0; i < blockSize; i++) {
      ciphertext[pos + i] = plaintext[pos + i] ^ block[i];
    }

    pos += blockSize;
    counter++;
  }

  return ciphertext;
}

export function chacha20Decrypt(key: Uint8Array, nonce: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  // ChaCha20 is symmetric - encryption and decryption are the same operation
  return chacha20Encrypt(key, nonce, ciphertext);
}
