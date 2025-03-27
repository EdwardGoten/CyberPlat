// Базовый URL API
const API_URL = 'http://localhost:5000/api';

// Функция для выполнения запросов к API
const fetchAPI = async (endpoint, method = 'GET', data = null) => {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Добавляем токен авторизации, если он есть
    const token = localStorage.getItem('token');
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Добавляем тело запроса для методов, отличных от GET
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    console.log(`Отправка запроса на ${API_URL}${endpoint}`, { 
      method, 
      headers: options.headers,
      body: options.body ? '(данные отправлены)' : undefined 
    }); // Для отладки

    // Выполняем запрос
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    console.log(`Получен ответ от сервера:`, { 
      status: response.status, 
      statusText: response.statusText,
      ok: response.ok
    }); // Для отладки
    
    // Пытаемся получить данные ответа
    let responseData;
    try {
      responseData = await response.json();
      console.log(`Данные ответа:`, responseData); // Для отладки
    } catch (error) {
      console.error('Ошибка при парсинге JSON:', error);
      responseData = { message: 'Ошибка при обработке ответа сервера' };
    }
    
    // Проверяем статус ответа
    if (response.ok) {
      return {
        ...responseData,
        success: true
      };
    }
    
    // Если статус не 2xx, возвращаем ошибку
    return {
      success: false,
      message: responseData.message || `Ошибка: ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    console.error('API Error:', error);
    
    // Проверяем, является ли ошибка проблемой сети
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return {
        success: false,
        message: 'Не удалось подключиться к серверу. Проверьте соединение.',
      };
    }
    
    return {
      success: false,
      message: 'Ошибка соединения с сервером: ' + error.message,
    };
  }
};

// Аутентификация пользователя
export const loginUser = async (email, password) => {
  try {
    console.log('Отправка запроса на вход:', { email, password: '***' });
    
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    // Проверяем тип ответа
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Сервер вернул не JSON ответ:', textResponse);
      return {
        success: false,
        message: 'Сервер вернул неверный формат ответа'
      };
    }

    const data = await response.json();
    console.log('Данные ответа:', data);
    
    if (response.ok) {
      // Сохраняем токен в localStorage (в реальном приложении токен должен приходить с сервера)
      localStorage.setItem('token', data.token || 'dummy-token');
      
      return {
        success: true,
        message: data.message || 'Вход выполнен успешно',
        user: data.user,
        token: data.token || 'dummy-token'
      };
    }
    
    return {
      success: false,
      message: data.message || 'Ошибка при входе'
    };
  } catch (error) {
    console.error('Ошибка при входе:', error);
    
    return {
      success: false,
      message: 'Ошибка соединения с сервером: ' + error.message
    };
  }
};

// Регистрация пользователя
export const registerUser = async (userData) => {
  return await fetchAPI('/users/register', 'POST', userData);
};

// Проверка авторизации пользователя
export const checkAuth = () => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  // Если токен и данные пользователя существуют, считаем пользователя авторизованным
  if (token && user) {
    return { isAuthenticated: true, user };
  }
  
  return { isAuthenticated: false, user: null };
};

// Выход пользователя
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  return { success: true };
};

// Получение профиля пользователя
export const getUserProfile = async () => {
  return await fetchAPI('/users/profile', 'GET');
};

// Обновление профиля пользователя
export const updateUserProfile = async (profileData) => {
  try {
    // Получаем данные пользователя из localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    if (!user.email) {
      console.error('Email пользователя не найден в localStorage');
      return {
        success: false,
        message: 'Ошибка: данные пользователя не найдены'
      };
    }
    
    // Добавляем email пользователя к данным запроса, если его нет
    const requestData = {
      ...profileData,
      email: profileData.email || user.email
    };
    
    console.log('Отправка запроса на обновление профиля:', {
      url: `${API_URL}/users/update`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`
      },
      body: JSON.stringify(requestData)
    });
    
    const response = await fetch(`${API_URL}/users/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`
      },
      body: JSON.stringify(requestData)
    });
    
    // Проверяем тип ответа
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error('Сервер вернул не JSON ответ:', textResponse);
      return {
        success: false,
        message: 'Сервер вернул неверный формат ответа'
      };
    }
    
    const data = await response.json();
    console.log('Данные ответа:', data);
    
    if (response.ok) {
      // Обновляем данные пользователя в localStorage
      const updatedUser = {
        ...user,
        fullName: `${requestData.username || ''} ${requestData.lastName || ''}`.trim(),
        nickname: requestData.nickname || '',
        country: requestData.country || '',
        city: requestData.city || ''
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return {
        success: true,
        message: data.message || 'Профиль успешно обновлен',
        user: data.profile || updatedUser
      };
    }
    
    return {
      success: false,
      message: data.message || 'Ошибка при обновлении профиля'
    };
  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error);
    
    return {
      success: false,
      message: 'Ошибка соединения с сервером: ' + error.message
    };
  }
};

// Обновление пароля пользователя
export const updateUserPassword = async (passwordData) => {
  try {
    // Получаем данные пользователя из localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    if (!user.email) {
      console.error('Email пользователя не найден в localStorage');
      return {
        success: false,
        message: 'Ошибка: данные пользователя не найдены'
      };
    }
    
    // Добавляем email пользователя к данным запроса
    const requestData = {
      ...passwordData,
      email: user.email
    };
    
    console.log('Отправка запроса на обновление пароля:', {
      url: `${API_URL}/users/password`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`
      },
      body: JSON.stringify(requestData)
    });
    
    const response = await fetch(`${API_URL}/users/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`
      },
      body: JSON.stringify(requestData)
    });
    
    // Проверяем тип ответа
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Сервер вернул не JSON ответ:', await response.text());
      return {
        success: false,
        message: 'Сервер вернул неверный формат ответа'
      };
    }
    
    const data = await response.json();
    console.log('Данные ответа:', data);
    
    if (response.ok) {
      return {
        success: true,
        message: data.message || 'Пароль успешно обновлен'
      };
    }
    
    return {
      success: false,
      message: data.message || 'Ошибка при обновлении пароля'
    };
  } catch (error) {
    console.error('Ошибка при обновлении пароля:', error);
    
    return {
      success: false,
      message: 'Ошибка соединения с сервером: ' + error.message
    };
  }
};

// Получение новостей
export const getNews = async () => {
  return await fetchAPI('/news', 'GET');
};