// Minimal stand-ins for the obsidian package, which only ships type definitions and cannot be imported at runtime.
// The test runner aliases 'obsidian' to this file so modules that construct Notices or check view classes can be bundled.
export class Notice {
	constructor(public sMessage: string) {
	}
}
export class FileView {
}
export class TextFileView extends FileView {
}
export class TFile {
}
