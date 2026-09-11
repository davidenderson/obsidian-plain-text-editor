import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildRenamedPath } from '../src/change-extension';

describe('buildRenamedPath', () => {
	it('replaces the extension of a file in a folder', () => {
		assert.equal(buildRenamedPath('Notes/todo.md', 'txt'), 'Notes/todo.txt');
	});

	it('replaces the extension of a file at the vault root', () => {
		assert.equal(buildRenamedPath('todo.txt', 'md'), 'todo.md');
	});

	it('only replaces the last extension', () => {
		assert.equal(buildRenamedPath('archive.tar.gz', 'txt'), 'archive.tar.txt');
	});

	it('appends an extension when the file has none', () => {
		assert.equal(buildRenamedPath('Notes/README', 'md'), 'Notes/README.md');
	});

	it('does not treat a dotfile name or a dotted folder as an extension', () => {
		assert.equal(buildRenamedPath('.hidden', 'txt'), '.hidden.txt');
		assert.equal(buildRenamedPath('Notes/.hidden', 'txt'), 'Notes/.hidden.txt');
		assert.equal(buildRenamedPath('v1.2/todo', 'txt'), 'v1.2/todo.txt');
	});
});
