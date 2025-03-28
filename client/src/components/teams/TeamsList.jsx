"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import { getUserTeams } from "../../api/teamApi"
import CreateTeamModal from "./CreateTeamModal"
import TeamDetails from "./TeamDetails"

const TeamsList = () => {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })

  // Загрузка команд пользователя
  const loadTeams = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getUserTeams()

      if (response.success) {
        setTeams(response.teams)
      } else {
        setError(response.message)
      }
    } catch (error) {
      console.error("Ошибка при загрузке команд:", error)
      setError("Произошла ошибка при загрузке команд")
    } finally {
      setLoading(false)
    }
  }

  // Загружаем команды при монтировании компонента
  useEffect(() => {
    loadTeams()
  }, [])

  // Обработчик создания команды
  const handleTeamCreated = () => {
    loadTeams()
    setSnackbar({
      open: true,
      message: "Команда успешно создана",
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

  // Обработчик выбора команды
  const handleSelectTeam = (team) => {
    setSelectedTeam(team)
  }

  // Обработчик возврата к списку команд
  const handleBackToList = () => {
    setSelectedTeam(null)
    loadTeams() // Обновляем список команд
  }

  // Если выбрана команда, показываем её детали
  if (selectedTeam) {
    return <TeamDetails team={selectedTeam} onBack={handleBackToList} />
  }

  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: "bold" }}>
          Мои команды
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateModalOpen(true)}
          sx={{
            bgcolor: "#6366F1",
            "&:hover": { bgcolor: "#4F46E5" },
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: "medium",
          }}
        >
          Создать команду
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : teams.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: "12px", textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            У вас пока нет команд. Создайте свою первую команду!
          </Typography>
        </Paper>
      ) : (
        <List sx={{ p: 0 }}>
          {teams.map((team) => (
            <Paper
              key={team.team_id}
              sx={{
                mb: 2,
                borderRadius: "12px",
                overflow: "hidden",
                transition: "transform 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 3,
                },
              }}
            >
              <ListItem button onClick={() => handleSelectTeam(team)} sx={{ p: 2 }}>
                <ListItemAvatar>
                  <Avatar
                    src={team.logo ? `http://localhost:5000${team.logo}` : null}
                    alt={team.name}
                    sx={{ width: 56, height: 56, mr: 1 }}
                  >
                    {!team.logo && team.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                      {team.name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {team.member_count}{" "}
                      {team.member_count === 1 ? "игрок" : team.member_count < 5 ? "игрока" : "игроков"}
                    </Typography>
                  }
                  sx={{ ml: 1 }}
                />
                <ExpandMoreIcon sx={{ color: "text.secondary" }} />
              </ListItem>
            </Paper>
          ))}
        </List>
      )}

      {/* Модальное окно создания команды */}
      <CreateTeamModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onTeamCreated={handleTeamCreated}
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

export default TeamsList
