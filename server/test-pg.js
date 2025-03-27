import pg from 'pg';
import dotenv from 'dotenv';

// Загрузка переменных окружения
dotenv.config();

const { Pool } = pg;

// Конфигурация подключения к PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  client_encoding: 'UTF8'
});

async function testConnection() {
  try {
    console.log('Тестирование подключения к PostgreSQL...');
    
    // Проверяем версию PostgreSQL
    const versionResult = await pool.query('SELECT version()');
    console.log('Версия PostgreSQL:', versionResult.rows[0].version);
    
    // Проверяем таблицы
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('Таблицы в базе данных:');
    if (tablesResult.rows.length === 0) {
      console.log('Таблиц нет. Создаем таблицы...');
      
      // Создаем таблицы
      await pool.query(`
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
      
      console.log('✅ Таблицы созданы');
      
      // Добавляем тестовые данные
      await pool.query(`
        INSERT INTO news (title, content, date, author, category)
        VALUES 
          ('Новые технологии в кибербезопасности', 'Содержание новости о кибербезопасности...', CURRENT_TIMESTAMP, 'Админ', 'Безопасность'),
          ('Обновление платформы CyberPlat', 'Информация об обновлении платформы...', CURRENT_TIMESTAMP - INTERVAL '1 day', 'Админ', 'Обновления'),
          ('Важное объявление для пользователей', 'Текст важного объявления...', CURRENT_TIMESTAMP - INTERVAL '2 day', 'Админ', 'Объявления');
      `);
      
      console.log('✅ Тестовые данные добавлены');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
    // Проверяем, существует ли таблица news
    const newsTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'news'
      );
    `);
    
    if (newsTableExists.rows[0].exists) {
      // Проверяем данные в таблице news
      const newsResult = await pool.query('SELECT * FROM news LIMIT 3');
      console.log('Данные из таблицы news:');
      console.table(newsResult.rows);
    } else {
      console.log('Таблица news не существует. Создаем...');
      
      // Создаем таблицу news
      await pool.query(`
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
      
      // Добавляем тестовые данные
      await pool.query(`
        INSERT INTO news (title, content, date, author, category)
        VALUES 
          ('Новые технологии в кибербезопасности', 'Содержание новости о кибербезопасности...', CURRENT_TIMESTAMP, 'Админ', 'Безопасность'),
          ('Обновление платформы CyberPlat', 'Информация об обновлении платформы...', CURRENT_TIMESTAMP - INTERVAL '1 day', 'Админ', 'Обновления'),
          ('Важное объявление для пользователей', 'Текст важного объявления...', CURRENT_TIMESTAMP - INTERVAL '2 day', 'Админ', 'Объявления');
      `);
      
      console.log('✅ Таблица news создана и заполнена тестовыми данными');
      
      // Проверяем данные в таблице news
      const newsResult = await pool.query('SELECT * FROM news LIMIT 3');
      console.log('Данные из таблицы news:');
      console.table(newsResult.rows);
    }
    
    console.log('✅ Тест подключения успешно завершен');
  } catch (error) {
    console.error('❌ Ошибка при тестировании подключения:', error);
  } finally {
    // Закрываем пул подключений
    await pool.end();
  }
}

testConnection();