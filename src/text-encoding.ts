// Pure helpers for deciding whether a file's bytes are safe to edit as UTF-8 text.

// Returns the decoded text, or null when the bytes are not valid UTF-8.
export function decodeUtf8Strict(oBuffer: ArrayBuffer): string | null {
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(oBuffer);
	} catch {
		return null;
	}
}

// Text with NUL bytes is binary or UTF-16, which vault.read() would silently mangle on save.
export function containsNul(sText: string): boolean {
	return sText.includes('\0');
}

export function isEditableText(oBuffer: ArrayBuffer): boolean {
	const sText = decodeUtf8Strict(oBuffer);
	if (sText === null) {
		return false;
	}
	return !containsNul(sText);
}
