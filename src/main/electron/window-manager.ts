import path from 'path';
import { app, BrowserWindow, screen } from 'electron';
import { getAssetPath, resolveHtmlPath } from '../helpers/util';
import MenuBuilder from './menu';

const gadgetDefaultSize = { width: 450, height: 350 };

export default class WindowManager {
  private static mainWindow: BrowserWindow | null = null;

  private static gadgetWindow: BrowserWindow | null = null;

  private static splashScreenWindow: BrowserWindow | null = null;

  /**
   * Create the main window
   */
  public static createMainWindow() {
    if (WindowManager.mainWindow === null) {
      WindowManager.mainWindow = new BrowserWindow({
        width: 1300,
        height: 700,
        center: true,
        autoHideMenuBar: true, // Hide the default menu bar
        backgroundColor: '#00000000',
        // closable: false,
        icon: getAssetPath('bot.png'),
        show: false, // Start the window hidden
        // transparent: true, // Set window to be transparent
        // titleBarStyle: 'hidden',
        // frame: false, // Hide the frame
        // ...(transparentSetting === '1' && {
        //   frame: false,
        // }), // Load the previous window bounds (if any
        // hasShadow: false, // Remove window shadows
        webPreferences: {
          webviewTag: true,
          preload: app.isPackaged
            ? path.join(__dirname, './preload.js')
            : path.join(__dirname, '../../../.erb/dll/preload.js'),
          // experimentalFeatures: true,
          // plugins: true,
          // nodeIntegration: false,
          // contextIsolation: true,
          // nodeIntegrationInSubFrames: false,
        },
      });

      WindowManager.mainWindow.loadURL(resolveHtmlPath('index.html'));

      const menuBuilder = new MenuBuilder(WindowManager.mainWindow);
      menuBuilder.buildMenu();
      // Handle 'close' event to release the reference to the main window
      WindowManager.mainWindow.on('closed', () => {
        WindowManager.mainWindow = null;
        app.quit();
      });
    }
  }

  /**
   * Get the main window
   * @returns The main window
   */
  public static getMainWindow(): BrowserWindow | null {
    return WindowManager.mainWindow;
  }

  /**
   * Create the splash screen window
   */
  public static createSplashScreenWindow() {
    if (WindowManager.splashScreenWindow === null) {
      WindowManager.splashScreenWindow = new BrowserWindow({
        // fullscreen: true,
        width: 1400,
        height: 800,
        frame: false,
        // transparent: true,
        alwaysOnTop: true,
        // center: true,
        resizable: false,
        webPreferences: {
          webgl: true,
          experimentalFeatures: true,
        },
        // show: false,
      });
      // maximize
      // WindowManager.splashScreenWindow.maximize();

      WindowManager.splashScreenWindow.loadFile(
        app.isPackaged
          ? path.join(process.resourcesPath, 'assets/splash.html')
          : path.join(__dirname, '../../../assets/splash.html'),
      );

      WindowManager.splashScreenWindow.on('closed', () => {
        WindowManager.splashScreenWindow = null;
      });
    }
  }

  /**
   * Get Splash Screen window
   * @returns The splash screen window
   */
  public static getSplashScreenWindow(): BrowserWindow | null {
    return WindowManager.splashScreenWindow;
  }

  /**
   * Create the gadget window
   */
  public static createGadgetWindow() {
    if (WindowManager.gadgetWindow === null) {
      WindowManager.gadgetWindow = new BrowserWindow({
        width: gadgetDefaultSize.width,
        height: gadgetDefaultSize.height,
        x: screen.getPrimaryDisplay().bounds.width - gadgetDefaultSize.width,
        y: 0,
        maximizable: false,
        modal: true,
        alwaysOnTop: true,
        resizable: false,
        fullscreenable: false,
        // show: false, // Start the window hidden
        autoHideMenuBar: true, // Hide the default menu bar
        transparent: true, // Set window to be transparent
        frame: false, // Hide the frame
        webPreferences: {
          // nodeIntegration: false,
          // contextIsolation: true,
          preload: app.isPackaged
            ? path.join(__dirname, './preload.js')
            : path.join(__dirname, '../../../.erb/dll/preload.js'),
        },
      });

      WindowManager.gadgetWindow.loadURL(resolveHtmlPath('gadget.html'));

      // Handle 'close' event to release the reference to the main window
      WindowManager.gadgetWindow.on('closed', () => {
        WindowManager.gadgetWindow = null;
      });
      // WindowManager.gadgetWindow.on('ready-to-show', () => {
      //   if (!WindowManager.gadgetWindow) {
      //     throw new Error('"gadgetWindow" is not defined');
      //   }
      //   WindowManager.gadgetWindow.hide();
      // });
    }
  }

  /**
   *  Get the gadget window
   * @returns The gadget window
   */
  public static getGadgetWindow(): BrowserWindow | null {
    return WindowManager.gadgetWindow;
  }
}
