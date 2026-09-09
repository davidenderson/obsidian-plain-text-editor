import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { containsNul, decodeUtf8Strict, isEditableText } from '../src/text-encoding';

function _bytes(aValues: number[]): ArrayBuffer {
	return new Uint8Array(aValues).buffer;
}

describe('decodeUtf8Strict', () => {
	it('decodes valid UTF-8 including multibyte characters', () => {
		assert.equal(decodeUtf8Strict(_bytes([0x68, 0x69, 0xc3, 0xbc])), 'hiü');
	});

	it('returns null for a Latin-1 byte that is not valid UTF-8', () => {
		assert.equal(decodeUtf8Strict(_bytes([0x68, 0xfc, 0x69])), null);
	});

	it('strips a leading byte order mark like the vault does', () => {
		assert.equal(decodeUtf8Strict(_bytes([0xef, 0xbb, 0xbf, 0x41])), 'A');
	});
});

describe('containsNul', () => {
	it('flags NUL characters', () => {
		assert.equal(containsNul('a\0b'), true);
		assert.equal(containsNul('ab'), false);
	});
});

describe('isEditableText', () => {
	it('accepts plain ASCII and UTF-8', () => {
		assert.equal(isEditableText(_bytes([0x61, 0x0a, 0xe2, 0x9c, 0x93])), true);
	});

	it('rejects invalid UTF-8', () => {
		assert.equal(isEditableText(_bytes([0xff, 0xfe, 0x41])), false);
	});

	it('rejects UTF-16 text because of its NUL bytes', () => {
		assert.equal(isEditableText(_bytes([0x41, 0x00, 0x42, 0x00])), false);
	});

	it('accepts an empty file', () => {
		assert.equal(isEditableText(_bytes([])), true);
	});
});
