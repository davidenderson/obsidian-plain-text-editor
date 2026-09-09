import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildCandidatePath } from '../src/new-file';

describe('buildCandidatePath', () => {
	it('places files at the vault root without a leading slash', () => {
		assert.equal(buildCandidatePath('/', 'Untitled', 'txt', 0), 'Untitled.txt');
		assert.equal(buildCandidatePath('', 'Untitled', 'txt', 0), 'Untitled.txt');
	});

	it('joins folder paths with a single slash', () => {
		assert.equal(buildCandidatePath('Notes/Daily', 'Untitled', 'txt', 0), 'Notes/Daily/Untitled.txt');
	});

	it('numbers later attempts', () => {
		assert.equal(buildCandidatePath('Notes', 'Untitled', 'log', 3), 'Notes/Untitled 3.log');
	});
});
