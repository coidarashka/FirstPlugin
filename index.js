const TRIGGER = '.свага';
const REPLY = 'ГОЙДА';

// Обязательно оборачиваем всё в ready(), чтобы дождаться связи с ядром!
PrismaSDK.ready(async () => {
  console.log('Goyda plugin initialized!');

  // 1. Регистрируем хук для исходящих сообщений
  PrismaSDK.register('beforeMessageSent', async ({ text, chatId }) => {
    // Если текст не совпадает, просто разрешаем отправку (cancel: false)
    if (text.trim().toLowerCase() !== TRIGGER) {
      return { cancel: false };
    }
    
    // Если совпадает — сами отправляем ГОЙДА и отменяем оригинальное сообщение
    try {
      await PrismaSDK.call('messages.send', chatId, REPLY);
    } catch (err) {
      console.error('Ошибка при отправке из хука:', err);
    }
    
    return { cancel: true };
  });

  // 2. Подписываемся на чужие (входящие) сообщения
  try {
    // Это асинхронный вызов к ядру, поэтому мы делаем его внутри ready()
    await PrismaSDK.call('events.subscribe', 'message:received');
    console.log('Успешно подписались на message:received');
  } catch (err) {
    console.error('Не удалось подписаться на события:', err);
  }

  // 3. Слушаем входящие сообщения
  PrismaSDK.on('message:received', async (payload) => {
    const msg = payload.message;
    
    // Проверяем, что сообщение существует, оно НЕ наше, и текст совпадает
    if (msg && !msg.isOutgoing && msg.text && msg.text.trim().toLowerCase() === TRIGGER) {
      try {
        await PrismaSDK.call('messages.send', msg.chatId, REPLY);
      } catch (err) {
        console.error('Ошибка при автоматическом ответе:', err);
      }
    }
  });
});