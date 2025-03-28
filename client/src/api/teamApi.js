import { API_URL } from "../config"

// Получение списка команд пользователя
export const getUserTeams = async () => {
  try {
    // Получаем данные пользователя из localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const token = localStorage.getItem("token")

    if (!user.email) {
      return {
        success: false,
        message: "Пользователь не авторизован",
      }
    }

    const response = await fetch(`${API_URL}/teams/user-teams?email=${encodeURIComponent(user.email)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    })

    // Проверяем тип ответа
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text()
      console.error("Сервер вернул не JSON ответ:", textResponse)
      return {
        success: false,
        message: "Сервер вернул неверный формат ответа",
      }
    }

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        teams: data.teams || [],
      }
    }

    return {
      success: false,
      message: data.message || "Ошибка при получении команд",
    }
  } catch (error) {
    console.error("Ошибка при получении команд:", error)

    return {
      success: false,
      message: "Ошибка соединения с сервером: " + error.message,
    }
  }
}

// Создание новой команды
export const createTeam = async (teamData) => {
  try {
    // Получаем данные пользователя из localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const token = localStorage.getItem("token")

    if (!user.email) {
      return {
        success: false,
        message: "Пользователь не авторизован",
      }
    }

    // Создаем FormData для отправки файла и данных
    const formData = new FormData()
    formData.append("name", teamData.name)
    formData.append("country", teamData.country || "")
    formData.append("game", teamData.game || "")
    formData.append("email", user.email)

    if (teamData.logo) {
      formData.append("logo", teamData.logo)
    }

    const response = await fetch(`${API_URL}/teams/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
      body: formData,
    })

    // Проверяем тип ответа
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text()
      console.error("Сервер вернул не JSON ответ:", textResponse)
      return {
        success: false,
        message: "Сервер вернул неверный формат ответа",
      }
    }

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        teamId: data.teamId,
        message: data.message || "Команда успешно создана",
      }
    }

    return {
      success: false,
      message: data.message || "Ошибка при создании команды",
    }
  } catch (error) {
    console.error("Ошибка при создании команды:", error)

    return {
      success: false,
      message: "Ошибка соединения с сервером: " + error.message,
    }
  }
}

// Получение информации о команде
export const getTeamDetails = async (teamId) => {
  try {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/teams/${teamId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    })

    // Проверяем тип ответа
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text()
      console.error("Сервер вернул не JSON ответ:", textResponse)
      return {
        success: false,
        message: "Сервер вернул неверный формат ответа",
      }
    }

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        team: data.team,
        members: data.members || [],
      }
    }

    return {
      success: false,
      message: data.message || "Ошибка при получении информации о команде",
    }
  } catch (error) {
    console.error("Ошибка при получении информации о команде:", error)

    return {
      success: false,
      message: "Ошибка соединения с сервером: " + error.message,
    }
  }
}

// Добавление участника в команду
export const addTeamMember = async (teamId, nickname) => {
  try {
    // Получаем данные пользователя из localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const token = localStorage.getItem("token")

    if (!user.email) {
      return {
        success: false,
        message: "Пользователь не авторизован",
      }
    }

    const response = await fetch(`${API_URL}/teams/${teamId}/add-member`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || ""}`,
      },
      body: JSON.stringify({
        nickname,
        requestedBy: user.email,
      }),
    })

    // Проверяем тип ответа
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text()
      console.error("Сервер вернул не JSON ответ:", textResponse)
      return {
        success: false,
        message: "Сервер вернул неверный формат ответа",
      }
    }

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message || "Участник успешно добавлен в команду",
      }
    }

    return {
      success: false,
      message: data.message || "Ошибка при добавлении участника в команду",
    }
  } catch (error) {
    console.error("Ошибка при добавлении участника в команду:", error)

    return {
      success: false,
      message: "Ошибка соединения с сервером: " + error.message,
    }
  }
}

// Удаление участника из команды
export const removeTeamMember = async (teamId, memberEmail) => {
  try {
    // Получаем данные пользователя из localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    const token = localStorage.getItem("token")

    if (!user.email) {
      return {
        success: false,
        message: "Пользователь не авторизован",
      }
    }

    const response = await fetch(`${API_URL}/teams/${teamId}/remove-member`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || ""}`,
      },
      body: JSON.stringify({
        memberEmail,
        requestedBy: user.email,
      }),
    })

    // Проверяем тип ответа
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text()
      console.error("Сервер вернул не JSON ответ:", textResponse)
      return {
        success: false,
        message: "Сервер вернул неверный формат ответа",
      }
    }

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        message: data.message || "Участник успешно удален из команды",
      }
    }

    return {
      success: false,
      message: data.message || "Ошибка при удалении участника из команды",
    }
  } catch (error) {
    console.error("Ошибка при удалении участника из команды:", error)

    return {
      success: false,
      message: "Ошибка соединения с сервером: " + error.message,
    }
  }
}

// Поиск пользователей по никнейму
export const searchUsersByNickname = async (query) => {
  try {
    const token = localStorage.getItem("token")

    const response = await fetch(`${API_URL}/teams/search/users?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    })

    // Проверяем тип ответа
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text()
      console.error("Сервер вернул не JSON ответ:", textResponse)
      return {
        success: false,
        message: "Сервер вернул неверный формат ответа",
      }
    }

    const data = await response.json()

    if (response.ok) {
      return {
        success: true,
        users: data.users || [],
      }
    }

    return {
      success: false,
      message: data.message || "Ошибка при поиске пользователей",
    }
  } catch (error) {
    console.error("Ошибка при поиске пользователей:", error)

    return {
      success: false,
      message: "Ошибка соединения с сервером: " + error.message,
    }
  }
}
