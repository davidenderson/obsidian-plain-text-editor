// Pure helpers for detecting and applying line endings. The editor always holds LF internally.
export type LineEndingKind = 'lf' | 'crlf' | 'cr';

export const LINE_ENDING_STRINGS: Record<LineEndingKind, string> = {
	lf: '\n',
	crlf: '\r\n',
	cr: '\r',
};

export const LINE_ENDING_LABELS: Record<LineEndingKind, string> = {
	lf: 'LF',
	crlf: 'CRLF',
	cr: 'CR',
};

// Returns the kind of the first line break found, or null when the text has no line breaks.
export function detectLineEnding(sText: string): LineEndingKind | null {
	const iIndex = sText.search(/\r|\n/);
	if (iIndex === -1) {
		return null;
	}
	if (sText.charAt(iIndex) === '\n') {
		return 'lf';
	}
	if (sText.charAt(iIndex + 1) === '\n') {
		return 'crlf';
	}
	return 'cr';
}

// Rewrites every line break in sText to the requested kind.
export function applyLineEnding(sText: string, sKind: LineEndingKind): string {
	const sNormalized = sText.replace(/\r\n?|\n/g, '\n');
	if (sKind === 'lf') {
		return sNormalized;
	}
	return sNormalized.split('\n').join(LINE_ENDING_STRINGS[sKind]);
}
