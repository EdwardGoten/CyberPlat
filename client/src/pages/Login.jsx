"use client"

import { useState, useEffect } from "react"
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Backdrop,
  Snackbar,
  Alert,
} from "@mui/material"
import { useNavigate } from "react-router-dom"
import { loginUser } from "../api" // Импортируем функцию для входа

const Login = ({ setUser }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [initialCheck, setInitialCheck] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const savedUser = localStorage.getItem("user")
        if (savedUser) {
          setUser(JSON.parse(savedUser))
          navigate("/profile")
        }
      } finally {
        setInitialCheck(false)
      }
    }

    checkUser()
  }, [setUser, navigate])

  const handleLogin = async () => {
    // Базовая валидация
    if (!email || !password) {
      setError("Пожалуйста, заполните все поля")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Используем функцию из API вместо прямого fetch
      const data = await loginUser({ email, password })

      if (data.success) {
        console.log("✅ Успешный вход:", data.user)
        localStorage.setItem("user", JSON.stringify(data.user))
        setUser(data.user)
        setOpenSnackbar(true)

        // Небольшая задержка перед переходом для отображения успешного сообщения
        setTimeout(() => {
          navigate("/profile")
        }, 1000)
      } else {
        setError(data.message || "Ошибка входа")
      }
    } catch (error) {
      console.error("Ошибка авторизации:", error)
      setError(error.message || "Ошибка соединения с сервером")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false)
  }

  // Показываем индикатор загрузки при первоначальной проверке
  if (initialCheck) {
    return (
      <Box sx={loadingContainerStyle}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Проверка авторизации...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={backgroundStyle}>
      <Container maxWidth="sm" sx={containerStyle}>
        <Typography variant="h5" gutterBottom>
          Вход в аккаунт
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          margin="normal"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
        <Button variant="contained" color="primary" fullWidth onClick={handleLogin} sx={{ mt: 2 }} disabled={isLoading}>
          {isLoading ? (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
              Вход...
            </Box>
          ) : (
            "Войти"
          )}
        </Button>
        <Button
          variant="contained"
          color="secondary"
          fullWidth
          onClick={() => navigate("/register")}
          sx={{ mt: 2 }}
          disabled={isLoading}
        >
          Зарегистрироваться
        </Button>
      </Container>

      {/* Индикатор загрузки на весь экран */}
      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Уведомление об успешном входе */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
          Вход выполнен успешно!
        </Alert>
      </Snackbar>
    </Box>
  )
}

// Стили
const backgroundStyle = {
  minHeight: "100vh",
  width: "100vw",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#f4f4f4",
}

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  borderRadius: "10px",
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
}

const loadingContainerStyle = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "100vh",
  width: "100vw",
  backgroundColor: "#f4f4f4",
}

export default Login