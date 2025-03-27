"use client"

import { useState } from "react"
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
import { registerUser } from "../api"

const Register = ({ setUser }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const navigate = useNavigate()

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError("Пожалуйста, заполните все поля")
      return false
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают")
      return false
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Пожалуйста, введите корректный email")
      return false
    }

    // Проверка сложности пароля
    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов")
      return false
    }

    return true
  }

  const handleRegister = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setError("")

    try {
      const data = await registerUser({ email, password });

      if (data.success) {
        console.log("✅ Регистрация успешна:", data.user)
        localStorage.setItem("user", JSON.stringify(data.user))
        setUser(data.user)
        setOpenSnackbar(true)

        // Небольшая задержка перед переходом для отображения успешного сообщения
        setTimeout(() => {
          navigate("/profile")
        }, 1500)
      } else {
        setError(data.message || "Ошибка регистрации")
      }
    } catch (error) {
      console.error("Ошибка регистрации:", error)
      setError(error.message || "Ошибка соединения с сервером")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false)
  }

  return (
    <Box sx={backgroundStyle}>
      <Container maxWidth="sm" sx={containerStyle}>
        <Typography variant="h5" gutterBottom>
          Регистрация
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
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
          helperText="Минимум 6 символов"
        />
        <TextField
          fullWidth
          margin="normal"
          label="Подтвердите пароль"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isLoading}
          required
          error={confirmPassword !== "" && password !== confirmPassword}
          helperText={confirmPassword !== "" && password !== confirmPassword ? "Пароли не совпадают" : ""}
        />
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleRegister}
          sx={{ mt: 2 }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
              Регистрация...
            </Box>
          ) : (
            "Зарегистрироваться"
          )}
        </Button>
        <Button
          variant="text"
          color="primary"
          fullWidth
          onClick={() => navigate("/login")}
          sx={{ mt: 2 }}
          disabled={isLoading}
        >
          Уже есть аккаунт? Войти
        </Button>
      </Container>

      {/* Индикатор загрузки на весь экран */}
      <Backdrop sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isLoading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Уведомление об успешной регистрации */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
          Регистрация успешно завершена!
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

export default Register

