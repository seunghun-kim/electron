import { app } from 'electron';
import createMainWindow from './createMainWindow';
import setAppMenu from './setAppMenu';
import showSaveAsNewFileDialog from './showSaveAsNewFileDialog';
import createFileManager from './createFileManager';
import showOpenFileDialog from './showOpenFileDialog';
import createPDFWindow from './createPDFWindow';
import showExportPDFDialog from './showExportPDFDialog';

let mainWindow = null;
let fileManager = null;

function openFile() {
  showOpenFileDialog()
    .then((filePath) => fileManager.readFile(filePath))
    .then((text) => mainWindow.sendText(text))
    .catch(err => console.log(err));
}

function saveFile() {
  if (!fileManager.filePath) {
    saveAsNewFile();
    return;
  }
  mainWindow.requestText()
    .then((text) => fileManager.overwriteFile(text))
    .catch(err => console.log(err));
}

function saveAsNewFile() {
  Promise.all([ showSaveAsNewFileDialog(), mainWindow.requestText() ])
  .then(([filePath, text]) => fileManager.saveFile(filePath, text))
  .catch(err => {
    console.log(err);
  });
}

function exportPDF() {
  Promise.all([ showExportPDFDialog(), mainWindow.requestText() ])
    .then(([filePath, text]) => {
      const pdfWindow = createPDFWindow(text);
      pdfWindow.on('RENDERED_CONTENTS', () => {
        pdfWindow.generatePDF()
          .then(pdf => fileManager.writePDF(filePath, pdf))
          .then(() => pdfWindow.close())
          .catch(err => {
            console.log(err);
            pdfWindow.close();
          });
      });
    });
}

app.on('ready', () => {
  mainWindow = createMainWindow();
  fileManager = createFileManager();
  setAppMenu({ openFile, saveFile, saveAsNewFile, exportPDF });
});

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') {
    app.quit();
  }
});

app.on('activate', (_e, hasVisibleWindows) => {
  if (!hasVisibleWindows) {
    mainWindow = createMainWindow();
  }
});
