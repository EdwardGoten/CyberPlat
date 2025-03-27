import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../database.js';
import { getUserByEmail, registerUser, authenticateUser } from '../controllers/userController.js';

const router = express.Router();

// Тестовый маршрут для проверки работы API пользователей
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API пользователей работает'
  });
});

// Регистрация нового пользователя
router.post('/register', async (req, res) => {
  try {
    console.log('Запрос на регистрацию:', req.body);
    
    const { email, password, fullName, nickname, country, city } = req.body;
    
    // Проверка обязательных полей
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны'
      });
    }
    
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }
    
    // Регистрируем нового пользователя
    const userId = await registerUser({
      email,
      password,
      fullName,
      nickname,
      country,
      city
    });
    
    // Возвращаем данные пользователя для сохранения в localStorage
    res.status(201).json({
      success: true,
      message: 'Пользователь успешно зарегистрирован',
      user: {
        userId,
        email,
        fullName,
        nickname,
        country,
        city
      }
    });
  } catch (error) {
    console.error('❌ Ошибка при регистрации пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при регистрации пользователя',
      error: error.message
    });
  }
});

// Аутентификация пользователя
router.post('/login', async (req, res) => {
  try {
    console.log('Запрос на вход:', req.body);
    
    const { email, password } = req.body;
    
    // Проверка обязательных полей
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны'
      });
    }
    
    const result = await authenticateUser(email, password);
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message
      });
    }
    
    // Возвращаем полные данные пользователя
    res.json({
      success: true,
      message: 'Аутентификация успешна',
      user: {
        userId: result.user.userId,
        email: result.user.email,
        fullName: result.user.fullName,
        nickname: result.user.nickname,
        country: result.user.country,
        city: result.user.city
      }
    });
  } catch (error) {
    console.error('❌ Ошибка при аутентификации пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при аутентификации пользователя',
      error: error.message
    });
  }
});

// Получение информации о текущем пользователе
router.get('/me', async (req, res) => {
  try {
    // В реальном приложении здесь должна быть проверка токена аутентификации
    // и получение ID пользователя из токена
    
    // Для демонстрации получаем email из query параметров
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email не указан'
      });
    }
    
    // Получаем пользователя из базы данных
    const user = await getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    // Возвращаем данные пользователя
    res.json({
      success: true,
      message: 'Информация о пользователе получена',
      profile: {
        userId: user.user_id,
        email: user.email,
        username: user.full_name?.split(' ')[0] || '',
        lastName: user.full_name?.split(' ')[1] || '',
        nickname: user.nickname || '',
        country: user.country || '',
        city: user.city || '',
        registeredAt: user.registered_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    console.error('❌ Ошибка при получении информации о пользователе:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении информации о пользователе',
      error: error.message
    });
  }
});

// Обновление профиля пользователя
router.post('/update', async (req, res) => {
  try {
    console.log('Запрос на обновление профиля:');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    const { email, username, lastName, nickname, country, city } = req.body;
    
    if (!email) {
      console.error('Email не указан в запросе');
      return res.status(400).json({
        success: false,
        message: 'Email не указан'
      });
    }
    
    // Получаем пользователя из базы данных
    const user = await getUserByEmail(email);
    
    if (!user) {
      console.error('Пользователь не найден:', email);
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    // Обновляем данные пользователя в базе данных
    const fullName = `${username || ''} ${lastName || ''}`.trim();
    
    console.log('Обновление данных пользователя:', {
      email,
      fullName,
      nickname,
      country,
      city
    });
    
    await pool.query(`
      UPDATE users 
      SET 
        full_name = $1, 
        nickname = $2, 
        country = $3, 
        city = $4
      WHERE email = $5
    `, [fullName, nickname, country, city, email]);
    
    console.log('Профиль успешно обновлен для пользователя:', email);
    
    // Возвращаем обновленные данные пользователя
    res.json({
      success: true,
      message: 'Профиль успешно обновлен',
      profile: {
        userId: user.user_id,
        email: user.email,
        username: username || '',
        lastName: lastName || '',
        nickname: nickname || '',
        country: country || '',
        city: city || ''
      }
    });
  } catch (error) {
    console.error('❌ Ошибка при обновлении профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении профиля',
      error: error.message
    });
  }
});

// Изменение пароля пользователя
router.put('/password', async (req, res) => {
  try {
    console.log('Запрос на изменение пароля:');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    const { email, currentPassword, newPassword } = req.body;
    
    if (!email) {
      console.error('Email не указан в запросе');
      return res.status(400).json({
        success: false,
        message: 'Email обязателен'
      });
    }
    
    if (!currentPassword || !newPassword) {
      console.error('Пароли не указаны в запросе');
      return res.status(400).json({
        success: false,
        message: 'Текущий пароль и новый пароль обязательны'
      });
    }
    
    // Получаем пользователя из базы данных
    const user = await getUserByEmail(email);
    
    if (!user) {
      console.error('Пользователь не найден:', email);
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }
    
    // Проверяем текущий пароль
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!passwordMatch) {
      console.error('Неверный текущий пароль для пользователя:', email);
      return res.status(401).json({
        success: false,
        message: 'Неверный текущий пароль'
      });
    }
    
    // Хешируем новый пароль
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Обновляем пароль в базе данных
    await pool.query(`
      UPDATE users 
      SET password = $1
      WHERE email = $2
    `, [hashedPassword, email]);
    
    console.log('Пароль успешно изменен для пользователя:', email);
    
    res.json({
      success: true,
      message: 'Пароль успешно изменен'
    });
  } catch (error) {
    console.error('❌ Ошибка при изменении пароля:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка при изменении пароля',
      error: error.message
    });
  }
});

export default router;