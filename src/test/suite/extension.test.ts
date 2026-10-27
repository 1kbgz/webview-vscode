import * as assert from "assert";
import * as http from "http";
import { AddressInfo } from "net";
import * as vscode from "vscode";

function tabCount(): number {
  return vscode.window.tabGroups.all.reduce((n, g) => n + g.tabs.length, 0);
}

async function waitFor(check: () => boolean, timeout = 5000): Promise<void> {
  const end = Date.now() + timeout;
  while (!check()) {
    if (Date.now() > end) throw new Error("Timed out");
    await new Promise((r) => setTimeout(r, 100));
  }
}

suite("Extension", () => {
  test("activates and registers commands", async () => {
    const ext = vscode.extensions.getExtension("timkpaine.webview-vscode");
    assert.ok(ext);
    await ext.activate();
    const commands = await vscode.commands.getCommands(true);
    for (const id of ["webview.open", "webview.addSite", "webview.removeSite"]) {
      assert.ok(commands.includes(id), id);
    }
  });

  test("opens a site in the integrated browser and reuses its tab", async () => {
    const server = http.createServer((_req, res) => res.end("<title>hello</title>"));
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
    try {
      await vscode.commands.executeCommand("workbench.action.closeAllEditors");
      await vscode.commands.executeCommand("webview.open", { name: "Local", url });
      // Wait for the page to load so the tab has a URL to match against.
      await waitFor(() =>
        vscode.window.tabGroups.all.some((g) => g.tabs.some((t) => t.label === "hello"))
      );
      assert.strictEqual(tabCount(), 1);
      await vscode.commands.executeCommand("webview.open", { name: "Local", url: url + "other" });
      await new Promise((r) => setTimeout(r, 500));
      assert.strictEqual(tabCount(), 1);
    } finally {
      await vscode.commands.executeCommand("workbench.action.closeAllEditors");
      server.close();
    }
  });

  test("opens a URL pasted into the picker", async () => {
    const server = http.createServer((_req, res) => res.end("<title>typed</title>"));
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/`;
    try {
      await vscode.commands.executeCommand("workbench.action.closeAllEditors");
      void vscode.commands.executeCommand("webview.open");
      await new Promise((r) => setTimeout(r, 500));
      await vscode.env.clipboard.writeText(url);
      await vscode.commands.executeCommand("editor.action.clipboardPasteAction");
      await new Promise((r) => setTimeout(r, 300));
      await vscode.commands.executeCommand("workbench.action.acceptSelectedQuickOpenItem");
      await waitFor(() =>
        vscode.window.tabGroups.all.some((g) => g.tabs.some((t) => t.label === "typed"))
      );
    } finally {
      await vscode.commands.executeCommand("workbench.action.closeAllEditors");
      server.close();
    }
  });
});
