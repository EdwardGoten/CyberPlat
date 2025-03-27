import pool from '../database.js';
import bcrypt from 'bcrypt';

// Получение пользователя по email
async function getUserByEmail(email) {
  try {
    console.log(`Поиск пользователя с email: ${email}`);
    
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    console.log(`Результат поиска: ${result.rows.length > 0 ? 'пользователь найден' : 'пользователь не найден'}`);
    
    return result.rows[0];
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    throw error;
  }
}

// Регистрация нового пользователя
async function registerUser(userData) {
  try {
    console.log('Регистрация нового пользователя:', { ...userData, password: '***' });
    
    // Хеширование пароля
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
    
    const result = await pool.query(
      `INSERT INTO users (
        email, password, full_name, nickname, country, city, registered_at, last_login
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING user_id`,
      [
        userData.email,
        hashedPassword,
        userData.fullName || '',
        userData.nickname || '',
        userData.country || '',
        userData.city || '',
        new Date(),
        new Date()
      ]
    );
    
    console.log(`Пользователь зарегистрирован с ID: ${result.rows[0].user_id}`);
    
    return result.rows[0].user_id;
  } catch (error) {
    console.error('Ошибка при регистрации пользователя:', error);
    throw error;
  }
}

// Аутентификация пользователя
// Аутентификация пользователя
async function authenticateUser(email, password) {
    try {
      console.log(`Попытка аутентификации пользователя с email: ${email}`);
      
      const user = await getUserByEmail(email);
      
      if (!user) {
        console.log('Пользователь не найден');
        return { success: false, message: 'Пользователь не найден' };
      }
      
      // Проверка пароля
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        console.log('Неверный пароль');
        return { success: false, message: 'Неверный пароль' };
      }
      
      // Обновляем время последнего входа
      await pool.query(
        'UPDATE users SET last_login = $1 WHERE user_id = $2',
        [new Date(), user.user_id]
      );
      
      console.log('Аутентификация успешна');
      
      return { 
        success: true, 
        user: {
          userId: user.user_id,
          email: user.email,
          fullName: user.full_name,
          nickname: user.nickname,
          country: user.country,
          city: user.city
        } 
      };
    } catch (error) {
      console.error('Ошибка при аутентификации пользователя:', error);
      throw error;
    }
  }

export { getUserByEmail, registerUser, authenticateUser };