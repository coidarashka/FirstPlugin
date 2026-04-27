// Переменная для хранения "ручки" (handle) нашего инжектированного CSS, 
// чтобы мы могли его удалить при отключении темы.
let activeStyleHandle = null;

// Наш кастомный CSS для перекраски интерфейса
const HACKER_CSS = `
  /* Перекрашиваем основные контейнеры в тёмный цвет */
  #Main, #LeftColumn, #MiddleColumn, #RightColumn, #FoldersSidebar {
    background-color: #0a0a0a !important;
  }
  
  /* Меняем цвет текста на зелёный терминальный */
  * {
    color: #00ff00 !important;
  }

  /* Кастомизируем внешний вид сообщений */
  .Message {
    background-color: #111 !important;
    border: 1px solid #00ff00 !important;
    border-radius: 4px !important;
    box-shadow: 0 0 5px rgba(0, 255, 0, 0.2) !important;
  }

  /* Скрываем стандартные разделители */
  .divider {
    background-color: #00ff0033 !important;
  }
`;

PrismaSDK.ready(async () => {
  console.log('[Hacker Theme] Инициализация плагина...');

  // 1. Проверяем, была ли тема включена ранее (сохранено в Storage)
  const isThemeEnabled = await PrismaSDK.call('storage.get', 'hacker_theme_enabled');
  if (isThemeEnabled) {
    await enableTheme();
  }

  // 2. Регистрируем кнопку в меню сайдбара
  await PrismaSDK.call('ui.registerSlot', 'sidebar:menu', {
    id: 'toggle-hacker-theme',
    label: isThemeEnabled ? 'Выключить Hacker Theme' : 'Включить Hacker Theme',
    icon: 'eye' // Имя иконки (из тех, что есть в клиенте)
  });

  // 3. Обрабатываем клики по нашей кнопке
  PrismaSDK.onSlotClick(async (event) => {
    // Проверяем, что кликнули именно по нашей кнопке в нужном слоте
    if (event.slotId === 'sidebar:menu' && event.contributionId === 'toggle-hacker-theme') {
      if (activeStyleHandle) {
        await disableTheme();
      } else {
        await enableTheme();
      }
    }
  });
});

// Функция включения темы
async function enableTheme() {
  if (activeStyleHandle) return; // Уже включено

  // Инжектируем CSS через DOM Proxy
  const result = await PrismaSDK.call('dom.injectStyle', HACKER_CSS);
  if (result && result.handleId) {
    activeStyleHandle = result.handleId; // Сохраняем handle для последующего удаления
    
    // Запоминаем в хранилище и обновляем кнопку
    await PrismaSDK.call('storage.set', 'hacker_theme_enabled', true);
    await PrismaSDK.call('ui.registerSlot', 'sidebar:menu', {
      id: 'toggle-hacker-theme',
      label: 'Выключить Hacker Theme',
      icon: 'eye-closed'
    });
    console.log('[Hacker Theme] Тема успешно включена!');
  }
}

// Функция отключения темы
async function disableTheme() {
  if (!activeStyleHandle) return;

  // Удаляем инжектированный элемент <style> из DOM
  await PrismaSDK.call('dom.remove', activeStyleHandle);
  activeStyleHandle = null;

  // Обновляем хранилище и кнопку
  await PrismaSDK.call('storage.set', 'hacker_theme_enabled', false);
  await PrismaSDK.call('ui.registerSlot', 'sidebar:menu', {
    id: 'toggle-hacker-theme',
    label: 'Включить Hacker Theme',
    icon: 'eye'
  });
  console.log('[Hacker Theme] Тема отключена.');
}