import { App, PluginSettingTab, SettingDefinitionItem } from 'obsidian';
import type PlainTextPlugin from './main';
import { DEFAULT_EXTENSIONS } from './plugin-constants';

export interface PlainTextSettings {
	sLineEnding: 'lf' | 'crlf';
	bShowLineNumbers: boolean;
	sExtensions: string;
}

export const DEFAULT_SETTINGS: PlainTextSettings = {
	sLineEnding: 'lf',
	bShowLineNumbers: false,
	sExtensions: DEFAULT_EXTENSIONS,
};

const EXTENSION_LIST_PATTERN = /^\s*\.?[a-z0-9]+\s*(,\s*\.?[a-z0-9]+\s*)*$/i;

// Turns "txt, .log" into ['txt', 'log'], falling back to the default when nothing is left.
export function parseExtensions(sExtensions: string): string[] {
	const aExtensions = sExtensions
		.split(',')
		.map((sPart) => sPart.trim().toLowerCase().replace(/^\./, ''))
		.filter((sPart) => sPart.length > 0);
	const aUnique = Array.from(new Set(aExtensions));
	if (aUnique.length === 0) {
		return [DEFAULT_EXTENSIONS];
	}
	return aUnique;
}

function _validateExtensions(sValue: string): string | undefined {
	if (sValue.trim() === '' || EXTENSION_LIST_PATTERN.test(sValue)) {
		return undefined;
	}
	return 'Enter a comma-separated list of extensions, for example: txt, log';
}

export class PlainTextSettingTab extends PluginSettingTab {
	private readonly oPlugin: PlainTextPlugin;

	constructor(oApp: App, oPlugin: PlainTextPlugin) {
		super(oApp, oPlugin);
		this.oPlugin = oPlugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'Line endings for new files',
				desc: 'Existing files keep the line endings they already have. Use the convert commands or the status bar indicator to change a file.',
				control: {
					type: 'dropdown',
					key: 'sLineEnding',
					defaultValue: DEFAULT_SETTINGS.sLineEnding,
					options: {
						lf: 'Unix (LF)',
						crlf: 'Windows (CRLF)',
					},
				},
			},
			{
				name: 'Show line numbers',
				control: {
					type: 'toggle',
					key: 'bShowLineNumbers',
					defaultValue: DEFAULT_SETTINGS.bShowLineNumbers,
				},
			},
			{
				name: 'File extensions',
				desc: 'Comma-separated list of extensions to open in this editor. Restart Obsidian, or disable and re-enable the plugin, after changing this.',
				control: {
					type: 'text',
					key: 'sExtensions',
					defaultValue: DEFAULT_SETTINGS.sExtensions,
					placeholder: DEFAULT_EXTENSIONS,
					validate: _validateExtensions,
				},
			},
		];
	}

	async setControlValue(sKey: string, mValue: unknown): Promise<void> {
		await super.setControlValue(sKey, mValue);
		this.oPlugin.onSettingsChanged();
	}
}
