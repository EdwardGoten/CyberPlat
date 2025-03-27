import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, checkAuth } from "../api";
import { useAuth } from '../context/AuthContext.jsx';
import {
  Box,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
} from "@mui/material";
import EmailIcon from '@mui/icons-material/Email';
import KeyIcon from '@mui/icons-material/Key';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import "./auth-page.css"; // Добавим CSS файл для дополнительных стилей

const AuthPage = () => {
  const { login } = useAuth(); // Перемещено в начало компонента
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(''); // Добавлено состояние для ошибок
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Состояние формы входа
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // Состояние формы регистрации
  const [registerForm, setRegisterForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    nickname: "",
    country: "",
    city: "",
  });

  // Проверка авторизации при загрузке страницы
  useEffect(() => {
    const { isAuthenticated } = checkAuth();
    if (isAuthenticated) {
      navigate("/profile");
    }
  }, [navigate]);

  // Обработчик изменения полей формы входа
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Обработчик изменения полей формы регистрации
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Обработчик отправки формы входа
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage(null); // Очищаем сообщение

    try {
      const { email, password } = loginForm;
      
      if (!email || !password) {
        throw new Error('Пожалуйста, заполните все поля');
      }

      console.log('Отправка запроса на вход:', { email, password: '***' });
      const response = await loginUser(email, password);
      console.log('Ответ на запрос входа:', response);
      
      if (response.success) {
        console.log('Успешный вход:', response);
        
        // Используем функцию login из контекста
        login(response.user, response.token || 'dummy-token');
        
        // Показываем сообщение об успехе
        setMessage({
          type: 'success',
          text: 'Вход выполнен успешно!'
        });
        
        // Перенаправляем на страницу профиля
        navigate('/profile');
      } else {
        throw new Error(response.message || 'Ошибка при входе');
      }
    } catch (error) {
      console.error('Ошибка при входе:', error);
      setError(error.message || 'Произошла ошибка при входе');
      setMessage({
        type: 'error',
        text: error.message || 'Произошла ошибка при входе'
      });
    } finally {
      setLoading(false);
    }
  };

  // Обработчик отправки формы регистрации
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage(null); // Очищаем сообщение

    try {
      const { email, password, confirmPassword, fullName, nickname, country, city } = registerForm;
      
      if (!email || !password || !confirmPassword || !fullName) {
        throw new Error('Пожалуйста, заполните все обязательные поля');
      }

      if (password !== confirmPassword) {
        throw new Error('Пароли не совпадают');
      }

      console.log('Отправка запроса на регистрацию:', { 
        email, 
        password: '***', 
        fullName, 
        nickname,
        country,
        city
      });
      
      const response = await registerUser({
        email,
        password,
        fullName,
        nickname,
        country,
        city
      });
      
      console.log('Ответ на запрос регистрации:', response);
      
      if (response.success) {
        console.log('Успешная регистрация:', response);
        
        // Используем функцию login из контекста
        login(response.user, response.token || 'dummy-token');
        
        // Показываем сообщение об успехе
        setMessage({
          type: 'success',
          text: 'Регистрация выполнена успешно!'
        });
        
        // Перенаправляем на страницу профиля
        navigate('/profile');
      } else {
        throw new Error(response.message || 'Ошибка при регистрации');
      }
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      setError(error.message || 'Произошла ошибка при регистрации');
      setMessage({
        type: 'error',
        text: error.message || 'Произошла ошибка при регистрации'
      });
    } finally {
      setLoading(false);
    }
  };

  // Переключение видимости пароля
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Обработчик изменения вкладки
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setMessage(null);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-form-container">
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          className="auth-tabs"
        >
          <Tab label="ВХОД" />
          <Tab label="РЕГИСТРАЦИЯ" />
        </Tabs>

        {message && (
          <div className="auth-message">
            <Alert severity={message.type === "error" ? "error" : "success"}>
              {message.text}
            </Alert>
          </div>
        )}

        {activeTab === 0 && (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="form-field">
              <Typography variant="body2" className="field-label">
                Email *
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                required
                placeholder="Введите email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon className="field-icon" />
                    </InputAdornment>
                  ),
                }}
                className="auth-input"
              />
            </div>

            <div className="form-field">
              <Typography variant="body2" className="field-label">
                Пароль *
              </Typography>
              <TextField
                fullWidth
                name="password"
                type={showPassword ? "text" : "password"}
                value={loginForm.password}
                onChange={handleLoginChange}
                required
                placeholder="Введите пароль"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon className="field-icon" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                className="auth-input"
              />
            </div>

            <div className="forgot-password">
              <Typography variant="body2">
                Забыл пароль. <Button color="primary" className="reset-link">Восстановить</Button>
              </Typography>
            </div>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              className="submit-button"
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "ВОЙТИ"}
            </Button>
          </form>
        )}

        {activeTab === 1 && (
          <form onSubmit={handleRegisterSubmit} className="auth-form">
            <div className="form-field">
              <Typography variant="body2" className="field-label">
                Email *
              </Typography>
              <TextField
                fullWidth
                name="email"
                type="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                required
                placeholder="Введите email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon className="field-icon" />
                    </InputAdornment>
                  ),
                }}
                className="auth-input"
              />
            </div>

            <div className="form-field">
              <Typography variant="body2" className="field-label">
                Пароль *
              </Typography>
              <TextField
                fullWidth
                name="password"
                type={showPassword ? "text" : "password"}
                value={registerForm.password}
                onChange={handleRegisterChange}
                required
                placeholder="Введите пароль"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon className="field-icon" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility} edge="end">
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                className="auth-input"
              />
            </div>

            <div className="form-field">
              <Typography variant="body2" className="field-label">
                Подтверждение пароля *
              </Typography>
              <TextField
                fullWidth
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={registerForm.confirmPassword}
                onChange={handleRegisterChange}
                required
                placeholder="Повторите пароль"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyIcon className="field-icon" />
                    </InputAdornment>
                  ),
                }}
                className="auth-input"
                error={registerForm.password !== registerForm.confirmPassword && registerForm.confirmPassword !== ''}
                helperText={registerForm.password !== registerForm.confirmPassword && registerForm.confirmPassword !== '' ? "Пароли не совпадают" : ""}
              />
            </div>

            <div className="form-field">
              <Typography variant="body2" className="field-label">
                Полное имя
              </Typography>
              <TextField
                fullWidth
                name="fullName"
                value={registerForm.fullName}
                onChange={handleRegisterChange}
                placeholder="Введите полное имя"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon className="field-icon" />
                    </InputAdornment>
                  ),
                }}
                className="auth-input"
              />
            </div>

            <div className="form-field">
              <Typography variant="body2" className="field-label">
                Никнейм
              </Typography>
              <TextField
                fullWidth
                name="nickname"
                value={registerForm.nickname}
                onChange={handleRegisterChange}
                placeholder="Введите никнейм"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon className="field-icon" />
                    </InputAdornment>
                  ),
                }}
                className="auth-input"
              />
            </div>

            <div className="form-field">
              <Typography variant="body2" className="field-label">
                Страна
              </Typography>
              <TextField
                fullWidth
                name="country"
                value={registerForm.country}
                onChange={handleRegisterChange}
                placeholder="Введите страну"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon className="field-icon" />
                    </InputAdornment>
                  ),
                }}
                className="auth-input"
              />
            </div>

            <div className="form-field">
              <Typography variant="body2" className="field-label">
                Город
              </Typography>
              <TextField
                fullWidth
                name="city"
                value={registerForm.city}
                onChange={handleRegisterChange}
                placeholder="Введите город"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOnIcon className="field-icon" />
                    </InputAdornment>
                  ),
                }}
                className="auth-input"
              />
            </div>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              className="submit-button"
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "ЗАРЕГИСТРИРОВАТЬСЯ"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;