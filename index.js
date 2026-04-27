const TRIGGER = '.свага';
const REPLY = 'ГОЙДА';

// ---------------------------------------------------------
// ЧАСТЬ 1: Если ТЫ пишешь ".свага", плагин отменяет отправку 
// и отправляет "ГОЙДА" от твоего имени (как в примере разраба)
// ---------------------------------------------------------
PrismaSDK.register('beforeMessageSent', async ({ text, chatId }) => {
  // Проверяем текст (приводим к нижнему регистру и убираем пробелы)
  if (text.trim().toLowerCase() !== TRIGGER) {
    return { cancel: false }; // Пропускаем обычные сообщения
  }
  
  // Отправляем ГОЙДА
  await PrismaSDK.call('messages.send', chatId, REPLY);
  
  // Отменяем отправку оригинального ".свага"
  return { cancel: true };
});


// ---------------------------------------------------------
// ЧАСТЬ 2: Если КТО-ТО ДРУГОЙ пишет ".свага", плагин 
// автоматически отвечает "ГОЙДА" в этот же чат
// ---------------------------------------------------------

// Говорим ядру: "Я хочу получать события о новых сообщениях"
PrismaSDK.call('events.subscribe', 'message:received').catch(console.error);

// Слушаем входящие сообщения
PrismaSDK.on('message:received', async (payload) => {
  const msg = payload.message;
  
  // Убеждаемся, что это текстовое сообщение, и оно НЕ наше (!isOutgoing)
  if (msg && !msg.isOutgoing && msg.text && msg.text.trim().toLowerCase() === TRIGGER) {
    try {
      await PrismaSDK.call('messages.send', msg.chatId, REPLY);
    } catch (err) {
      console.error('Ошибка при отправке автоответа:', err);
    }
  }
});