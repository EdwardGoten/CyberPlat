"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  IconButton,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  CircularProgress,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import { searchUsersByNickname, addTeamMember } from "../../api/teamApi"

const AddMemberModal = ({ open, onClose, teamId, onMemberAdded }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [addingMember, setAddingMember] = useState(false)

  // Поиск пользователей при изменении запроса
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }

      try {
        setLoading(true)
        setError(null)

        const response = await searchUsersByNickname(searchQuery)

        if (response.success) {
          setSearchResults(response.users)
        } else {
          setError(response.message)
          setSearchResults([])
        }
      } catch (error) {
        console.error("Ошибка при поиске пользователей:", error)
        setError("Произошла ошибка при поиске пользователей")
        setSearchResults([])
      } finally {
        setLoading(false)
      }
    }

    // Используем debounce для предотвращения слишком частых запросов
    const timeoutId = setTimeout(searchUsers, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // Обработчик выбора пользователя
  const handleSelectUser = (user) => {
    setSelectedUser(user)
  }

  // Обработчик добавления участника
  const handleAddMember = async () => {
    if (!selectedUser) return

    try {
      setAddingMember(true)

      const response = await addTeamMember(teamId, selectedUser.nickname)

      if (response.success) {
        // Закрываем модальное окно и уведомляем родителя
        handleClose()
        if (onMemberAdded) {
          onMemberAdded()
        }
      } else {
        setError(response.message)
      }
    } catch (error) {
      console.error("Ошибка при добавлении участника:", error)
      setError("Произошла ошибка при добавлении участника")
    } finally {
      setAddingMember(false)
    }
  }

  // Обработчик закрытия модального окна
  const handleClose = () => {
    setSearchQuery("")
    setSearchResults([])
    setSelectedUser(null)
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
          Добавить участников
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Введите имя"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
        />

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : searchResults.length > 0 ? (
          <List>
            {searchResults.map((user) => (
              <ListItem
                key={user.email}
                button
                selected={selectedUser?.email === user.email}
                onClick={() => handleSelectUser(user)}
                sx={{
                  borderRadius: "8px",
                  mb: 1,
                  "&.Mui-selected": {
                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                    "&:hover": {
                      backgroundColor: "rgba(99, 102, 241, 0.2)",
                    },
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={user.avatar ? `http://localhost:5000${user.avatar}` : null}
                    alt={user.nickname || user.full_name}
                  >
                    {!user.avatar && (user.nickname || user.full_name || "").charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={user.nickname} secondary={user.full_name} />
              </ListItem>
            ))}
          </List>
        ) : searchQuery && !loading ? (
          <Typography color="text.secondary" sx={{ textAlign: "center", my: 2 }}>
            Результат не найден
          </Typography>
        ) : null}

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        {selectedUser && (
          <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleAddMember}
              disabled={addingMember}
              sx={{
                bgcolor: "#6366F1",
                "&:hover": { bgcolor: "#4F46E5" },
                borderRadius: "8px",
              }}
            >
              {addingMember ? <CircularProgress size={24} /> : "Добавить"}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AddMemberModal
