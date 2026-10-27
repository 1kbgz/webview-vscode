import * as vscode from "vscode";

// Internal VS Code command (same one the built-in Simple Browser uses).
const BROWSER_OPEN = "workbench.action.browser.open";

interface Site {
  name: string;
  url: string;
}

function getSites(): Site[] {
  return vscode.workspace.getConfiguration("webview").get<Site[]>("sites", []);
}

function saveSites(sites: Site[]): Thenable<void> {
  return vscode.workspace
    .getConfiguration("webview")
    .update("sites", sites, vscode.ConfigurationTarget.Global);
}

class SitesProvider implements vscode.TreeDataProvider<Site> {
  private readonly changed = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.changed.event;

  refresh(): void {
    this.changed.fire();
  }

  getTreeItem(site: Site): vscode.TreeItem {
    const item = new vscode.TreeItem(site.name);
    item.description = site.url;
    item.tooltip = site.url;
    item.contextValue = "site";
    item.command = { command: "webview.open", title: "Open", arguments: [site] };
    return item;
  }

  getChildren(): Site[] {
    return getSites();
  }
}

async function pickSite(placeHolder: string): Promise<Site | undefined> {
  const picked = await vscode.window.showQuickPick(
    getSites().map((site) => ({ label: site.name, description: site.url, site })),
    { placeHolder }
  );
  return picked?.site;
}

async function openSite(site: Site): Promise<void> {
  const commands = await vscode.commands.getCommands(true);
  if (!commands.includes(BROWSER_OPEN)) {
    await vscode.env.openExternal(vscode.Uri.parse(site.url));
    return;
  }
  // Focus an existing integrated browser tab on the same origin instead of opening a duplicate.
  // The filter's path is a glob; a bare origin would only match "/".
  await vscode.commands.executeCommand(BROWSER_OPEN, {
    url: site.url,
    reuseUrlFilter: `${new URL(site.url).origin}/**`,
  });
}

export function activate(context: vscode.ExtensionContext): void {
  const provider = new SitesProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("webview.sites", provider),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("webview.sites")) provider.refresh();
    }),
    vscode.commands.registerCommand("webview.open", async (site?: Site) => {
      site ??= await pickSite("Site to open");
      if (site) await openSite(site);
    }),
    vscode.commands.registerCommand("webview.addSite", async () => {
      const url = await vscode.window.showInputBox({
        prompt: "Site URL",
        placeHolder: "https://example.com",
        validateInput: (value) => (/^https?:\/\/\S+$/.test(value) ? undefined : "Enter an http(s) URL"),
      });
      if (!url) return;
      const name = await vscode.window.showInputBox({
        prompt: "Site name",
        value: new URL(url).host,
      });
      if (!name) return;
      await saveSites([...getSites(), { name, url }]);
    }),
    vscode.commands.registerCommand("webview.removeSite", async (site?: Site) => {
      site ??= await pickSite("Site to remove");
      if (!site) return;
      const removed = site;
      await saveSites(getSites().filter((s) => s.name !== removed.name || s.url !== removed.url));
    })
  );
}

export function deactivate(): void {}
