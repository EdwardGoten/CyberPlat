const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  try {
    // Получение токена из заголовка
    const authHeader = req.headers.authorization;
    
    console.log('Auth middleware - заголовок авторизации:', authHeader ? 'Присутствует' : 'Отсутствует');
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Нет токена, авторизация отклонена' });
    }
    
    // Проверка формата токена
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('Неверный формат токена:', authHeader);
      return res.status(401).json({ message: 'Неверный формат токена' });
    }
    
    const token = parts[1];
    console.log('Токен получен, проверка...');

    // Верификация токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Добавление данных пользователя в объект запроса
    req.user = decoded;
    console.log('Токен верифицирован, ID пользователя:', decoded.id);
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Токен недействителен: ' + err.message });
  }
};