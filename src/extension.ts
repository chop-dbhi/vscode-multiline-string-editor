'use strict';

import * as vscode from 'vscode';
import { MemFS } from './fileSystemProvider';

const MEM_FS_SCHEMA = 'memfs_sje';
const MEM_FS_FILE = `${MEM_FS_SCHEMA}:/stringified.json`;

interface EditTarget {
	range: vscode.Range;
	body: string;
}

interface EditContext {
	editor?: vscode.TextEditor;
	range?: vscode.Range;
}

function positionEquals(a: vscode.Position, b: vscode.Position) {
	return a.line === b.line && a.character === b.character;
}

function getTarget(editor: vscode.TextEditor): EditTarget | null {
	const document = editor.document;
	const selection = editor.selection;

	const line = document.lineAt(selection.start.line);
	const reversedLine = line.text.split('').reverse().join('');

	if (positionEquals(selection.start, selection.end)) {
		const regex = /"(.*?)"(?!\\)/g;

		let a;
		while ((a = regex.exec(reversedLine)) != null) {
			const end = line.text.length - a.index - 1;
			const start = end - a[1].length;

			if (selection.start.character < start - 1 || end + 1 < selection.start.character) {
				console.log(a);
				continue;
			}

			const body = line.text.substring(start, end);
			const range = new vscode.Range(
				new vscode.Position(selection.start.line, start),
				new vscode.Position(selection.end.line, end)
			);
			return { body, range };
		}
	}
	return null;
}

export function activate(context: vscode.ExtensionContext) {
	const memFs = new MemFS();
	const uri = vscode.Uri.parse(MEM_FS_FILE);
	const editContext: EditContext = {};

	context.subscriptions.push(vscode.workspace.registerFileSystemProvider(MEM_FS_SCHEMA, memFs, { isCaseSensitive: true }));
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument((td) => {
		if (!(MEM_FS_FILE === td.uri.toString() && editContext.editor && editContext.range)) {
			return;
		}

		console.log('saved:', td.getText());
		try {
			const updated = JSON.stringify(JSON.parse(td.getText())).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
			console.log('updated:', updated);

			const { range } = editContext;
			editContext.editor.edit(editBuilder => {
				editBuilder.replace(range, updated);
			});
			vscode.commands.executeCommand('workbench.action.closeActiveEditor');
			memFs.delete(uri);
		} catch (e) {
			vscode.window.showErrorMessage(`Syntax Error: "${e.message}"`);
		}
	}));

	const disposable = vscode.commands.registerCommand('extension.editStringified', function () {
		// Get the active text editor
		const editor = vscode.window.activeTextEditor;
		editContext.editor = editor;

		if (editor == null) {
			return;
		}

		if(MEM_FS_FILE === editor.document.uri.toString()) {
			vscode.window.showErrorMessage('Cannot edit text in editing stringified JSON.');
			return;
		}

		const target = getTarget(editor);
		if (target == null) {
			vscode.window.showErrorMessage('Cannot get target string.');
			return;
		}
		editContext.range = target.range;

		let content;
		try {
			content = JSON.stringify(JSON.parse(target.body.replace(/\\"/g, '"').replace(/\\\\/g, '\\')), null, 4);
		} catch (e) {
			content = target.body.replace(/\\"/g, '"');
		}
		memFs.writeFile(uri, Buffer.from(content), { create: true, overwrite: true });
		vscode.workspace.openTextDocument(uri).then(doc => {
			vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
		});
	});

	context.subscriptions.push(disposable);
}