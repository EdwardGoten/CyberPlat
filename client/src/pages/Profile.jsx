"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Avatar,
  TextField,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import EditIcon from "@mui/icons-material/Edit"
import GroupsIcon from "@mui/icons-material/Groups"
import LogoutIcon from "@mui/icons-material/Logout"
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos"
import CloudUploadIcon from "@mui/icons-material/CloudUpload"
import { getUserProfile, updateUserProfile, updateUserPassword } from "../api"
import { useAuth } from '../context/AuthContext.jsx';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSection, setActiveSection] = useState("profile")
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    lastName: "",
    nickname: "",
    country: "",
    city: "",
    email: "",
    oldPassword: "",
    newPassword: "",
    confirmPassword: "", // Добавляем поле для подтверждения пароля
  })
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })
  const [passwordLoading, setPasswordLoading] = useState(false) // Отдельное состояние загрузки для смены пароля
  const navigate = useNavigate()

  // Функция для проверки аутентификации и загрузки профиля
  const checkAuth = async () => {
    try {
      setLoading(true)
      setError(null)

      // Проверяем, есть ли данные пользователя в localStorage
      const userData = localStorage.getItem('user');
      if (!userData) {
        // Если пользователь не авторизован, перенаправляем на страницу входа
        navigate('/login');
        return;
      }

      // Парсим данные пользователя
      const user = JSON.parse(userData);
      
      // Если нет API для получения профиля, используем данные из localStorage
      if (!getUserProfile) {
        const userProfile = {
          userId: user.userId,
          email: user.email,
          username: user.fullName?.split(' ')[0] || '',
          lastName: user.fullName?.split(' ')[1] || '',
          nickname: user.nickname || '',
          country: user.country || '',
          city: user.city || '',
        };
        
        setProfile(userProfile);
        setFormData({
          username: userProfile.username || "",
          lastName: userProfile.lastName || "",
          nickname: userProfile.nickname || "",
          country: userProfile.country || "",
          city: userProfile.city || "",
          email: userProfile.email || "",
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        console.log("✅ Профиль загружен из localStorage:", userProfile);
        setLoading(false);
        return;
      }

      // Получаем профиль пользователя через API
      const data = await getUserProfile();

      if (data.success) {
        setProfile(data.profile)
        setFormData({
          username: data.profile.username || "",
          lastName: data.profile.lastName || "",
          nickname: data.profile.nickname || "",
          country: data.profile.country || "",
          city: data.profile.city || "",
          email: data.profile.email || "",
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        console.log("✅ Профиль успешно загружен:", data.profile)
      } else {
        throw new Error(data.message || "Ошибка загрузки профиля")
      }
    } catch (error) {
      console.error("❌ Ошибка при запросе профиля:", error)
      
      // Если API не работает, используем данные из localStorage
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userProfile = {
          userId: userData.userId,
          email: userData.email,
          username: userData.fullName?.split(' ')[0] || '',
          lastName: userData.fullName?.split(' ')[1] || '',
          nickname: userData.nickname || '',
          country: userData.country || '',
          city: userData.city || '',
        };
        
        setProfile(userProfile);
        setFormData({
          username: userProfile.username || "",
          lastName: userProfile.lastName || "",
          nickname: userProfile.nickname || "",
          country: userProfile.country || "",
          city: userProfile.city || "",
          email: userProfile.email || "",
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        console.log("✅ Профиль загружен из localStorage (резервный вариант):", userProfile);
      } catch (localStorageError) {
        setError(error.message || "Произошла ошибка при загрузке профиля")
      }
    } finally {
      setLoading(false)
    }
  }

  // Загружаем профиль при монтировании компонента
  useEffect(() => {
    checkAuth()
  }, [])

  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

// Обработчик сохранения изменений
// Обработчик сохранения изменений
const handleSave = async () => {
  try {
    setLoading(true);
    console.log("Отправка данных профиля:", {
      email: formData.email,
      username: formData.username,
      lastName: formData.lastName,
      nickname: formData.nickname,
      country: formData.country,
      city: formData.city,
    });

    // Проверяем, доступна ли функция API
    if (typeof updateUserProfile !== 'function') {
      console.warn("Функция updateUserProfile не определена, обновляем только localStorage");
      
      // Обновляем данные в localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUserData = {
        ...userData,
        nickname: formData.nickname,
        fullName: `${formData.username} ${formData.lastName}`.trim(),
        country: formData.country,
        city: formData.city,
      };
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      // Обновляем локальное состояние
      setProfile((prev) => ({
        ...prev,
        username: formData.username,
        lastName: formData.lastName,
        nickname: formData.nickname,
        country: formData.country,
        city: formData.city,
      }));
      
      // Обновляем данные пользователя в контексте
      updateUser({
        fullName: `${formData.username} ${formData.lastName}`.trim(),
        nickname: formData.nickname,
        country: formData.country,
        city: formData.city,
      });
      
      setEditMode(false);
      setSnackbar({
        open: true,
        message: "Профиль успешно обновлен",
        severity: "success",
      });
      
      setLoading(false);
      return;
    }

    // Отправляем данные на сервер через API
    const response = await updateUserProfile({
      email: formData.email,
      username: formData.username,
      lastName: formData.lastName,
      nickname: formData.nickname,
      country: formData.country,
      city: formData.city,
    });

    console.log("Ответ на запрос обновления профиля:", response);

    if (response.success) {
      // Обновляем локальное состояние
      setProfile((prev) => ({
        ...prev,
        username: formData.username,
        lastName: formData.lastName,
        nickname: formData.nickname,
        country: formData.country,
        city: formData.city,
      }));

      // Обновляем данные пользователя в контексте
      updateUser({
        fullName: `${formData.username} ${formData.lastName}`.trim(),
        nickname: formData.nickname,
        country: formData.country,
        city: formData.city,
      });

      setEditMode(false);
      setSnackbar({
        open: true,
        message: "Профиль успешно обновлен",
        severity: "success",
      });
    } else {
      throw new Error(response.message || "Ошибка при обновлении профиля");
    }
  } catch (error) {
    console.error("❌ Ошибка при обновлении профиля:", error);
    
    // Пробуем обновить только localStorage
    try {
      // Обновляем данные в localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUserData = {
        ...userData,
        nickname: formData.nickname,
        fullName: `${formData.username} ${formData.lastName}`.trim(),
        country: formData.country,
        city: formData.city,
      };
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      // Обновляем локальное состояние
      setProfile((prev) => ({
        ...prev,
        username: formData.username,
        lastName: formData.lastName,
        nickname: formData.nickname,
        country: formData.country,
        city: formData.city,
      }));
      
      // Обновляем данные пользователя в контексте
      updateUser({
        fullName: `${formData.username} ${formData.lastName}`.trim(),
        nickname: formData.nickname,
        country: formData.country,
        city: formData.city,
      });
      
      setEditMode(false);
      setSnackbar({
        open: true,
        message: "Профиль обновлен локально (сервер недоступен)",
        severity: "warning",
      });
    } catch (localStorageError) {
      setSnackbar({
        open: true,
        message: error.message || "Ошибка при обновлении профиля",
        severity: "error",
      });
    }
  } finally {
    setLoading(false);
  }
};

  // Обработчик изменения пароля
  const handlePasswordChange = async () => {
  // Проверяем, что все поля заполнены
  if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
    setSnackbar({
      open: true,
      message: "Пожалуйста, заполните все поля для смены пароля",
      severity: "error",
    });
    return;
  }

  // Проверяем, что новый пароль и подтверждение совпадают
  if (formData.newPassword !== formData.confirmPassword) {
    setSnackbar({
      open: true,
      message: "Новый пароль и подтверждение не совпадают",
      severity: "error",
    });
    return;
  }

  try {
    setPasswordLoading(true);
    console.log("Отправка запроса на изменение пароля");

    // Проверяем, доступна ли функция API
    if (typeof updateUserPassword !== 'function') {
      console.warn("Функция updateUserPassword не определена");
      setSnackbar({
        open: true,
        message: "Функция смены пароля временно недоступна",
        severity: "warning",
      });
      setPasswordLoading(false);
      return;
    }

    // Отправляем запрос на изменение пароля
    const response = await updateUserPassword({
      currentPassword: formData.oldPassword,
      newPassword: formData.newPassword,
    });

    console.log("Ответ на запрос изменения пароля:", response);

    if (response.success) {
      // Очищаем поля пароля
      setFormData(prev => ({
        ...prev,
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setSnackbar({
        open: true,
        message: "Пароль успешно изменен",
        severity: "success",
      });
    } else {
      throw new Error(response.message || "Ошибка при изменении пароля");
    }
  } catch (error) {
    console.error("❌ Ошибка при изменении пароля:", error);
    setSnackbar({
      open: true,
      message: error.message || "Ошибка при изменении пароля",
      severity: "error",
    });
  } finally {
    setPasswordLoading(false);
  }
};

  // Обработчик загрузки фото
  const handleUploadPhoto = () => {
    // Здесь будет логика загрузки фото
    setSnackbar({
      open: true,
      message: "Функция загрузки фото будет доступна позже",
      severity: "info",
    })
  }

  // Обработчик выхода из аккаунта
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Обработчик закрытия снэкбара
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }))
  }

  // Если идет загрузка, показываем индикатор
  if (loading && !profile) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ backgroundColor: "#f5f5f5", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={3}>
          {/* Левая колонка - информация о пользователе и меню */}
          <Grid item xs={12} md={4} lg={3}>
            <Paper sx={{ p: 3, mb: 3, borderRadius: "12px" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Avatar src={profile?.avatar} alt={profile?.username} sx={{ width: 60, height: 60, mr: 2 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {profile?.nickname || "Пользователь"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profile?.username} {profile?.lastName}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Меню навигации */}
            <Paper sx={{ borderRadius: "12px", overflow: "hidden" }}>
              <List disablePadding>
                <ListItem
                  button
                  onClick={() => {
                    setActiveSection("profile")
                    setEditMode(true)
                  }}
                  sx={{
                    py: 2,
                    backgroundColor: activeSection === "profile" && editMode ? "#f0f7ff" : "transparent",
                    "&:hover": { backgroundColor: "#f0f7ff" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <EditIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: activeSection === "profile" && editMode ? "bold" : "normal",
                          color: "#4169E1",
                        }}
                      >
                        РЕДАКТИРОВАТЬ ПРОФИЛЬ
                      </Typography>
                    }
                  />
                  <ArrowForwardIosIcon sx={{ fontSize: 16, color: "#999" }} />
                </ListItem>

                <Divider />

                <ListItem
                  button
                  onClick={() => setActiveSection("teams")}
                  sx={{
                    py: 2,
                    backgroundColor: activeSection === "teams" ? "#f0f7ff" : "transparent",
                    "&:hover": { backgroundColor: "#f0f7ff" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <GroupsIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: activeSection === "teams" ? "bold" : "normal", color: "#4169E1" }}
                      >
                        МОИ КОМАНДЫ
                      </Typography>
                    }
                  />
                  <ArrowForwardIosIcon sx={{ fontSize: 16, color: "#999" }} />
                </ListItem>

                <Divider />

                <ListItem
                  button
                  onClick={handleLogout}
                  sx={{
                    py: 2,
                    "&:hover": { backgroundColor: "#f0f7ff" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <LogoutIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" sx={{ color: "#f44336" }}>
                        ВЫЙТИ
                      </Typography>
                    }
                  />
                  <ArrowForwardIosIcon sx={{ fontSize: 16, color: "#999" }} />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Правая колонка - содержимое активного раздела */}
          <Grid item xs={12} md={8} lg={9}>
            {activeSection === "profile" && (
              <Paper sx={{ p: 4, borderRadius: "12px" }}>
                {/* Аватар и кнопка загрузки фото */}
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
                  <Avatar
                    src={profile?.avatar}
                    alt={profile?.username}
                    sx={{ width: 120, height: 120, mb: 2, bgcolor: "#222" }}
                  >
                    {!profile?.avatar && (profile?.username?.[0] || "U")}
                  </Avatar>
                  <Button
                    variant="text"
                    startIcon={<CloudUploadIcon />}
                    onClick={handleUploadPhoto}
                    sx={{ color: "#4169E1", textTransform: "uppercase" }}
                  >
                    Загрузить фото
                  </Button>
                </Box>

                <Grid container spacing={3}>
                  {/* Имя */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Имя"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={!editMode || loading}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </Grid>

                  {/* Фамилия */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Фамилия"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={!editMode || loading}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </Grid>

                  {/* Никнейм */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Никнейм"
                      name="nickname"
                      value={formData.nickname}
                      onChange={handleChange}
                      disabled={!editMode || loading}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </Grid>

                  {/* Страна */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Страна"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      disabled={!editMode || loading}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </Grid>

                  {/* Город */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Город"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={!editMode || loading}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </Grid>

                  {/* Email (неизменяемый) */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      value={formData.email}
                      disabled={true}
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </Grid>

                  {/* Изменение пароля */}
                  {editMode && (
                    <>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" sx={{ mb: 2 }}>
                          Изменение пароля
                        </Typography>
                      </Grid>

                      {/* Старый пароль */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          type="password"
                          label="Старый пароль"
                          name="oldPassword"
                          value={formData.oldPassword}
                          onChange={handleChange}
                          disabled={loading || passwordLoading}
                          variant="outlined"
                          sx={{ mb: 2 }}
                          placeholder="Введите старый пароль"
                        />
                      </Grid>

                      {/* Новый пароль */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="password"
                          label="Новый пароль"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          disabled={loading || passwordLoading}
                          variant="outlined"
                          sx={{ mb: 2 }}
                          placeholder="Введите новый пароль"
                        />
                      </Grid>

                      {/* Подтверждение нового пароля */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          type="password"
                          label="Подтверждение пароля"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          disabled={loading || passwordLoading}
                          variant="outlined"
                          sx={{ mb: 2 }}
                          placeholder="Повторите новый пароль"
                          error={formData.newPassword !== formData.confirmPassword && formData.confirmPassword !== ''}
                          helperText={formData.newPassword !== formData.confirmPassword && formData.confirmPassword !== '' ? "Пароли не совпадают" : ""}
                        />
                      </Grid>

                      {/* Кнопка изменения пароля */}
                      <Grid item xs={12}>
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                          <Button
                            variant="contained"
                            onClick={handlePasswordChange}
                            disabled={loading || passwordLoading || !formData.oldPassword || !formData.newPassword || !formData.confirmPassword || formData.newPassword !== formData.confirmPassword}
                            sx={{ bgcolor: "#4169E1" }}
                          >
                            {passwordLoading ? <CircularProgress size={24} /> : "Изменить пароль"}
                          </Button>
                        </Box>
                      </Grid>
                    </>
                  )}

                  {/* Кнопки действий для профиля */}
                  <Grid item xs={12}>
                    <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                      {editMode ? (
                        <>
                          <Button
                            variant="outlined"
                            onClick={() => setEditMode(false)}
                            disabled={loading}
                            sx={{ mr: 2 }}
                          >
                            Отмена
                          </Button>
                          <Button
                            variant="contained"
                            onClick={handleSave}
                            disabled={loading}
                            sx={{ bgcolor: "#4169E1" }}
                          >
                            {loading ? <CircularProgress size={24} /> : "Сохранить"}
                          </Button>
                        </>
                      ) : (
                        <Button variant="contained" onClick={() => setEditMode(true)} sx={{ bgcolor: "#4169E1" }}>
                          Редактировать
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {activeSection === "teams" && (
              <Paper sx={{ p: 4, borderRadius: "12px" }}>
                <Typography variant="h5" sx={{ mb: 3 }}>
                  Мои команды
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Раздел находится в разработке. Скоро здесь появится возможность управления командами.
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Уведомления */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Profile