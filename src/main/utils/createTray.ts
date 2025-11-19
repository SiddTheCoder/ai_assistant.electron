import { BrowserWindow, Tray, Menu, app } from "electron";
import path from "path";
import { getAssetPath } from "./pathResolver.js";

export function createTray(mainWindow: BrowserWindow) {
  const tray = new Tray(
    path.join(
      getAssetPath(),
      process.platform === "darwin" ? "icon.png" : "icon-high-ql.png"
    )
  );

  tray.setToolTip("Spark - AI Assistant");

  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Open",
        click: () => {
          mainWindow.show();
          if (app.dock) {
            app.dock.show();
          }
        },
      },
      {
        label: "Quit",
        click: () => {
          app.quit();
          if (app.dock) {
            app.dock.hide();
          }
          tray.destroy()
        },
      }
    ])
  )
}
