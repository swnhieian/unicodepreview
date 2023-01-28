// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "unicodepreview" is now active!');
	let currentValue = vscode.workspace.getConfiguration("UnicodePreview").get<boolean>("enabled");
	vscode.commands.executeCommand('setContext', 'unicodepreview.enabled', currentValue);

	let posAfter = function(pos: vscode.Position, anchor: vscode.Position) {
		return (pos.line > anchor.line) || (pos.line == anchor.line && pos.character >= anchor.character);
	};

	let inSelection = function(pos:vscode.Position, start: vscode.Position | undefined, end: vscode.Position | undefined): boolean {
		if (!start || !end) return false;
		return posAfter(pos, start) && posAfter(end, pos);
	};

	let unicodeToString = function(code: string): string | undefined {
		if (!code.match(/(\\?)\\u/gi)) {
			return undefined;
		}
		return unescape(code.replace(/(\\?)\\u/gi,'%u'));
	}

	let hover = vscode.languages.registerHoverProvider("*", {
		provideHover: (document, position) => {
			let currentValue = vscode.workspace.getConfiguration("UnicodePreview").get<boolean>("enabled");
			if (!currentValue) return null;
			const { line } = position;
			const lineContent = document.lineAt(line).text;
			let showString = unicodeToString(lineContent);

			const editor = vscode.window.activeTextEditor;
			const selection = editor?.selection;
			if (inSelection(position, selection?.start, selection?.end)) {
				const text = document.getText(selection);
				showString = unicodeToString(text);
			}
			if (showString) {
				const content = new vscode.MarkdownString(`<h4>Unicode Preview</h4>${showString}`);
				content.supportHtml = true;
				content.isTrusted = true;
				return new vscode.Hover(content);
			} else {
				return null;
			}
		}
	});

	let toggleCommand = (name: string) => {
		
		let currentValue = vscode.workspace.getConfiguration("UnicodePreview").get<boolean>("enabled");
		vscode.workspace.getConfiguration("UnicodePreview").update("enabled", !currentValue, vscode.ConfigurationTarget.Global);
	}

	let configurationChanged = (e: vscode.ConfigurationChangeEvent) => {
		if (e.affectsConfiguration("UnicodePreview")) {
			let currentValue = vscode.workspace.getConfiguration("UnicodePreview").get<boolean>("enabled");
			vscode.commands.executeCommand('setContext', 'unicodepreview.enabled', currentValue);
		}
	}

	context.subscriptions.push(hover);
	context.subscriptions.push(vscode.commands.registerCommand('unicodepreview.toggle', toggleCommand));
	context.subscriptions.push(vscode.commands.registerCommand('unicodepreview.enable', toggleCommand));
	context.subscriptions.push(vscode.commands.registerCommand('unicodepreview.disable', toggleCommand));

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(configurationChanged));

}

// This method is called when your extension is deactivated
export function deactivate() {}
