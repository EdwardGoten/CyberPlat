import express from 'express';
import { pool } from '../database.js';

const router = express.Router();

// Тестовый маршрут для проверки работы API новостей
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API новостей работает'
  });
});

// Получение всех новостей
router.get('/all', async (req, res) => {
  try {
    console.log('Запрос на получение всех новостей');
    
    // Проверяем существование таблицы news
    const tableExists = await checkNewsTableExists();
    if (!tableExists) {
      await createNewsTable();
    }
    
    // Получаем все новости из базы данных
    const result = await pool.query(`
      SELECT * FROM news 
      ORDER BY published_at DESC
    `);
    
    const news = result.rows.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      source: item.source,
      imageUrl: item.image_url,
      publishedAt: item.published_at,
      url: item.url,
      category: item.category
    }));
    
    res.json({
      success: true,
      message: 'Новости успешно получены',
      news
    });
  } catch (error) {
    console.error('❌ Ошибка при получении новостей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении новостей',
      error: error.message
    });
  }
});

// Получение новостей по категории
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    console.log(`Запрос на получение новостей категории: ${category}`);
    
    // Проверяем существование таблицы news
    const tableExists = await checkNewsTableExists();
    if (!tableExists) {
      await createNewsTable();
    }
    
    // Получаем новости указанной категории из базы данных
    const result = await pool.query(`
      SELECT * FROM news 
      WHERE category = $1
      ORDER BY published_at DESC
    `, [category]);
    
    const news = result.rows.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      source: item.source,
      imageUrl: item.image_url,
      publishedAt: item.published_at,
      url: item.url,
      category: item.category
    }));
    
    res.json({
      success: true,
      message: `Новости категории ${category} успешно получены`,
      news
    });
  } catch (error) {
    console.error('❌ Ошибка при получении новостей по категории:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении новостей по категории',
      error: error.message
    });
  }
});

// Получение новости по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Запрос на получение новости с ID: ${id}`);
    
    // Проверяем существование таблицы news
    const tableExists = await checkNewsTableExists();
    if (!tableExists) {
      await createNewsTable();
      return res.status(404).json({
        success: false,
        message: 'Новость не найдена'
      });
    }
    
    // Получаем новость из базы данных
    const result = await pool.query(`
      SELECT * FROM news 
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Новость не найдена'
      });
    }
    
    const newsItem = result.rows[0];
    
    res.json({
      success: true,
      message: 'Новость успешно получена',
      news: {
        id: newsItem.id,
        title: newsItem.title,
        content: newsItem.content,
        source: newsItem.source,
        imageUrl: newsItem.image_url,
        publishedAt: newsItem.published_at,
        url: newsItem.url,
        category: newsItem.category
      }
    });
  } catch (error) {
    console.error('❌ Ошибка при получении новости:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении новости',
      error: error.message
    });
  }
});

// Добавление новой новости (для администраторов)
router.post('/add', async (req, res) => {
  try {
    console.log('Запрос на добавление новости:', req.body);
    
    const { title, content, source, imageUrl, url, category } = req.body;
    
    // Проверка обязательных полей
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Заголовок и содержание обязательны'
      });
    }
    
    // Проверяем существование таблицы news
    const tableExists = await checkNewsTableExists();
    if (!tableExists) {
      await createNewsTable();
    }
    
    // Добавляем новость в базу данных
    const result = await pool.query(`
      INSERT INTO news (title, content, source, image_url, published_at, url, category)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [title, content, source, imageUrl, new Date(), url, category]);
    
    const newsId = result.rows[0].id;
    
    res.status(201).json({
      success: true,
      message: 'Новость успешно добавлена',
      newsId
    });
  } catch (error) {
    console.error('❌ Ошибка при добавлении новости:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при добавлении новости',
      error: error.message
    });
  }
});

// Обновление новости (для администраторов)
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Запрос на обновление новости с ID: ${id}`, req.body);
    
    const { title, content, source, imageUrl, url, category } = req.body;
    
    // Проверка обязательных полей
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Заголовок и содержание обязательны'
      });
    }
    
    // Проверяем существование таблицы news
    const tableExists = await checkNewsTableExists();
    if (!tableExists) {
      await createNewsTable();
      return res.status(404).json({
        success: false,
        message: 'Новость не найдена'
      });
    }
    
    // Проверяем существование новости
    const checkResult = await pool.query(`
      SELECT id FROM news 
      WHERE id = $1
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Новость не найдена'
      });
    }
    
    // Обновляем новость в базе данных
    await pool.query(`
      UPDATE news 
      SET 
        title = $1, 
        content = $2, 
        source = $3, 
        image_url = $4, 
        url = $5, 
        category = $6
      WHERE id = $7
    `, [title, content, source, imageUrl, url, category, id]);
    
    res.json({
      success: true,
      message: 'Новость успешно обновлена'
    });
  } catch (error) {
    console.error('❌ Ошибка при обновлении новости:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении новости',
      error: error.message
    });
  }
});

// Удаление новости (для администраторов)
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Запрос на удаление новости с ID: ${id}`);
    
    // Проверяем существование таблицы news
    const tableExists = await checkNewsTableExists();
    if (!tableExists) {
      await createNewsTable();
      return res.status(404).json({
        success: false,
        message: 'Новость не найдена'
      });
    }
    
    // Проверяем существование новости
    const checkResult = await pool.query(`
      SELECT id FROM news 
      WHERE id = $1
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Новость не найдена'
      });
    }
    
    // Удаляем новость из базы данных
    await pool.query(`
      DELETE FROM news 
      WHERE id = $1
    `, [id]);
    
    res.json({
      success: true,
      message: 'Новость успешно удалена'
    });
  } catch (error) {
    console.error('❌ Ошибка при удалении новости:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении новости',
      error: error.message
    });
  }
});

// Вспомогательная функция для проверки существования таблицы news
async function checkNewsTableExists() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'news'
      )
    `);
    
    return result.rows[0].exists;
  } catch (error) {
    console.error('Ошибка при проверке существования таблицы news:', error);
    return false;
  }
}

// Вспомогательная функция для создания таблицы news
async function createNewsTable() {
  try {
    console.log('Создание таблицы news...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        source VARCHAR(100),
        image_url TEXT,
        published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        url TEXT,
        category VARCHAR(50)
      )
    `);
    
    console.log('Таблица news успешно создана');
    
    // Добавляем тестовые данные
    await addSampleNews();
    
    return true;
  } catch (error) {
    console.error('Ошибка при создании таблицы news:', error);
    return false;
  }
}

// Вспомогательная функция для добавления тестовых новостей
async function addSampleNews() {
  try {
    console.log('Добавление тестовых новостей...');
    
    const sampleNews = [
      {
        title: 'Новые технологии кибербезопасности',
        content: 'В мире появились новые технологии кибербезопасности, которые помогут защитить данные пользователей от хакерских атак.',
        source: 'CyberNews',
        imageUrl: 'https://via.placeholder.com/800x400?text=Cybersecurity',
        url: 'https://example.com/news/1',
        category: 'security'
      },
      {
        title: 'Искусственный интеллект в повседневной жизни',
        content: 'Искусственный интеллект всё больше проникает в нашу повседневную жизнь, помогая решать различные задачи.',
        source: 'TechDaily',
        imageUrl: 'https://via.placeholder.com/800x400?text=AI',
        url: 'https://example.com/news/2',
        category: 'ai'
      },
      {
        title: 'Новые тренды в веб-разработке',
        content: 'В 2023 году в веб-разработке появились новые тренды, которые изменят подход к созданию сайтов и приложений.',
        source: 'WebDev Magazine',
        imageUrl: 'https://via.placeholder.com/800x400?text=WebDev',
        url: 'https://example.com/news/3',
        category: 'webdev'
      }
    ];
    
    for (const news of sampleNews) {
      await pool.query(`
        INSERT INTO news (title, content, source, image_url, published_at, url, category)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        news.title,
        news.content,
        news.source,
        news.imageUrl,
        new Date(),
        news.url,
        news.category
      ]);
    }
    
    console.log('Тестовые новости успешно добавлены');
  } catch (error) {
    console.error('Ошибка при добавлении тестовых новостей:', error);
  }
}

export default router;