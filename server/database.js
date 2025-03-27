import pg from 'pg';
import dotenv from 'dotenv';

// Загрузка переменных окружения
dotenv.config();

const { Pool } = pg;

// Определяем, находимся ли мы в продакшн-среде
const isProduction = process.env.NODE_ENV === 'production';

// Оптимизированная конфигурация для serverless-окружения Vercel
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  // Оптимизация для serverless: минимальное количество соединений
  max: isProduction ? 1 : 10,
  // Уменьшаем время простоя соединения для serverless
  idleTimeoutMillis: isProduction ? 10000 : 30000,
  // Уменьшаем время ожидания соединения
  connectionTimeoutMillis: 5000,
});

// Проверка подключения и инициализация базы данных
export async function initializeDatabase() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Подключено к PostgreSQL');
    
    // Проверяем существование таблиц
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'news')
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('Существующие таблицы:', existingTables);
    
    // Создаем таблицы, если они не существуют
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        nickname VARCHAR(50),
        country VARCHAR(50),
        city VARCHAR(50),
        registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS news (
        news_id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        author VARCHAR(100),
        image_url VARCHAR(500),
        category VARCHAR(50)
      );
    `);
    
    console.log('✅ Таблицы созданы или уже существуют');
    
    // Проверяем, есть ли данные в таблице новостей
    const newsCount = await client.query('SELECT COUNT(*) FROM news');
    console.log(`Количество новостей в базе: ${newsCount.rows[0].count}`);
    
    // Если новостей нет, добавляем тестовые данные
    if (parseInt(newsCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO news (title, content, date, author, category)
        VALUES 
          ('Новые технологии в кибербезопасности', 'Содержание новости о кибербезопасности...', CURRENT_TIMESTAMP, 'Админ', 'Безопасность'),
          ('Обновление платформы CyberPlat', 'Информация об обновлении платформы...', CURRENT_TIMESTAMP - INTERVAL '1 day', 'Админ', 'Обновления'),
          ('Важное объявление для пользователей', 'Текст важного объявления...', CURRENT_TIMESTAMP - INTERVAL '2 day', 'Админ', 'Объявления');
      `);
      console.log('✅ Тестовые данные добавлены в таблицу news');
    }
    
    console.log('✅ База данных инициализирована');
    return true;
  } catch (err) {
    console.error('❌ Ошибка при инициализации базы данных:', err);
    throw err;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Вспомогательная функция для выполнения запросов
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Выполнен запрос', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error('Ошибка выполнения запроса', { text, error: err.message });
    throw err;
  }
}

// Экспортируем pool и функции
export { pool };
export default pool;
