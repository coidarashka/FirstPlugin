// ============ МАКСИМАЛЬНО АГРЕССИВНЫЙ ДЕБАГ ============
console.log('[Hacker Theme] СКРИПТ ЗАГРУЖЕН', new Date().toISOString());
console.log('[Hacker Theme] PrismaSDK exists?', typeof PrismaSDK);
console.log('[Hacker Theme] document readyState?', document.readyState);

let activeStyleElement = null;
let btnElement = null;

const HACKER_CSS = `
  #Main, #LeftColumn, #MiddleColumn, #RightColumn,
  .chat-list, .messages-container,
  .Transition_slide-active, .LeftColumn,
  [class*="left"], [class*="Left"] {
    background-color: #0a0a0a !important;
  }
  .message-content, .chat-item .title,
  .ChatInfo .title, .MessageMeta,
  .Tab, [class*="title"] {
    color: #00ff00 !important;
  }
  .Message {
    background-color: #111 !important;
    border: 1px solid #0f0 !important;
  }
`;

function injectCSS() {
  if (activeStyleElement) return;
  activeStyleElement = document.createElement('style');
  activeStyleElement.id = 'hacker-theme-style';
  activeStyleElement.textContent = HACKER_CSS;
  document.head.appendChild(activeStyleElement);
  console.log('[Hacker Theme] CSS вставлен');
}

function removeCSS() {
  if (activeStyleElement) {
    activeStyleElement.remove();
    activeStyleElement = null;
    console.log('[Hacker Theme] CSS удалён');
  }
}

function createFloatingButton() {
  if (document.getElementById('hacker-theme-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'hacker-theme-btn';
  btn.textContent = '💀 HACKER THEME';
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    background: #000;
    color: #0f0;
    border: 2px solid #0f0;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: monospace;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 0 10px #0f0;
  `;
  
  btn.onclick = () => {
    if (activeStyleElement) {
      removeCSS();
      btn.textContent = '💀 HACKER THEME (OFF)';
      btn.style.color = '#0f0';
    } else {
      injectCSS();
      btn.textContent = '💀 HACKER THEME (ON)';
      btn.style.color = '#0f0';
      btn.style.boxShadow = '0 0 20px #0f0, 0 0 40px #0f0';
    }
  };

  document.body.appendChild(btn);
  console.log('[Hacker Theme] Плавающая кнопка вставлена в body');
  return btn;
}

function tryFindMenuAndInject() {
  // Все возможные селекторы меню
  const selectors = [
    '#LeftColumn .Menu',
    '.left-column .Menu',
    '.LeftColumn .Menu',
    '[class*="left"] [class*="menu"]',
    '[class*="Left"] [class*="Menu"]',
    '.Menu',
    '#LeftColumn nav',
    '.left-header',
    '.LeftColumn-header',
    '[class*="sidebar"]',
    '#LeftColumn'
  ];

  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      console.log('[Hacker Theme] Найден элемент:', sel, el);
      
      const item = document.createElement('div');
      item.id = 'hacker-theme-menu-item';
      item.style.cssText = 'padding: 8px 16px; color: #0f0; cursor: pointer; font-weight: bold; border-top: 1px solid #333;';
      item.innerHTML = '💀 Hacker Theme';
      item.onclick = () => {
        if (activeStyleElement) {
          removeCSS();
          item.innerHTML = '💀 Hacker Theme (OFF)';
        } else {
          injectCSS();
          item.innerHTML = '💀 Hacker Theme (ON)';
        }
      };
      
      el.appendChild(item);
      console.log('[Hacker Theme] Пункт меню вставлен в:', sel);
      return true;
    }
  }
  return false;
}

// ============ СТРАТЕГИЯ ЗАПУСКА ============

// 1. Пробуем через SDK если есть
if (typeof PrismaSDK !== 'undefined') {
  console.log('[Hacker Theme] PrismaSDK найден, пробуем ready...');
  
  PrismaSDK.ready(async () => {
    console.log('[Hacker Theme] PrismaSDK.ready СРАБОТАЛ!');
    try {
      const saved = await PrismaSDK.call('storage.get', 'hacker_theme_enabled');
      console.log('[Hacker Theme] Сохранённое состояние:', saved);
      if (saved === true || saved === 'true') {
        injectCSS();
      }
    } catch(e) {
      console.log('[Hacker Theme] Ошибка storage:', e);
    }
  });
} else {
  console.log('[Hacker Theme] PrismaSDK НЕ найден!');
}

// 2. Прямое выполнение — не ждём никого
function init() {
  console.log('[Hacker Theme] init() вызван');
  
  // Пробуем найти меню
  const menuFound = tryFindMenuAndInject();
  
  // Если меню не нашли — вставляем плавающую кнопку
  if (!menuFound) {
    createFloatingButton();
  }
  
  // Пробуем восстановить состояние из localStorage напрямую
  try {
    const raw = localStorage.getItem('hacker_theme_enabled');
    console.log('[Hacker Theme] localStorage raw:', raw);
    if (raw === 'true') {
      injectCSS();
      const btn = document.getElementById('hacker-theme-btn');
      if (btn) btn.textContent = '💀 HACKER THEME (ON)';
    }
  } catch(e) {}
}

// 3. Ждём появления DOM через MutationObserver
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 4. Также ловим появление элементов динамически
const observer = new MutationObserver((mutations) => {
  if (!document.getElementById('hacker-theme-btn') && !document.getElementById('hacker-theme-menu-item')) {
    // Если интерфейс только что отрисовался — пробуем снова
    if (document.querySelector('#LeftColumn, .LeftColumn, [class*="left"]')) {
      console.log('[Hacker Theme] DOM изменился, пробуем inject...');
      const menuFound = tryFindMenuAndInject();
      if (!menuFound && !document.getElementById('hacker-theme-btn')) {
        createFloatingButton();
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// 5. Финальный fallback — через 3 секунды точно будет кнопка
setTimeout(() => {
  if (!document.getElementById('hacker-theme-btn') && !document.getElementById('hacker-theme-menu-item')) {
    console.log('[Hacker Theme] Fallback timeout — вставляем кнопку принудительно');
    createFloatingButton();
  }
}, 3000);

console.log('[Hacker Theme] Скрипт полностью выполнен');
