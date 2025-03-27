import { createContext, useState, useEffect, useContext } from 'react';

// Создаем контекст
const AuthContext = createContext();

// Провайдер контекста
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    const checkAuth = () => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (userData && token) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Функция для входа
  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  // Функция для выхода
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Функция для обновления данных пользователя
  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      loading, 
      login, 
      logout, 
      updateUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста
export const useAuth = () => useContext(AuthContext);

export default AuthContext;