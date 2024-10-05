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

// Подписка на топик с номером кабинета
const subscribeToCabTopic = (cab) => {
  const topic = `cab${cab}`;
  client.subscribe(topic, (err) => {
    if (!err) {
      console.log(`Subscribed to topic ${topic}`);
    } else {
      console.error(`Ошибка подписки на топик ${topic}:`, err);
    }
  });
};

// Получение сообщений из топиков
client.on('message', (topic, message) => {
  console.log(`Message received on topic ${topic}: ${message.toString()}`);
});

// Middleware для обработки JSON
app.use(express.json());

// Маршрут для приема POST-запросов
app.post('/submit', (req, res) => {
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

  // Формируем топик с номером кабинета
  const topic = `cab${cab}`;

  // Публикация сообщения на топик с номером кабинета
  client.publish(topic, JSON.stringify(message), (err) => {
    if (err) {
      console.error('Ошибка при отправке сообщения:', err);
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
