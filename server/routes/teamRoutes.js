import express from "express"
import { pool } from "../database.js"
import multer from "multer"
import path from "path"
import fs from "fs"
import { v4 as uuidv4 } from "uuid"
import { fileURLToPath } from "url"
import { dirname } from "path"

const router = express.Router()

// Получаем текущую директорию
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Настройка хранилища для логотипов команд
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/team-logos")

    // Создаем директорию, если она не существует
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueFilename)
  },
})

// Фильтр для проверки типа файла
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("Недопустимый формат файла. Разрешены только JPEG, PNG, GIF и WebP."))
  }
}

// Настройка multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
})

// Получение списка команд пользователя
router.get("/user-teams", async (req, res) => {
  try {
    const { email } = req.query

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email не указан",
      })
    }

    // Получаем команды, где пользователь является участником
    const result = await pool.query(
      `
      SELECT t.*, tm.role, 
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.team_id) as member_count
      FROM teams t
      JOIN team_members tm ON t.team_id = tm.team_id
      WHERE tm.user_email = $1
      ORDER BY t.created_at DESC
    `,
      [email],
    )

    res.json({
      success: true,
      teams: result.rows,
    })
  } catch (error) {
    console.error("❌ Ошибка при получении команд пользователя:", error)
    res.status(500).json({
      success: false,
      message: "Ошибка при получении команд пользователя",
      error: error.message,
    })
  }
})

// Создание новой команды
router.post("/create", upload.single("logo"), async (req, res) => {
  try {
    const { name, country, game, email } = req.body

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Название команды и email создателя обязательны",
      })
    }

    // Путь к логотипу, если он был загружен
    let logoPath = null
    if (req.file) {
      logoPath = `/uploads/team-logos/${req.file.filename}`
    }

    // Начинаем транзакцию
    const client = await pool.connect()

    try {
      await client.query("BEGIN")

      // Создаем команду
      const teamResult = await client.query(
        `
        INSERT INTO teams (name, logo, country, game, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING team_id
      `,
        [name, logoPath, country, game, email],
      )

      const teamId = teamResult.rows[0].team_id

      // Добавляем создателя как капитана команды
      await client.query(
        `
        INSERT INTO team_members (team_id, user_email, role)
        VALUES ($1, $2, 'captain')
      `,
        [teamId, email],
      )

      await client.query("COMMIT")

      res.status(201).json({
        success: true,
        message: "Команда успешно создана",
        teamId: teamId,
      })
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error("❌ Ошибка при создании команды:", error)
    res.status(500).json({
      success: false,
      message: "Ошибка при создании команды",
      error: error.message,
    })
  }
})

// Получение информации о команде
router.get("/:teamId", async (req, res) => {
  try {
    const { teamId } = req.params

    // Получаем информацию о команде
    const teamResult = await pool.query(
      `
      SELECT * FROM teams WHERE team_id = $1
    `,
      [teamId],
    )

    if (teamResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Команда не найдена",
      })
    }

    const team = teamResult.rows[0]

    // Получаем участников команды
    const membersResult = await pool.query(
      `
      SELECT tm.*, u.full_name, u.avatar
      FROM team_members tm
      JOIN users u ON tm.user_email = u.email
      WHERE tm.team_id = $1
      ORDER BY 
        CASE WHEN tm.role = 'captain' THEN 0 ELSE 1 END,
        tm.joined_at
    `,
      [teamId],
    )

    res.json({
      success: true,
      team: team,
      members: membersResult.rows,
    })
  } catch (error) {
    console.error("❌ Ошибка при получении информации о команде:", error)
    res.status(500).json({
      success: false,
      message: "Ошибка при получении информации о команде",
      error: error.message,
    })
  }
})

// Добавление участника в команду
router.post("/:teamId/add-member", async (req, res) => {
  try {
    const { teamId } = req.params
    const { nickname, requestedBy } = req.body

    if (!nickname || !requestedBy) {
      return res.status(400).json({
        success: false,
        message: "Никнейм пользователя и email запрашивающего обязательны",
      })
    }

    // Проверяем, существует ли команда
    const teamResult = await pool.query(
      `
      SELECT * FROM teams WHERE team_id = $1
    `,
      [teamId],
    )

    if (teamResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Команда не найдена",
      })
    }

    // Проверяем, является ли запрашивающий капитаном команды
    const captainResult = await pool.query(
      `
      SELECT * FROM team_members 
      WHERE team_id = $1 AND user_email = $2 AND role = 'captain'
    `,
      [teamId, requestedBy],
    )

    if (captainResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Только капитан команды может добавлять участников",
      })
    }

    // Проверяем, существует ли пользователь с таким никнеймом
    const userResult = await pool.query(
      `
      SELECT * FROM users WHERE nickname = $1
    `,
      [nickname],
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Пользователь с таким никнеймом не найден",
      })
    }

    const user = userResult.rows[0]

    // Проверяем, не является ли пользователь уже участником команды
    const memberResult = await pool.query(
      `
      SELECT * FROM team_members 
      WHERE team_id = $1 AND user_email = $2
    `,
      [teamId, user.email],
    )

    if (memberResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Пользователь уже является участником команды",
      })
    }

    // Проверяем, не превышено ли максимальное количество участников (5)
    const countResult = await pool.query(
      `
      SELECT COUNT(*) as count FROM team_members WHERE team_id = $1
    `,
      [teamId],
    )

    if (Number.parseInt(countResult.rows[0].count) >= 5) {
      return res.status(400).json({
        success: false,
        message: "Достигнуто максимальное количество участников (5)",
      })
    }

    // Добавляем пользователя в команду
    await pool.query(
      `
      INSERT INTO team_members (team_id, user_email, nickname, role)
      VALUES ($1, $2, $3, 'member')
    `,
      [teamId, user.email, nickname],
    )

    res.status(201).json({
      success: true,
      message: "Участник успешно добавлен в команду",
    })
  } catch (error) {
    console.error("❌ Ошибка при добавлении участника в команду:", error)
    res.status(500).json({
      success: false,
      message: "Ошибка при добавлении участника в команду",
      error: error.message,
    })
  }
})

// Удаление участника из команды
router.delete("/:teamId/remove-member", async (req, res) => {
  try {
    const { teamId } = req.params
    const { memberEmail, requestedBy } = req.body

    if (!memberEmail || !requestedBy) {
      return res.status(400).json({
        success: false,
        message: "Email участника и email запрашивающего обязательны",
      })
    }

    // Проверяем, является ли запрашивающий капитаном команды
    const captainResult = await pool.query(
      `
      SELECT * FROM team_members 
      WHERE team_id = $1 AND user_email = $2 AND role = 'captain'
    `,
      [teamId, requestedBy],
    )

    if (captainResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Только капитан команды может удалять участников",
      })
    }

    // Проверяем, не пытается ли капитан удалить себя
    if (memberEmail === requestedBy) {
      return res.status(400).json({
        success: false,
        message: "Капитан не может удалить себя из команды",
      })
    }

    // Удаляем участника из команды
    const result = await pool.query(
      `
      DELETE FROM team_members 
      WHERE team_id = $1 AND user_email = $2
      RETURNING *
    `,
      [teamId, memberEmail],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Участник не найден в команде",
      })
    }

    res.json({
      success: true,
      message: "Участник успешно удален из команды",
    })
  } catch (error) {
    console.error("❌ Ошибка при удалении участника из команды:", error)
    res.status(500).json({
      success: false,
      message: "Ошибка при удалении участника из команды",
      error: error.message,
    })
  }
})

// Поиск пользователей по никнейму
router.get("/search/users", async (req, res) => {
  try {
    const { query } = req.query

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Поисковый запрос не указан",
      })
    }

    // Ищем пользователей по никнейму
    const result = await pool.query(
      `
      SELECT email, nickname, full_name, avatar
      FROM users
      WHERE nickname ILIKE $1
      LIMIT 10
    `,
      [`%${query}%`],
    )

    res.json({
      success: true,
      users: result.rows,
    })
  } catch (error) {
    console.error("❌ Ошибка при поиске пользователей:", error)
    res.status(500).json({
      success: false,
      message: "Ошибка при поиске пользователей",
      error: error.message,
    })
  }
})

export default router

