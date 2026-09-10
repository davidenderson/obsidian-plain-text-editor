#!/usr/bin/env bash
# Copies the built plugin into an Obsidian vault so an iPad or iPhone picks it up.
# Usage: npm run deploy:ios -- [--create] <vault name in iCloud Drive | full path to a vault>
# The vault name can also come from the OBSIDIAN_IOS_VAULT environment variable.
# --create makes the vault folder if it does not exist; a folder in iCloud Drive appears as a vault on every device.
set -euo pipefail

ICLOUD_OBSIDIAN_ROOT="${OBSIDIAN_ICLOUD_ROOT:-$HOME/Library/Mobile Documents/iCloud~md~obsidian/Documents}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE_FILES=(main.js manifest.json styles.css)

list_icloud_vaults() {
	if [ ! -d "$ICLOUD_OBSIDIAN_ROOT" ]; then
		echo "No Obsidian folder found in iCloud Drive. Turn on iCloud Drive for Obsidian on this Mac and on the device."
		return
	fi
	local vaults
	vaults="$(find "$ICLOUD_OBSIDIAN_ROOT" -mindepth 1 -maxdepth 1 -type d -not -name '.*' -exec basename {} \;)"
	if [ -z "$vaults" ]; then
		echo "No vaults exist in iCloud Drive yet. Create one with:"
		echo "  npm run deploy:ios -- --create \"Plugin Test\""
		echo "or on the device with Create new vault > Store in iCloud, then wait for it to sync to this Mac."
		return
	fi
	echo "Vaults in iCloud Drive:"
	echo "$vaults" | sed 's/^/  /'
}

resolve_vault_dir() {
	local vault="$1"
	case "$vault" in
		*/*)
			echo "$vault"
			;;
		*)
			echo "$ICLOUD_OBSIDIAN_ROOT/$vault"
			;;
	esac
}

main() {
	local create=0
	if [ "${1:-}" = "--create" ]; then
		create=1
		shift
	fi
	local vault="${1:-${OBSIDIAN_IOS_VAULT:-}}"
	if [ -z "$vault" ]; then
		echo "Usage: npm run deploy:ios -- [--create] <vault name or path>" >&2
		list_icloud_vaults >&2
		exit 1
	fi

	local vault_dir
	vault_dir="$(resolve_vault_dir "$vault")"
	if [ ! -d "$vault_dir" ]; then
		if [ "$create" = "1" ]; then
			mkdir -p "$vault_dir"
			echo "Created vault folder $vault_dir"
			echo "It appears in Obsidian's vault list on each device once iCloud has synced it."
		else
			echo "Vault not found: $vault_dir" >&2
			list_icloud_vaults >&2
			exit 1
		fi
	fi

	cd "$PROJECT_ROOT"
	local plugin_id
	plugin_id="$(node -p "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8')).id")"
	local release_file
	for release_file in "${RELEASE_FILES[@]}"; do
		if [ ! -f "$release_file" ]; then
			echo "Missing $release_file. Run npm run build first." >&2
			exit 1
		fi
	done

	local target_dir="$vault_dir/.obsidian/plugins/$plugin_id"
	mkdir -p "$target_dir"
	cp "${RELEASE_FILES[@]}" "$target_dir/"
	echo "Copied ${RELEASE_FILES[*]} to $target_dir"
	echo "On the device: wait for iCloud to sync, then enable the plugin under Settings > Community plugins."
}

main "$@"
