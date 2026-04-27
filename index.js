let activeStyleHandle = null;
let manualStyleElement = null;

const HACKER_CSS = `
  #Main, #LeftColumn, #MiddleColumn, #RightColumn,
  .chat-list, .messages-container, .settings-content,
  .Transition_slide-active {
    background-color: #0a0a0a !important;
  }
  .message-content,
  .chat-item .title,
  .chat-item .subtitle,
  .ChatInfo .title,
  .ChatInfo .status,
  .MessageMeta,
  .sender-name,
  .document-name,
  .media-caption,
  .Tab,
  .ListItem .title {
    color: #00ff00 !important;
  }
  .Message {
    background-color: #111111 !important;
    border: 1px solid #00ff00 !important;
    border-radius: 4px !important;
    box-shadow: 0 0 5px rgba(0, 255, 0, 0.2) !important;
  }
  .divider {
    background-color: rgba(0, 255, 0, 0.2) !important;
  }
  ::-webkit-scrollbar-thumb {
    background-color: #00ff00 !important;
  }
`;

// ============ DOM FALLBACK: кнопка напрямую ============
function injectManualButton() {
  if (document.getElementById('hacker-theme-btn')) return;

  // Пробуем найти меню в левой колонке
  const menuContainer = document.querySelector(
    '#LeftColumn .Menu, .left-column .Menu, [class*="left"] [class*="Menu"]'
  );

  if (menuContainer) {
    const item = document.createElement('div');
    item.id = 'hacker-theme-btn';
    item.className = 'MenuItem'; // стиль как у пунктов меню Telegram
    item.style.cssText = 'color: #00ff00 !important; font-weight: bold;';
    item.innerHTML = `<i class="icon icon-eye"></i><span>Включить Hacker Theme</span>`;
    
    item.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (activeStyleHandle || manualStyleElement) {
        await disableTheme();
        item.querySelector('span').textContent = 'Включить Hacker Theme';
        item.querySelector('.icon').className = 'icon icon-eye';
      } else {
        await enableTheme();
        item.querySelector('span').textContent = 'Выключить Hacker Theme';
        item.querySelector('.icon').className = 'icon icon-eye-closed';
      }
    });

    menuContainer.appendChild(item);
    console.log('[Hacker Theme] Кнопка вставлена в меню');
    return;
  }

  // Если меню ещё не отрисовалось — вставим в хедер левой колонки
  const header = document.querySelector('#LeftColumn .left-header, .LeftColumn-header');
  if (header) {
    const btn = document.createElement('button');
    btn.id = 'hacker-theme-btn';
    btn.textContent = '💀 Hacker';
    btn.style.cssText = 'background:#111;color:#0f0;border:1px solid #0f0;padding:4px 8px;margin:4px;border-radius:4px;cursor:pointer;font-size:12px;';
    btn.onclick = async () => {
      if (activeStyleHandle || manualStyleElement) await disableTheme(); else await enableTheme();
    };
    header.appendChild(btn);
    console.log('[Hacker Theme] Кнопка вставлена в хедер');
  }
}

// Ждём появления DOM-элементов
function waitForMenu() {
  if (document.querySelector('#LeftColumn')) {
    injectManualButton();
  } else {
    setTimeout(waitForMenu, 500);
  }
}

// ============ ЛОГИКА ТЕМЫ ============
async function enableTheme(saveState = true) {
  if (activeStyleHandle || manualStyleElement) return;

  try {
    // Пробуем через SDK
    const result = await PrismaSDK.call('dom.injectStyle', HACKER_CSS);
    activeStyleHandle = result?.handleId ?? result;
    console.log('[Hacker Theme] Через SDK, handle:', activeStyleHandle);
  } catch (e) {
    // Fallback: впихиваем <style> самостоятельно
    console.log('[Hacker Theme] SDK injectStyle не сработал, используем DOM');
    manualStyleElement = document.createElement('style');
    manualStyleElement.id = 'hacker-theme-style';
    manualStyleElement.textContent = HACKER_CSS;
    document.head.appendChild(manualStyleElement);
  }

  if (saveState) {
    try { await PrismaSDK.call('storage.set', 'hacker_theme_enabled', true); } catch(e) {}
  }

  updateButtonText(true);
}

async function disableTheme() {
  if (activeStyleHandle) {
    try { await PrismaSDK.call('dom.remove', activeStyleHandle); } catch(e) {}
    activeStyleHandle = null;
  }
  if (manualStyleElement) {
    manualStyleElement.remove();
    manualStyleElement = null;
  }
  try { await PrismaSDK.call('storage.set', 'hacker_theme_enabled', false); } catch(e) {}
  updateButtonText(false);
}

function updateButtonText(isEnabled) {
  const btn = document.getElementById('hacker-theme-btn');
  if (!btn) return;
  const icon = btn.querySelector('.icon');
  const span = btn.querySelector('span');
  if (isEnabled) {
    if (span) span.textContent = 'Выключить Hacker Theme';
    if (icon) icon.className = 'icon icon-eye-closed';
  } else {
    if (span) span.textContent = 'Включить Hacker Theme';
    if (icon) icon.className = 'icon icon-eye';
  }
}

// ============ ИНИЦИАЛИЗАЦИЯ ============
PrismaSDK.ready(async () => {
  console.log('[Hacker Theme] Старт...');

  try {
    const saved = await PrismaSDK.call('storage.get', 'hacker_theme_enabled');
    const isEnabled = saved === true || saved === 'true';

    // Пробуем разные slotId на случай если один из них вдруг окажется правильным
    const slots = ['sidebar:menu', 'left:menu', 'main:menu', 'settings', 'left_sidebar_menu'];
    for (const slot of slots) {
      try {
        await PrismaSDK.call('ui.registerSlot', slot, {
          id: 'toggle-hacker-theme',
          label: isEnabled ? 'Выключить Hacker Theme' : 'Включить Hacker Theme',
          icon: isEnabled ? 'eye-closed' : 'eye'
        });
      } catch(e) {}
    }

    // Слушаем клики (если registerSlot вдруг сработал)
    if (PrismaSDK.onSlotClick) {
      PrismaSDK.onSlotClick(async (event) => {
        if (event.contributionId !== 'toggle-hacker-theme') return;
        if (activeStyleHandle || manualStyleElement) await disableTheme(); else await enableTheme();
      });
    }

    // Восстанавливаем тему если была включена
    if (isEnabled) await enableTheme(false);

    // В любом случае вставляем кнопку в DOM (fallback)
    waitForMenu();

  } catch (err) {
    console.error('[Hacker Theme] Ошибка инициализации:', err);
    waitForMenu();
  }
});
