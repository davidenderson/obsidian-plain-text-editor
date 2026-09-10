# Plain Text Editor

A minimal editor for `.txt` files inside Obsidian. No frills: it opens plain text files in a tab, saves them as you type, and stays out of the way.

## Features

- **Line endings are preserved.** Each file keeps the line endings it already has (LF, CRLF, or CR). The setting only decides what new files get, and defaults to Unix (LF). Opening and closing a file never rewrites it.
- **Convert when you want to.** Two commands, and a click on the status bar indicator, convert the current file to LF or CRLF.
- **Optional line numbers.** Off by default; the toggle applies to open files immediately.
- **Your monospace font.** The editor uses the monospace font from Settings, Appearance, Font, which falls back to whatever monospace font your platform has. No font is bundled.
- **Follows your theme.** Colors, font size, and light or dark mode come from Obsidian's own CSS variables, so community themes and CSS snippets apply automatically.
- **Safe with non-text files.** Files that are not valid UTF-8, such as legacy Windows "ANSI" or UTF-16 files, open read-only with a warning instead of being corrupted on save.
- **Works on mobile.** No desktop-only APIs are used.

The editor is CodeMirror 6, the same editor Obsidian itself uses, so undo history, search and replace, and touch input behave the way they do in notes.

## Usage

- Open any `.txt` file from the file explorer, the quick switcher, or a `[[wikilink]]`.
- Tap or click the **Create new text file** button. On desktop it is in the strip of icons on the left edge of the window; on mobile it is in the menu behind the button at the bottom-right corner. You can also right-click a folder and choose **New text file**, or run **Create new text file** from the command palette.
- Press `Ctrl/Cmd+F` for search and replace, `Ctrl/Cmd+G` and `Ctrl/Cmd+Shift+G` for next and previous match. On mobile, run **Find and replace** from the command palette, or add it to the mobile toolbar.
- The status bar shows the current file's line endings. Click it to convert. On mobile, use the **Convert line endings** commands instead.

## Settings

| Setting | Default | Notes |
| --- | --- | --- |
| Line endings for new files | Unix (LF) | Existing files keep their own line endings. |
| Show line numbers | Off | Applies to open files immediately. |
| File extensions | `txt` | Comma-separated. Restart Obsidian, or disable and re-enable the plugin, after changing it. |

If another plugin already handles one of the configured extensions, this plugin shows a notice and leaves that extension to the other plugin.

## Installation

Until the plugin is listed in the community directory, install it manually or with [BRAT](https://github.com/TfTHacker/obsidian42-brat):

1. Download `main.js`, `manifest.json`, and `styles.css` from the latest release.
2. Copy them into `<your vault>/.obsidian/plugins/plain-text-editor/`.
3. Reload Obsidian and enable the plugin under Settings, Community plugins.

## Development

```
npm install
npm run dev      # rebuilds main.js on every change
npm run build    # type-checks and produces the production main.js
npm test         # unit tests for line endings, encoding, and file naming
npm run lint     # the same checks the community directory runs
```

Develop in a separate vault, not your main one. Clone or symlink this folder into `<dev vault>/.obsidian/plugins/plain-text-editor/`.

### Testing on iPad and iPhone

The plugin has to reach the device through a vault stored in iCloud Drive. Create that vault once, from the Mac:

```
npm run deploy:ios -- --create "Plugin Test"
```

Then copy each new build into it:

```
npm run deploy:ios -- "Plugin Test"
```

The argument is the vault's name in iCloud Drive, or a full path to any vault folder. It can also be set once with the `OBSIDIAN_IOS_VAULT` environment variable. Running the command with no argument lists the vaults it can see. Wait for iCloud to sync, open the vault on the device, and enable the plugin under Settings, Community plugins. To see console errors on the device, connect it by USB and use Safari's Develop menu on the Mac (iOS 16.4 or later).

## License

MIT
