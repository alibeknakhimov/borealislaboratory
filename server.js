const express = require('express');
const mqtt = require('mqtt');
const app = express();

// MQTT connection options
const mqttOptions = {
  host: '7fad0843063a424c91118548316bd1bb.s2.eu.hivemq.cloud',
  port: 8883,
  protocol: 'mqtts',
  username: 'borealislab',
  password: 'Artofwar3'
};

// Подключение к MQTT-брокеру
const client = mqtt.connect(mqttOptions);

client.on('connect', () => {
  console.log('Connected to MQTT broker');
});

// Массив подписанных топиков
const subscribedTopics = new Set();

// Функция подписки на топик с номером кабинета
const subscribeToCabTopic = (cab) => {
  const topic = `cab${cab}`;

  // Проверяем, если уже подписаны на топик
  if (subscribedTopics.has(topic)) {
    return; // Убираем вывод в консоль
  }

  client.subscribe(topic, (err) => {
    if (!err) {
      subscribedTopics.add(topic);
    }
  });
};

// Middleware для обработки JSON
app.use(express.json());

// Маршрут для приема POST-запросов
app.post('/submit', (req, res) => {
  const token = req.headers['authorization'];

  // Проверка авторизационного токена
  if (!token) {
    return res.status(401).send('Токен авторизации обязателен');
  }

  if (token !== 'aPz3HkLk93mqw0xZ') {
    return res.status(403).send('Неверный токен авторизации');
  }

  const { cab, light, projector, ac, door } = req.body;

  // Проверка наличия номера кабинета
  if (cab === undefined) {
    return res.status(400).send('Номер кабинета (cab) обязателен');
  }

  // Подписка на топик кабинета при первом запросе
  subscribeToCabTopic(cab);

  // Формируем объект сообщения только с указанными параметрами
  const message = {};

  if (light !== undefined) {
    message.light = light;
  }
  if (projector !== undefined) {
    message.projector = projector;
  }
  if (ac !== undefined) {
    message.ac = ac;
  }
  if (door !== undefined) {
    message.door = door;
  }

  // Проверяем, есть ли параметры для отправки
  if (Object.keys(message).length === 0) {
    return res.status(400).send('Не указаны параметры для отправки');
  }

  // Проверяем подключение к MQTT
  if (!client.connected) {
    return res.status(500).send('Нет соединения с MQTT-брокером');
  }

  // Формируем топик с номером кабинета
  const topic = `cab${cab}`;

  // Публикация сообщения на топик с номером кабинета
  client.publish(topic, JSON.stringify(message), (err) => {
    if (err) {
      return res.status(500).send('Ошибка при отправке сообщения');
    }

    return res.send(`Сообщение отправлено на топик ${topic}: ${JSON.stringify(message)}`);
  });
});

// Сервер слушает на порту, который предоставляет Koyeb
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server started at ${PORT}`);
});
