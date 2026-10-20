import { describe, expect, it } from 'vitest';
import { createSalt, hashPasscode, isValidPasscode, sha256Hex, verifyPasscode } from './passcode';

describe('sha256Hex (official test vectors)', () => {
  it('hashes known inputs correctly', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
    // Multi-byte (Japanese) text and a message longer than one 64-byte block
    expect(sha256Hex('あ'.repeat(40))).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('passcode', () => {
  it('accepts 4–8 digits only', () => {
    expect(isValidPasscode('1234')).toBe(true);
    expect(isValidPasscode('12345678')).toBe(true);
    expect(isValidPasscode('123')).toBe(false);
    expect(isValidPasscode('123456789')).toBe(false);
    expect(isValidPasscode('12a4')).toBe(false);
  });

  it('verifies the right passcode and rejects others', () => {
    const salt = createSalt();
    const hash = hashPasscode('2580', salt);
    expect(hash).not.toContain('2580');
    expect(verifyPasscode('2580', salt, hash)).toBe(true);
    expect(verifyPasscode('2581', salt, hash)).toBe(false);
    expect(verifyPasscode('', salt, hash)).toBe(false);
  });

  it('uses the salt (same passcode, different salt → different hash)', () => {
    expect(hashPasscode('1234', createSalt())).not.toBe(hashPasscode('1234', createSalt()));
  });
});
