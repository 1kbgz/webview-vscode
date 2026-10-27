# Webview for VS Code

[![CI](https://github.com/1kbgz/webview-vscode/actions/workflows/ci.yaml/badge.svg)](https://github.com/1kbgz/webview-vscode/actions/workflows/ci.yaml)

Keep a list of web apps and open them in VS Code's integrated browser. This is useful for self-hosted app platforms like [Sandstorm](https://sandstorm.io), where you can keep apps open next to your code.

## Usage

Sites are listed in the **Webview Sites** view in the Explorer. Click a site to open it. Use the `+` button to add a site and the trash icon to remove one. The same actions are available from the Command Palette:

- `Webview: Open Site`
- `Webview: Add Site`
- `Webview: Remove Site`

If a site is already open, clicking it again focuses that tab.

## Configuration

Sites are stored in user settings under `webview.sites`:

```json
"webview.sites": [
  { "name": "Sandstorm", "url": "https://example.sandcats.io" },
  { "name": "Docs", "url": "https://docs.example.com" }
]
```

## How it works

Sites open in VS Code's integrated browser, a real Chromium view in an editor tab. It isn't an iframe, so sites that refuse to be framed still load, and logins and cookies behave as they would in a normal browser.

The integrated browser handles new tabs and windows itself. `target="_blank"` links and Ctrl/Cmd/middle-clicks open as new browser tabs inside VS Code. Popup windows also open inside VS Code if they follow a click. The `workbench.browser.newTabPlacement` setting controls where new tabs go.

The extension opens sites with VS Code's internal `workbench.action.browser.open` command, the same one the built-in Simple Browser uses. On VS Code versions without the integrated browser, sites open in your external browser instead.

## Development

```bash
npm install
npm run compile
npm run lint
npm test          # integration tests in a downloaded VS Code
npm run package
```

If you run `npm test` from a terminal inside VS Code, unset `ELECTRON_RUN_AS_NODE` first.

## License

Apache 2.0
