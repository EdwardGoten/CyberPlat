"use client"

import { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Avatar,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate"
import { createTeam } from "../../api/teamApi"

// Список стран для выбора
const countries = [
  "Россия",
  "Украина",
  "Беларусь",
  "Казахстан",
  "США",
  "Германия",
  "Франция",
  "Великобритания",
  "Китай",
  "Япония",
  "Южная Корея",
  "Другая",
]

// Список игр для выбора
const games = [
  "Counter-Strike 2",
  "Dota 2",
  "League of Legends",
  "Valorant",
  "Overwatch 2",
  "PUBG",
  "Fortnite",
  "Apex Legends",
  "Rainbow Six Siege",
  "Rocket League",
  "Другая",
]

const CreateTeamModal = ({ open, onClose, onTeamCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    game: "",
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Обработчик выбора файла логотипа
  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Проверка типа файла
    if (!file.type.startsWith("image/")) {
      setError("Пожалуйста, выберите изображение")
      return
    }

    // Проверка размера файла (макс. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Размер изображения не должен превышать 5MB")
      return
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  // Обработчик отправки формы
  const handleSubmit = async () => {
    // Проверка обязательных полей
    if (!formData.name.trim()) {
      setError("Название команды обязательно")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await createTeam({
        ...formData,
        logo: logoFile,
      })

      if (response.success) {
        // Сбрасываем форму
        setFormData({
          name: "",
          country: "",
          game: "",
        })
        setLogoFile(null)
        setLogoPreview(null)

        // Закрываем модальное окно и уведомляем родителя
        onClose()
        if (onTeamCreated) {
          onTeamCreated()
        }
      } else {
        setError(response.message)
      }
    } catch (error) {
      console.error("Ошибка при создании команды:", error)
      setError("Произошла ошибка при создании команды")
    } finally {
      setLoading(false)
    }
  }

  // Обработчик закрытия модального окна
  const handleClose = () => {
    // Сбрасываем состояние
    setFormData({
      name: "",
      country: "",
      game: "",
    })
    setLogoFile(null)
    setLogoPreview(null)
    setError(null)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "12px" },
      }}
    >
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: "bold" }}>
          Создание команды
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mr: { sm: 3 },
              mb: { xs: 3, sm: 0 },
            }}
          >
            <Box
              sx={{
                width: 160,
                height: 160,
                borderRadius: "8px",
                border: "1px dashed #ccc",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mb: 1,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {logoPreview ? (
                <Avatar
                  src={logoPreview}
                  alt="Логотип команды"
                  variant="square"
                  sx={{ width: "100%", height: "100%" }}
                />
              ) : (
                <AddPhotoAlternateIcon sx={{ fontSize: 40, color: "#999" }} />
              )}
            </Box>
            <Button component="label" variant="text" size="small" sx={{ textTransform: "none" }}>
              Добавить фото
              <input type="file" accept="image/*" hidden onChange={handleLogoChange} />
            </Button>
          </Box>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              label="Введите название"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              variant="outlined"
              required
              error={error && !formData.name.trim()}
              helperText={error && !formData.name.trim() ? "Название команды обязательно" : ""}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Выберите страну</InputLabel>
              <Select name="country" value={formData.country} onChange={handleChange} label="Выберите страну">
                {countries.map((country) => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Выберите игру</InputLabel>
              <Select name="game" value={formData.game} onChange={handleChange} label="Выберите игру">
                {games.map((game) => (
                  <MenuItem key={game} value={game}>
                    {game}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Придумайте название вашей команды. Минимальный размер аватара: 160×160px
        </Typography>
        {error && !error.includes("Название команды") && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          fullWidth
          sx={{
            bgcolor: "#6366F1",
            "&:hover": { bgcolor: "#4F46E5" },
            borderRadius: "8px",
            py: 1,
          }}
        >
          {loading ? <CircularProgress size={24} /> : "Сохранить"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CreateTeamModal
