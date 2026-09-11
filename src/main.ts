import { Menu, Notice, Plugin, TAbstractFile, TFile, TFolder } from 'obsidian';
import { PlainTextView } from './plain-text-view';
import { DEFAULT_SETTINGS, parseExtensions, PlainTextSettings, PlainTextSettingTab } from './settings';
import { createNewTextFile } from './new-file';
import { changeFileExtension } from './change-extension';
import { LineEndingKind } from './line-endings';
import { MARKDOWN_EXTENSION, PLAIN_TEXT_EXTENSION, VIEW_ICON, VIEW_TYPE } from './plugin-constants';

type ConversionTarget = typeof PLAIN_TEXT_EXTENSION | typeof MARKDOWN_EXTENSION;

const CONVERT_LABELS: Record<ConversionTarget, string> = {
	[PLAIN_TEXT_EXTENSION]: 'Convert to plain text file',
	[MARKDOWN_EXTENSION]: 'Convert to markdown note',
};
const CONVERT_ICONS: Record<ConversionTarget, string> = {
	[PLAIN_TEXT_EXTENSION]: VIEW_ICON,
	[MARKDOWN_EXTENSION]: 'file-type',
};

export default class PlainTextPlugin extends Plugin {
	settings: PlainTextSettings = { ...DEFAULT_SETTINGS };
	private eStatusBar: HTMLElement | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.registerView(VIEW_TYPE, (oLeaf) => new PlainTextView(oLeaf, this));
		this._registerExtensions();
		this.addSettingTab(new PlainTextSettingTab(this.app, this));
		this._registerCommands();
		this._registerFileMenu();
		this._registerStatusBar();
		this.addRibbonIcon(VIEW_ICON, 'Create new text file', () => {
			void createNewTextFile(this.app, null, this.getPrimaryExtension());
		});
	}

	async onExternalSettingsChange(): Promise<void> {
		await this.loadSettings();
		this.onSettingsChanged();
	}

	async loadSettings(): Promise<void> {
		const oStored = (await this.loadData()) as Partial<PlainTextSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, oStored);
	}

	getExtensions(): string[] {
		return parseExtensions(this.settings.sExtensions);
	}

	getPrimaryExtension(): string {
		return this.getExtensions()[0] ?? DEFAULT_SETTINGS.sExtensions;
	}

	onSettingsChanged(): void {
		for (const oLeaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
			if (oLeaf.view instanceof PlainTextView) {
				oLeaf.view.applySettings();
			}
		}
		this.updateStatusBar();
	}

	updateStatusBar(): void {
		if (this.eStatusBar === null) {
			return;
		}
		const oView = this.app.workspace.getActiveViewOfType(PlainTextView);
		if (oView === null) {
			this.eStatusBar.hide();
			return;
		}
		this.eStatusBar.setText(oView.getStatusText());
		this.eStatusBar.show();
	}

	// Register one extension at a time so a conflict on one does not block the others.
	private _registerExtensions(): void {
		const aFailed: string[] = [];
		for (const sExtension of this.getExtensions()) {
			try {
				this.registerExtensions([sExtension], VIEW_TYPE);
			} catch (e) {
				console.error(e);
				aFailed.push(sExtension);
			}
		}
		if (aFailed.length > 0) {
			new Notice(`Plain Text Editor could not claim .${aFailed.join(', .')} because another plugin already handles it.`);
		}
	}

	private _registerCommands(): void {
		this.addCommand({
			id: 'create-new-text-file',
			name: 'Create new text file',
			callback: () => {
				void createNewTextFile(this.app, null, this.getPrimaryExtension());
			},
		});
		this.addCommand({
			id: 'find-and-replace',
			name: 'Find and replace',
			checkCallback: (bChecking) => {
				const oView = this.app.workspace.getActiveViewOfType(PlainTextView);
				if (oView === null) {
					return false;
				}
				if (!bChecking) {
					oView.openSearch();
				}
				return true;
			},
		});
		this.addCommand({
			id: 'convert-line-endings-to-lf',
			name: 'Convert line endings to Unix (LF)',
			checkCallback: (bChecking) => this._convertActiveView('lf', bChecking),
		});
		this.addCommand({
			id: 'convert-line-endings-to-crlf',
			name: 'Convert line endings to Windows (CRLF)',
			checkCallback: (bChecking) => this._convertActiveView('crlf', bChecking),
		});
		this.addCommand({
			id: 'convert-to-plain-text-file',
			name: 'Convert note to plain text file (.txt)',
			checkCallback: (bChecking) => this._convertActiveFile(PLAIN_TEXT_EXTENSION, bChecking),
		});
		this.addCommand({
			id: 'convert-to-markdown-note',
			name: 'Convert plain text file to markdown note (.md)',
			checkCallback: (bChecking) => this._convertActiveFile(MARKDOWN_EXTENSION, bChecking),
		});
	}

	// Notes convert to .txt, and any file this plugin handles converts to .md.
	private _conversionTargetFor(oFile: TAbstractFile): ConversionTarget | null {
		if (!(oFile instanceof TFile)) {
			return null;
		}
		if (oFile.extension === MARKDOWN_EXTENSION) {
			return PLAIN_TEXT_EXTENSION;
		}
		if (this.getExtensions().includes(oFile.extension)) {
			return MARKDOWN_EXTENSION;
		}
		return null;
	}

	private _convertActiveFile(sTarget: ConversionTarget, bChecking: boolean): boolean {
		const oFile = this.app.workspace.getActiveFile();
		if (oFile === null || this._conversionTargetFor(oFile) !== sTarget) {
			return false;
		}
		if (!bChecking) {
			void changeFileExtension(this.app, oFile, sTarget);
		}
		return true;
	}

	private _convertActiveView(sKind: LineEndingKind, bChecking: boolean): boolean {
		const oView = this.app.workspace.getActiveViewOfType(PlainTextView);
		if (oView === null || oView.isReadOnly()) {
			return false;
		}
		if (!bChecking) {
			oView.setLineEnding(sKind);
		}
		return true;
	}

	private _registerFileMenu(): void {
		this.registerEvent(this.app.workspace.on('file-menu', (oMenu: Menu, oFile: TAbstractFile) => {
			if (oFile instanceof TFolder) {
				oMenu.addItem((oItem) => {
					oItem.setTitle('New text file')
						.setIcon('file-plus')
						.onClick(() => {
							void createNewTextFile(this.app, oFile, this.getPrimaryExtension());
						});
				});
				return;
			}
			const sTarget = this._conversionTargetFor(oFile);
			if (sTarget === null || !(oFile instanceof TFile)) {
				return;
			}
			oMenu.addItem((oItem) => {
				oItem.setTitle(CONVERT_LABELS[sTarget])
					.setIcon(CONVERT_ICONS[sTarget])
					.onClick(() => {
						void changeFileExtension(this.app, oFile, sTarget);
					});
			});
		}));
	}

	private _registerStatusBar(): void {
		const eStatusBar = this.addStatusBarItem();
		eStatusBar.addClass('c-plain-text-editor-status');
		this.registerDomEvent(eStatusBar, 'click', (evMouse: MouseEvent) => {
			this._showLineEndingMenu(evMouse);
		});
		this.eStatusBar = eStatusBar;
		this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
			this.updateStatusBar();
		}));
		this.updateStatusBar();
	}

	private _showLineEndingMenu(evMouse: MouseEvent): void {
		const oView = this.app.workspace.getActiveViewOfType(PlainTextView);
		if (oView === null || oView.isReadOnly()) {
			return;
		}
		const oMenu = new Menu();
		oMenu.addItem((oItem) => {
			oItem.setTitle('Convert line endings to Unix (LF)').onClick(() => {
				oView.setLineEnding('lf');
			});
		});
		oMenu.addItem((oItem) => {
			oItem.setTitle('Convert line endings to Windows (CRLF)').onClick(() => {
				oView.setLineEnding('crlf');
			});
		});
		oMenu.showAtMouseEvent(evMouse);
	}
}
