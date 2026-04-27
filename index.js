// Храним handle инжектированного <style>
let activeStyleHandle = null;

// Более безопасный CSS: не трогает иконки, картинки, аватарки
const HACKER_CSS = `
  /* Основной фон колонок */
  #Main, #LeftColumn, #MiddleColumn, #RightColumn,
  .Main, .LeftColumn, .MiddleColumn, .RightColumn,
  .chat-list, .messages-container, .settings-content {
    background-color: #0a0a0a !important;
  }

  /* Только текст — зелёным, не трогаем SVG/иконки */
  .message-content,
  .chat-item .title,
  .chat-item .subtitle,
  .ChatInfo .title,
  .ChatInfo .status,
  .MessageMeta,
  .sender-name,
  .document-name,
  .media-caption,
  .Tab {
    color: #00ff00 !important;
  }

  /* Карточки сообщений */
  .Message {
    background-color: #111111 !important;
    border: 1px solid #00ff00 !important;
    border-radius: 4px !important;
    box-shadow: 0 0 5px rgba(0, 255, 0, 0.2) !important;
  }

  /* Разделители */
  .divider {
    background-color: rgba(0, 255, 0, 0.2) !important;
  }

  /* Скроллбар для полноты картины */
  ::-webkit-scrollbar-thumb {
    background-color: #00ff00 !important;
  }
`;

PrismaSDK.ready(async () => {
  console.log('[Hacker Theme] Инициализация...');

  try {
    // Загружаем состояние (защита от строкового "true" из localStorage)
    const savedState = await PrismaSDK.call('storage.get', 'hacker_theme_enabled');
    const isEnabled = savedState === true || savedState === 'true';

    // Регистрируем кнопку ОДИН РАЗ при старте
    await PrismaSDK.call('ui.registerSlot', 'sidebar:menu', {
      id: 'toggle-hacker-theme',
      label: isEnabled ? 'Выключить Hacker Theme' : 'Включить Hacker Theme',
      icon: isEnabled ? 'eye-closed' : 'eye'
    });

    // Если тема была включена до перезагрузки — восстанавливаем
    if (isEnabled) {
      await enableTheme(false); // false = не обновлять кнопку, она уже в правильном состоянии
    }

    // Слушаем клики по нашей кнопке
    PrismaSDK.onSlotClick(async (event) => {
      if (event.slotId !== 'sidebar:menu') return;
      if (event.contributionId !== 'toggle-hacker-theme') return;

      if (activeStyleHandle) {
        await disableTheme();
      } else {
        await enableTheme();
      }
    });

  } catch (err) {
    console.error('[Hacker Theme] Ошибка инициализации:', err);
  }
});

/**
 * Включает тему
 * @param {boolean} updateUI - обновлять ли текст кнопки (false при старте плагина)
 */
async function enableTheme(updateUI = true) {
  if (activeStyleHandle) return; // Уже включено

  try {
    const result = await PrismaSDK.call('dom.injectStyle', HACKER_CSS);

    // API может вернуть либо объект { handleId }, либо строку напрямую
    activeStyleHandle = result?.handleId ?? result;

    if (!activeStyleHandle) {
      throw new Error('dom.injectStyle не вернул handle');
    }

    await PrismaSDK.call('storage.set', 'hacker_theme_enabled', true);

    if (updateUI) {
      await setButtonState(false); // false = "Выключить"
    }

    console.log('[Hacker Theme] Тема включена, handle:', activeStyleHandle);
  } catch (err) {
    console.error('[Hacker Theme] Не удалось включить тему:', err);
    activeStyleHandle = null;
  }
}

async function disableTheme() {
  if (!activeStyleHandle) return;

  try {
    // Удаляем <style> из DOM
    await PrismaSDK.call('dom.remove', activeStyleHandle);
  } catch (err) {
    // Если элемент уже удалён — не критично
    console.warn('[Hacker Theme] Не удалось удалить стиль:', err);
  }

  activeStyleHandle = null;

  try {
    await PrismaSDK.call('storage.set', 'hacker_theme_enabled', false);
    await setButtonState(true); // true = "Включить"
    console.log('[Hacker Theme] Тема отключена');
  } catch (err) {
    console.error('[Hacker Theme] Ошибка при сохранении состояния:', err);
  }
}

/** Обновляет label и иконку кнопки */
async function setButtonState(showEnable) {
  const config = {
    id: 'toggle-hacker-theme',
    label: showEnable ? 'Включить Hacker Theme' : 'Выключить Hacker Theme',
    icon: showEnable ? 'eye' : 'eye-closed'
  };

  try {
    // Пробуем обновить существующий слот (лучший вариант)
    await PrismaSDK.call('ui.updateSlot', 'sidebar:menu', config);
  } catch (e) {
    // Fallback: если updateSlot не поддерживается — перерегистрируем
    try {
      await PrismaSDK.call('ui.registerSlot', 'sidebar:menu', config);
    } catch (e2) {
      console.error('[Hacker Theme] Не удалось обновить кнопку:', e2);
    }
  }
}
