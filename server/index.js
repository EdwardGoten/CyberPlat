import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import pool, { initializeDatabase } from './database.js';

// Загрузка переменных окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Настройка CORS в зависимости от окружения
const corsOptions = {
  origin: isProduction 
    ? ['https://cyberplat.vercel.app'] // Замените на ваш домен
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json()); // Парсинг JSON

// Настройка Content-Security-Policy в зависимости от окружения
app.use((req, res, next) => {
  const connectSrc = isProduction
    ? "'self' https://cyberplat.vercel.app"
    : "'self' http://localhost:3000 http://localhost:5173";
  
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src ${connectSrc}`
  );
  next();
});

// Логирование запросов для отладки
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method !== 'GET' && req.body) {
    console.log('Body:', JSON.stringify(req.body));
  }
  next();
});

// Инициализация базы данных при первом запросе
let dbInitialized = false;

// Middleware для инициализации базы данных
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      // Проверяем наличие переменной окружения DATABASE_URL
      if (!process.env.DATABASE_URL) {
        console.error('❌ Переменная окружения DATABASE_URL не установлена!');
        console.log('Доступные переменные окружения:', Object.keys(process.env));
        return res.status(500).json({
          success: false,
          message: 'Ошибка конфигурации сервера: DATABASE_URL не установлена'
        });
      }
      
      // Маскируем пароль для логирования
      const connectionString = process.env.DATABASE_URL;
      const maskedConnectionString = connectionString.replace(
        /postgresql:\/\/([^:]+):([^@]+)@/,
        'postgresql://$1:***@'
      );
      console.log('Используется строка подключения:', maskedConnectionString);
      
      // Инициализация базы данных
      console.log('Инициализация базы данных...');
      
      // Проверяем подключение к базе данных
      const client = await pool.connect();
      console.log('✅ Подключение к базе данных установлено');
      client.release();
      
      // Инициализируем базу данных (создаем таблицы и т.д.)
      await initializeDatabase();
      console.log('✅ База данных успешно инициализирована');
      dbInitialized = true;
    } catch (error) {
      console.error('❌ Ошибка при инициализации базы данных:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Ошибка подключения к базе данных',
        error: isProduction ? undefined : error.message
      });
    }
  }
  next();
});

// Маршруты API
app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);

// Базовый маршрут для проверки работы API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API CyberPlat работает',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Обработка 404 для API-запросов
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint не найден'
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('❌ Ошибка сервера:', err);
  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера',
    error: isProduction ? undefined : err.message
  });
});

// Для локальной разработки запускаем сервер
// В Vercel это не используется, так как Vercel использует serverless функции
if (!isProduction || process.env.VERCEL_ENV === 'development') {
  app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
    console.log(`✅ Режим: ${isProduction ? 'production' : 'development'}`);
    console.log(`✅ API доступно по адресу: http://localhost:${PORT}/api`);
  });
}

// Экспортируем приложение для Vercel
export default app;
