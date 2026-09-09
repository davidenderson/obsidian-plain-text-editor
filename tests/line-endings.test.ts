import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyLineEnding, detectLineEnding } from '../src/line-endings';

describe('detectLineEnding', () => {
	it('returns null when the text has no line breaks', () => {
		assert.equal(detectLineEnding(''), null);
		assert.equal(detectLineEnding('one line only'), null);
	});

	it('detects LF, CRLF, and lone CR', () => {
		assert.equal(detectLineEnding('a\nb\n'), 'lf');
		assert.equal(detectLineEnding('a\r\nb\r\n'), 'crlf');
		assert.equal(detectLineEnding('a\rb\r'), 'cr');
	});

	it('uses the first line break when endings are mixed', () => {
		assert.equal(detectLineEnding('a\r\nb\nc'), 'crlf');
		assert.equal(detectLineEnding('a\nb\r\nc'), 'lf');
	});

	it('treats a trailing CR at the end of the text as CR', () => {
		assert.equal(detectLineEnding('a\r'), 'cr');
	});
});

describe('applyLineEnding', () => {
	it('leaves LF text alone', () => {
		assert.equal(applyLineEnding('a\nb\n', 'lf'), 'a\nb\n');
	});

	it('converts LF to CRLF and CR', () => {
		assert.equal(applyLineEnding('a\nb\n', 'crlf'), 'a\r\nb\r\n');
		assert.equal(applyLineEnding('a\nb\n', 'cr'), 'a\rb\r');
	});

	it('normalizes mixed endings before converting', () => {
		assert.equal(applyLineEnding('a\r\nb\nc\rd', 'lf'), 'a\nb\nc\nd');
		assert.equal(applyLineEnding('a\r\nb\nc\rd', 'crlf'), 'a\r\nb\r\nc\r\nd');
	});

	it('never doubles carriage returns on repeated conversion', () => {
		const sOnce = applyLineEnding('a\nb', 'crlf');
		assert.equal(applyLineEnding(sOnce, 'crlf'), 'a\r\nb');
	});
});
