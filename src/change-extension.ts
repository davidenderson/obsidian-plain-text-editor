import { App, FileView, Notice, TextFileView, TFile, WorkspaceLeaf } from 'obsidian';

// Swaps the extension on a vault path: "Notes/todo.md" + "txt" -> "Notes/todo.txt".
export function buildRenamedPath(sPath: string, sNewExtension: string): string {
	const iSlash = sPath.lastIndexOf('/');
	const iDot = sPath.lastIndexOf('.');
	const sStem = iDot > iSlash + 1 ? sPath.slice(0, iDot) : sPath;
	return `${sStem}.${sNewExtension}`;
}

function _findLeavesShowing(oApp: App, oFile: TFile): WorkspaceLeaf[] {
	const aLeaves: WorkspaceLeaf[] = [];
	oApp.workspace.iterateAllLeaves((oLeaf) => {
		if (oLeaf.view instanceof FileView && oLeaf.view.file === oFile) {
			aLeaves.push(oLeaf);
		}
	});
	return aLeaves;
}

// Renames oFile to sNewExtension, leaving its contents alone, then reopens it in the editor for that extension.
export async function changeFileExtension(oApp: App, oFile: TFile, sNewExtension: string): Promise<void> {
	if (oFile.extension === sNewExtension) {
		return;
	}
	const sNewPath = buildRenamedPath(oFile.path, sNewExtension);
	if (oApp.vault.getAbstractFileByPath(sNewPath) !== null) {
		new Notice(`Cannot rename: ${sNewPath} already exists.`);
		return;
	}
	const aLeaves = _findLeavesShowing(oApp, oFile);
	for (const oLeaf of aLeaves) {
		if (oLeaf.view instanceof TextFileView) {
			await oLeaf.view.save();
		}
	}
	try {
		await oApp.fileManager.renameFile(oFile, sNewPath);
	} catch (e) {
		console.error(e);
		new Notice(`Could not rename ${oFile.name}.`);
		return;
	}
	for (const oLeaf of aLeaves) {
		await oLeaf.openFile(oFile);
	}
}
