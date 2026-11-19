"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.html = exports.css = void 0;
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const escape_html_1 = __importDefault(require("escape-html"));
const passthrough = (literals, ...placeholders) => literals.reduce((acc, literal, i) => {
    if (placeholders[i] != null && placeholders[i] !== false) {
        return acc + literal + String(placeholders[i]);
    }
    return acc + literal;
}, "");
exports.css = passthrough;
exports.html = passthrough;
const clipCss = (0, exports.css) `
  :root {
    --border: #000;
    --bg: #feffc6;
  }
  .vscode-dark {
    --border: #fff;
  }
  body {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 12em;
    grid-gap: 3em;
    position: absolute;
    image-rendering: pixelated;
    top: 1em;
    left: 1em;
    right: 1em;
    bottom: 1em;
    justify-items: flex-end;
  }
  .msg {
    justify-self: stretch;
    color: #000;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 1em;
    padding: 1em;
    position: relative;
  }
  .msg:after {
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    border-right: 1px solid var(--border);
    width: 3em;
    height: 3em;
    content: "";
    position: absolute;
    bottom: -1.5em;
    right: 5em;
    transform: rotate(-45deg);
  }
`;
const clip = (msg, { img }) => (0, exports.html) `
  <style>
    ${clipCss}
  </style>
  <body>
    <div class="msg">${msg}</div>
    <img src="${img}" />
  </body>
`;
async function activate(context) {
    const onDiskPath = vscode.Uri.file(path.join(context.extensionPath, "clippy.gif"));
    let clippy;
    const showClippy = ({ source = "nice", errors }) => {
        if (!clippy) {
            clippy = vscode.window.createWebviewPanel("clippy", "Clippy", {
                viewColumn: vscode.ViewColumn.Beside,
                preserveFocus: true
            });
            // Let VScode handle the cleanup
            context.subscriptions.push(clippy);
            // Called when panel is closed/disposed
            clippy.onDidDispose(() => {
                clippy = null;
            });
        }
        /*
        Regex explanation
        /(?s:\.?.$)/
        Slashes to interpret as regex literal
        Broken into parts to explain easier
        (  ?s:  \.  ?  .  $  )
        Explanation of parts
        1 () For some reason needed to do step 2
        2 ?s: Enable wild matching terminators
        3 \. "\" escapes so matches "." instead of wild
        4 ? Make previous optional (makes "." optional)
        5 . Wild, including line terminators (see 2)
        6 $ End of string
        Summary: Match last character, if second to last is "." remove "."
        For the other regex "^" is start of string
        */
        const text = `It looks like you are writing some ${source.toUpperCase()} code! But: <br><ul>${errors
            .map(e => `<li>
          ${(0, escape_html_1.default)(e.message)
            .replace(/(?s:\.?.$)/, "") // Chop last (and "." if it exists)
            .replace(/^./, firstChar => firstChar.toLowerCase()) // Lowercase the first character
        } on line ${e.range.start.line + 1}</li>`).join("")}</ul><br> You should really fix that?`;
        const img = clippy.webview.asWebviewUri(onDiskPath).toString();
        clippy.webview.html = clip(text, { img });
    };
    vscode.languages.onDidChangeDiagnostics(e => {
        e.uris.forEach(uri => {
            if (!vscode.window.activeTextEditor) {
                return;
            }
            if (vscode.window.activeTextEditor.document.uri.toString !== uri.toString) {
                return;
            }
            const diags = vscode.languages.getDiagnostics(uri)
                .filter(diag => diag.severity === vscode.DiagnosticSeverity.Error);
            if (diags.length < 1 && clippy) {
                clippy.dispose();
            }
            else {
                showClippy({
                    source: vscode.window.activeTextEditor.document.languageId,
                    errors: diags
                });
            }
        });
    });
}
// this method is called when your extension is deactivated
function deactivate() { }
//# sourceMappingURL=extension.js.map