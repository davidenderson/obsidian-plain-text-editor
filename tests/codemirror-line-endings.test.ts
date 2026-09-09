// Confirms the CodeMirror behavior the view relies on: documents are normalized to LF internally.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from '@codemirror/state';

describe('CodeMirror line handling', () => {
	it('splits CRLF and lone CR into lines and joins with LF', () => {
		const oState = EditorState.create({ doc: 'a\r\nb\rc\nd' });
		assert.equal(oState.doc.lines, 4);
		assert.equal(oState.doc.toString(), 'a\nb\nc\nd');
		assert.equal(oState.lineBreak, '\n');
	});

	it('inserts LF for new lines when no line separator facet is configured', () => {
		const oState = EditorState.create({ doc: 'ab' });
		const oTransaction = oState.update(oState.replaceSelection(oState.lineBreak));
		assert.equal(oTransaction.state.doc.toString(), '\nab');
	});
});
