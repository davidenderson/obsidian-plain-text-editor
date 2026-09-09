import { Scope, TextFileView, TFile, WorkspaceLeaf } from 'obsidian';
import { Compartment, EditorState, Extension } from '@codemirror/state';
import { drawSelection, dropCursor, EditorView, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers, ViewUpdate } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { findNext, findPrevious, openSearchPanel, search, searchKeymap } from '@codemirror/search';
import { indentUnit } from '@codemirror/language';
import type PlainTextPlugin from './main';
import { applyLineEnding, detectLineEnding, LINE_ENDING_LABELS, LineEndingKind } from './line-endings';
import { isEditableText } from './text-encoding';
import { READ_ONLY_MESSAGE, VIEW_ICON, VIEW_TYPE } from './plugin-constants';

interface VaultWithConfig {
	getConfig?: (sKey: string) => unknown;
}

export class PlainTextView extends TextFileView {
	private readonly oPlugin: PlainTextPlugin;
	private readonly oEditor: EditorView;
	private readonly eBanner: HTMLElement;
	private readonly oLineNumbersCompartment = new Compartment();
	private readonly oReadOnlyCompartment = new Compartment();
	private sLoadedData = '';
	private sLineEnding: LineEndingKind = 'lf';
	private bModified = false;
	private bReadOnly = false;
	private bSuppressSave = false;

	constructor(oLeaf: WorkspaceLeaf, oPlugin: PlainTextPlugin) {
		super(oLeaf);
		this.oPlugin = oPlugin;
		this.contentEl.addClass('c-plain-text-editor');
		this.eBanner = this.contentEl.createDiv({ cls: 'c-plain-text-editor__banner', text: READ_ONLY_MESSAGE });
		this.eBanner.hide();
		const eHost = this.contentEl.createDiv({ cls: 'c-plain-text-editor__editor' });
		this.oEditor = new EditorView({ state: this._createState(''), parent: eHost });
		this._registerHotkeys();
	}

	getViewType(): string {
		return VIEW_TYPE;
	}

	getIcon(): string {
		return VIEW_ICON;
	}

	canAcceptExtension(sExtension: string): boolean {
		return this.oPlugin.getExtensions().includes(sExtension);
	}

	async onLoadFile(oFile: TFile): Promise<void> {
		this.bReadOnly = !isEditableText(await this.app.vault.readBinary(oFile));
		await super.onLoadFile(oFile);
		this._applyReadOnly();
		if (this.app.workspace.getActiveViewOfType(PlainTextView) === this) {
			this.oEditor.focus();
		}
	}

	onClose(): Promise<void> {
		this.oEditor.destroy();
		return Promise.resolve();
	}

	// Untouched files are returned verbatim so opening and closing never rewrites them.
	getViewData(): string {
		if (!this.bModified || this.bReadOnly) {
			return this.sLoadedData;
		}
		return applyLineEnding(this.oEditor.state.doc.toString(), this.sLineEnding);
	}

	setViewData(sData: string, bClear: boolean): void {
		this.sLoadedData = sData;
		this.bModified = false;
		this.sLineEnding = detectLineEnding(sData) ?? this.oPlugin.settings.sLineEnding;
		this._replaceDocument(sData, bClear);
		this.oPlugin.updateStatusBar();
	}

	clear(): void {
		this.sLoadedData = '';
		this.bModified = false;
		this._replaceDocument('', true);
	}

	isReadOnly(): boolean {
		return this.bReadOnly;
	}

	getStatusText(): string {
		const sLabel = LINE_ENDING_LABELS[this.sLineEnding];
		return this.bReadOnly ? `${sLabel} · Read-only` : sLabel;
	}

	// Marks the file modified so the next save rewrites it with the chosen line endings.
	setLineEnding(sKind: LineEndingKind): void {
		if (this.bReadOnly || this.sLineEnding === sKind) {
			return;
		}
		this.sLineEnding = sKind;
		this.bModified = true;
		this.requestSave();
		this.oPlugin.updateStatusBar();
	}

	// Exposed as a command so touch devices, which have no Cmd+F, can reach the search panel.
	openSearch(): void {
		openSearchPanel(this.oEditor);
	}

	applySettings(): void {
		this.oEditor.dispatch({
			effects: this.oLineNumbersCompartment.reconfigure(this._lineNumbersExtension()),
		});
	}

	private _replaceDocument(sData: string, bClear: boolean): void {
		this.bSuppressSave = true;
		try {
			if (bClear) {
				this.oEditor.setState(this._createState(sData));
			} else {
				this.oEditor.dispatch({
					changes: { from: 0, to: this.oEditor.state.doc.length, insert: sData },
				});
			}
		} finally {
			this.bSuppressSave = false;
		}
	}

	private _createState(sDoc: string): EditorState {
		return EditorState.create({
			doc: sDoc,
			extensions: [
				history(),
				drawSelection(),
				dropCursor(),
				highlightSpecialChars(),
				indentUnit.of('\t'),
				EditorView.lineWrapping,
				EditorView.contentAttributes.of({ spellcheck: this._isSpellcheckEnabled() ? 'true' : 'false' }),
				this.oLineNumbersCompartment.of(this._lineNumbersExtension()),
				this.oReadOnlyCompartment.of(this._readOnlyExtension()),
				search({ top: true }),
				keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap, ...searchKeymap]),
				EditorView.updateListener.of((oUpdate: ViewUpdate) => {
					this._onEditorUpdate(oUpdate);
				}),
			],
		});
	}

	private _lineNumbersExtension(): Extension {
		if (!this.oPlugin.settings.bShowLineNumbers) {
			return [];
		}
		return [lineNumbers(), highlightActiveLineGutter()];
	}

	private _readOnlyExtension(): Extension {
		if (!this.bReadOnly) {
			return [];
		}
		return [EditorState.readOnly.of(true), EditorView.editable.of(false)];
	}

	private _applyReadOnly(): void {
		this.oEditor.dispatch({
			effects: this.oReadOnlyCompartment.reconfigure(this._readOnlyExtension()),
		});
		this.eBanner.toggle(this.bReadOnly);
	}

	private _onEditorUpdate(oUpdate: ViewUpdate): void {
		if (!oUpdate.docChanged || this.bSuppressSave || this.bReadOnly) {
			return;
		}
		this.bModified = true;
		this.requestSave();
	}

	// Obsidian's own hotkeys (search, graph view) win over CodeMirror's keymap unless the view claims them.
	private _registerHotkeys(): void {
		const oScope = new Scope(this.app.scope);
		oScope.register(['Mod'], 'f', () => {
			openSearchPanel(this.oEditor);
			return false;
		});
		oScope.register(['Mod'], 'g', () => {
			findNext(this.oEditor);
			return false;
		});
		oScope.register(['Mod', 'Shift'], 'g', () => {
			findPrevious(this.oEditor);
			return false;
		});
		this.scope = oScope;
	}

	// Mirrors Obsidian's own spellcheck setting (on by default); the getter is not in the public API, so guard it.
	private _isSpellcheckEnabled(): boolean {
		const oVault = this.app.vault as unknown as VaultWithConfig;
		if (typeof oVault.getConfig !== 'function') {
			return true;
		}
		return oVault.getConfig('spellcheck') !== false;
	}
}
