import { app, BrowserWindow, screen, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import * as dotenv from 'dotenv';
dotenv.config();
console.log("My API Key is:", process.env.OPENROUTER_API_KEY ? "Loaded!" : "NOT FOUND");

if (started) {
  app.quit();
}

const createWindow = () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds; 
  
  // Exactly half the screen width
  const windowWidth = Math.floor(width / 2);
  
  // Exactly one fourth (1/4) of the screen height
  const windowHeight = Math.floor(height / 4);

  // This will position it in the bottom-right corner
  const x = width - windowWidth;
  const y = height - windowHeight;

  const mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: x,
    y: y,
    frame: false,
    transparent: true, // Must be true for click-through to work well
    alwaysOnTop: true,
    focusable: true,
    hasShadow: false, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true, 
    },
  });
  
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
    

  setInterval(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const { x, y } = screen.getCursorScreenPoint();
      const [winX, winY] = mainWindow.getPosition();
      

      mainWindow.webContents.send('global-mouse-move', {
        relX: x - winX,
        relY: y - winY
      });
    }
  }, 30);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

};

ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  if (!ignore) {
    win.setIgnoreMouseEvents(false);
    win.show(); 
    win.focus();
  } else {
    win.setIgnoreMouseEvents(true, { forward: true });
  }
});

ipcMain.handle('ask-ai', async (event, prompt) => {
  console.log("AI Prompt received:", prompt); 
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "openrouter/auto",
        "messages": [
          { 
            "role": "system", 
            "content": "You are a helpful, minimalist desktop companion. Be concise, clever, and direct. No 'spooky' roleplay or ghost puns. Keep answers under 2 sentences." 
          },
          { "role": "user", "content": prompt }
        ]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      console.error("OpenRouter API Error:", data.error);
      return "The spirit world is busy...";
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("Fetch Error:", error);
    return "I lost my connection to the beyond.";
  }
});


app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
