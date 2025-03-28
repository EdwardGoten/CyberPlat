"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Button,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import DeleteIcon from "@mui/icons-material/Delete"
import AddIcon from "@mui/icons-material/Add"
import EditIcon from "@mui/icons-material/Edit"
import { getTeamDetails, removeTeamMember } from "../../api/teamApi"
import AddMemberModal from "./AddMemberModal"

const TeamDetails = ({ team: initialTeam, onBack }) => {
  const [team, setTeam] = useState(initialTeam)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })

  // Загрузка деталей команды
  const loadTeamDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getTeamDetails(team.team_id)

      if (response.success) {
        setTeam(response.team)
        setMembers(response.members)
      } else {
        setError(response.message)
      }
    } catch (error) {
      console.error("Ошибка при загрузке деталей команды:", error)
      setError("Произошла ошибка при загрузке деталей команды")
    } finally {
      setLoading(false)
    }
  }

  // Загружаем детали команды при монтировании компонента
  useEffect(() => {
    loadTeamDetails()
  }, [team.team_id])

  // Проверка, является ли текущий пользователь капитаном команды
  const isCaptain = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    return members.some((member) => member.user_email === user.email && member.role === "captain")
  }

  // Обработчик удаления участника
  const handleRemoveMember = async (memberEmail) => {
    try {
      setLoading(true)

      const response = await removeTeamMember(team.team_id, memberEmail)

      if (response.success) {
        // Обновляем список участников
        setMembers(members.filter((member) => member.user_email !== memberEmail))

        setSnackbar({
          open: true,
          message: "Участник успешно удален из команды",
          severity: "success",
        })
      } else {
        setSnackbar({
          open: true,
          message: response.message,
          severity: "error",
        })
      }
    } catch (error) {
      console.error("Ошибка при удалении участника:", error)
      setSnackbar({
        open: true,
        message: "Произошла ошибка при удалении участника",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  // Обработчик добавления участника
  const handleMemberAdded = () => {
    loadTeamDetails()
    setSnackbar({
      open: true,
      message: "Участник успешно добавлен в команду",
      severity: "success",
    })
  }

  // Обработчик закрытия снэкбара
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({
      ...prev,
      open: false,
    }))
  }

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 1 }} aria-label="Назад к списку команд">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1" sx={{ fontWeight: "bold" }}>
          {team.name}
        </Typography>
      </Box>

      {loading && members.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <Paper sx={{ borderRadius: "12px", overflow: "hidden" }}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
              <Avatar
                src={team.logo ? `http://localhost:5000${team.logo}` : null}
                alt={team.name}
                sx={{ width: 80, height: 80, mr: 2 }}
              >
                {!team.logo && team.name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {team.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {team.country && `${team.country} • `}
                  {team.game}
                </Typography>
              </Box>
              {isCaptain() && (
                <IconButton sx={{ ml: "auto" }} aria-label="Редактировать команду">
                  <EditIcon />
                </IconButton>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 2, fontWeight: "medium" }}>
              Состав команды
            </Typography>

            <List disablePadding>
              {members.map((member) => (
                <ListItem
                  key={member.id}
                  secondaryAction={
                    isCaptain() && member.role !== "captain" ? (
                      <IconButton
                        edge="end"
                        aria-label="Удалить участника"
                        onClick={() => handleRemoveMember(member.user_email)}
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    ) : null
                  }
                  sx={{ px: 0 }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={member.avatar ? `http://localhost:5000${member.avatar}` : null}
                      alt={member.nickname || member.full_name}
                    >
                      {!member.avatar && (member.nickname || member.full_name || "").charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.nickname || member.full_name}
                    secondary={member.role === "captain" ? "Капитан" : ""}
                  />
                </ListItem>
              ))}
            </List>

            {isCaptain() && members.length < 5 && (
              <Button
                variant="text"
                startIcon={<AddIcon />}
                onClick={() => setAddMemberModalOpen(true)}
                sx={{ mt: 2, textTransform: "none", color: "#6366F1" }}
              >
                Добавить участников
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {/* Модальное окно добавления участника */}
      <AddMemberModal
        open={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        teamId={team.team_id}
        onMemberAdded={handleMemberAdded}
      />

      {/* Снэкбар для уведомлений */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default TeamDetails
