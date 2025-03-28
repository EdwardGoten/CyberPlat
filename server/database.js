import pg from "pg"
import dotenv from "dotenv"

// Загрузка переменных окружения
dotenv.config()

const { Pool } = pg

// Настройка строки подключения с резервными значениями
const getConnectionString = () => {
  // Если DATABASE_URL задан в переменных окружения, используем его
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  // Иначе формируем строку подключения из отдельных параметров
  // Используем значения по умолчанию для локальной разработки
  const user = process.env.DB_USER || "postgres"
  const password = process.env.DB_PASSWORD || "Edgoten2003"
  const host = process.env.DB_HOST || "localhost"
  const port = process.env.DB_PORT || 5432
  const database = process.env.DB_NAME || "cyberplat"

  return `postgresql://${user}:${password}@${host}:${port}/${database}`
}

// Создаем пул соединений
const pool = new Pool({
  connectionString: getConnectionString(),
  ssl: false, // Для локальной разработки SSL обычно не требуется
})

// Проверка подключения и инициализация базы данных
export async function initializeDatabase() {
  let client
  try {
    console.log(
      "Попытка подключения к PostgreSQL с использованием строки:",
      getConnectionString().replace(/:[^:]*@/, ":***@"),
    ) // Скрываем пароль в логах

    client = await pool.connect()
    console.log("✅ Подключено к PostgreSQL")

    // Проверяем существование таблиц
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'news')
    `)

    const existingTables = tablesResult.rows.map((row) => row.table_name)
    console.log("Существующие таблицы:", existingTables)

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
        avatar TEXT,
        registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
      -- Таблица команд
      CREATE TABLE IF NOT EXISTS teams (
        team_id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        logo VARCHAR(255),
        country VARCHAR(50),
        game VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) NOT NULL -- email создателя команды (капитана)
      );

      -- Таблица участников команды
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(team_id) ON DELETE CASCADE,
        user_email VARCHAR(100) NOT NULL,
        nickname VARCHAR(100),
        role VARCHAR(20) DEFAULT 'member', -- 'captain' или 'member'
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Индексы для быстрого поиска
      CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
      CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
      CREATE INDEX IF NOT EXISTS idx_team_members_user_email ON team_members(user_email);
      CREATE INDEX IF NOT EXISTS idx_team_members_nickname ON team_members(nickname);
    `)

    console.log("✅ Таблицы созданы или уже существуют")

    // Проверяем, существует ли столбец avatar в таблице users
    const avatarColumnCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'avatar'
    `)

    // Если столбца нет, добавляем его
    if (avatarColumnCheck.rows.length === 0) {
      console.log("Добавление столбца avatar в таблицу users...")
      await client.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS avatar TEXT
      `)
      console.log("✅ Столбец avatar добавлен в таблицу users")
    }

    // Проверяем, существует ли столбец created_at в таблице users
    const createdAtColumnCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'created_at'
    `)

    // Если столбца нет, добавляем его
    if (createdAtColumnCheck.rows.length === 0) {
      console.log("Добавление столбца created_at в таблицу users...")
      await client.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      `)
      console.log("✅ Столбец created_at добавлен в таблицу users")
    }

    // Проверяем, есть ли данные в таблице новостей
    const newsCount = await client.query("SELECT COUNT(*) FROM news")
    console.log(`Количество новостей в базе: ${newsCount.rows[0].count}`)

    // Если новостей нет, добавляем тестовые данные
    if (Number.parseInt(newsCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO news (title, content, date, author, category)
        VALUES
          ('Новые технологии в кибербезопасности', 'Содержание новости о кибербезопасности...', CURRENT_TIMESTAMP, 'Админ', 'Безопасность'),
          ('Обновление платформы CyberPlat', 'Информация об обновлении платформы...', CURRENT_TIMESTAMP - INTERVAL '1 day', 'Админ', 'Обновления'),
          ('Важное объявление для пользователей', 'Текст важного объявления...', CURRENT_TIMESTAMP - INTERVAL '2 day', 'Админ', 'Объявления');
      `)
      console.log("✅ Тестовые данные добавлены в таблицу news")
    }

    console.log("✅ База данных инициализирована")
    return true
  } catch (err) {
    console.error("❌ Ошибка при инициализации базы данных:", err)
    throw err
  } finally {
    if (client) {
      client.release()
    }
  }
}

// Вспомогательная функция для выполнения запросов
export async function query(text, params) {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log("Выполнен запрос", { text, duration, rows: res.rowCount })
    return res
  } catch (err) {
    console.error("Ошибка выполнения запроса", { text, error: err.message })
    throw err
  }
}

// Экспортируем pool и функции
export { pool }
export default pool
