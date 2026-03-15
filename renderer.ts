/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */


import './index.css';

let isPaused = false;
let isChatOpen = false;
let posX = 0;
let direction = 1;
let time = 0;
let baseY = 200; 

declare global {
  interface Window {
    electronAPI: {
      setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void;
      askAI: (prompt: string) => Promise<string>;
    };
  }
}

const reminders = [
  "Don't forget to drink some water! 💧",
  "Time to stretch your back. 🦴",
  "Rest your eyes for a minute. 👀",
  "You're doing a great job! ✨",
  "Take a deep breath. 🌬️"
];
const reminderInterval = 10000;

const clickBox = document.querySelector('.click-box') as HTMLElement;
const ghostBody = document.querySelector('.ghost-body') as HTMLElement;
const ghostContainer = document.getElementById('character') as HTMLElement;
const bubble = document.getElementById('speech-bubble') as HTMLElement;
const bubbleContent = document.getElementById('bubble-content') as HTMLElement;
const ghostInput = document.getElementById('ghost-input') as HTMLInputElement;

function closeChat() {
  isChatOpen = false;
  isPaused = false;
  bubble.classList.add('hidden');
  bubble.classList.remove('visible');
  ghostInput.classList.add('hidden');
  ghostInput.value = "";
  bubbleContent.classList.remove('hidden');
  bubbleContent.innerText = "";
  window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
}

[clickBox, bubble, ghostInput].forEach(el => {
  if (el) {
    el.addEventListener('mouseenter', () => {
      window.electronAPI.setIgnoreMouseEvents(false);
    });
    el.addEventListener('mouseleave', () => {
      if (!isChatOpen) {
        window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
      }
    });
  }
});

clickBox.addEventListener('click', (e) => {
  if (e.target === ghostInput) return;

  isChatOpen = !isChatOpen;

  if (isChatOpen) {
    isPaused = true;
    window.electronAPI.setIgnoreMouseEvents(false); 
    
    bubble.classList.remove('hidden');
    bubble.classList.add('visible');
    bubbleContent.classList.add('hidden'); 
    ghostInput.classList.remove('hidden');
    
    setTimeout(() => {
      ghostInput.focus();
    }, 50);

    if (ghostBody) {
      ghostBody.style.transition = 'transform 0.1s ease-out';
      ghostBody.style.transform = 'scale(1.2) translateY(-10px)';
      setTimeout(() => ghostBody.style.transform = 'scale(1) translateY(0)', 100);
    }
  } else {
    closeChat();
  }
});

ghostInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    const prompt = ghostInput.value.trim();
    if (!prompt) return;

    ghostInput.classList.add('hidden');
    bubbleContent.classList.remove('hidden');
    bubbleContent.innerText = "...";

    try {
      const response = await window.electronAPI.askAI(prompt);
      bubbleContent.innerText = response;
      
      setTimeout(() => {
        if (isChatOpen) closeChat();
      }, 8000);

    } catch (err) {
      bubbleContent.innerText = "Ghost error!";
      setTimeout(closeChat, 3000);
    }
  }
});

function animate() {
  if (isPaused) {
    requestAnimationFrame(animate); 
    return;
  }

  const safeBound = window.innerWidth - ghostContainer.offsetWidth;

  posX += 0.5 * direction; 
  if (posX >= safeBound || posX <= 0) direction *= -1;

  time += 0.03;
  const bobY = Math.sin(time) * 10;
  const flip = direction === 1 ? -1 : 1;

  ghostContainer.style.transform = `translate3d(${posX}px, ${baseY + bobY}px, 0) scaleX(${flip})`;

  if (bubble && !bubble.classList.contains('hidden')) {
    bubble.style.transform = `translateX(-50%) scaleX(${flip})`;
  }

  requestAnimationFrame(animate);
}


function sendGhostReminder() {
  if (isChatOpen) return;

  const randomMessage = reminders[Math.floor(Math.random() * reminders.length)];
  bubbleContent.innerText = randomMessage;

  ghostInput.classList.add('hidden');
  bubbleContent.classList.remove('hidden');
  bubble.classList.remove('hidden');

  ghostBody.classList.add('jump-anim');
  setTimeout(() => ghostBody.classList.remove('jump-anim'), 400);

  setTimeout(() => {
    if (!isChatOpen) bubble.classList.add('hidden');
  }, 7000);
}

setInterval(sendGhostReminder, reminderInterval);

animate();
