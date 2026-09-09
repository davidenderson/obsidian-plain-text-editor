import { App, TFolder, Vault } from 'obsidian';
import { MAX_NEW_FILE_ATTEMPTS, NEW_FILE_BASENAME } from './plugin-constants';

// Builds "Folder/Untitled.txt", "Folder/Untitled 1.txt", ... for a given attempt number.
export function buildCandidatePath(sFolderPath: string, sBasename: string, sExtension: string, iAttempt: number): string {
	const sDir = (sFolderPath === '/' || sFolderPath === '') ? '' : `${sFolderPath}/`;
	const sSuffix = iAttempt === 0 ? '' : ` ${iAttempt}`;
	return `${sDir}${sBasename}${sSuffix}.${sExtension}`;
}

function _findAvailablePath(oVault: Vault, oParent: TFolder, sExtension: string): string {
	for (let iAttempt = 0; iAttempt < MAX_NEW_FILE_ATTEMPTS; iAttempt++) {
		const sPath = buildCandidatePath(oParent.path, NEW_FILE_BASENAME, sExtension, iAttempt);
		if (oVault.getAbstractFileByPath(sPath) === null) {
			return sPath;
		}
	}
	throw new Error('Could not find an unused file name.');
}

// Creates an empty text file in oFolder (or the user's default new-file location) and opens it.
export async function createNewTextFile(oApp: App, oFolder: TFolder | null, sExtension: string): Promise<void> {
	const sActivePath = oApp.workspace.getActiveFile()?.path ?? '';
	const oParent = oFolder ?? oApp.fileManager.getNewFileParent(sActivePath, `${NEW_FILE_BASENAME}.${sExtension}`);
	const sPath = _findAvailablePath(oApp.vault, oParent, sExtension);
	const oFile = await oApp.vault.create(sPath, '');
	await oApp.workspace.getLeaf(false).openFile(oFile, { active: true });
}
