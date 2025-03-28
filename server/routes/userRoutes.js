import express from "express"
import bcrypt from "bcrypt"
import multer from "multer"
import path from "path"
import fs from "fs"
import { v4 as uuidv4 } from "uuid"
import { fileURLToPath } from "url"
import { dirname } from "path"
import { pool } from "../database.js"

const router = express.Router()

// Получаем текущую директорию
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Настройка хранилища для multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/avatars")

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

// Регистрация пользователя
router.post("/register", async (req, res) => {
  try {
    const { email, password, fullName, nickname, country, city } = req.body

    // Проверяем, что все обязательные поля заполнены
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email и пароль обязательны",
      })
    }

    // Проверяем, существует ли пользователь с таким email
    const existingUser = await pool.query("SELECT * FROM users WHERE email = $1", [email])

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Пользователь с таким email уже существует",
      })
    }

    // Проверяем, существует ли пользователь с таким никнеймом
    if (nickname) {
      const existingNickname = await pool.query("SELECT * FROM users WHERE nickname = $1", [nickname])

      if (existingNickname.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Пользователь с таким никнеймом уже существует",
        })
      }
    }

    // Хешируем пароль
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Создаем нового пользователя
    const newUser = await pool.query(
      `INSERT INTO users (email, password, full_name, nickname, country, city)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, email, full_name, nickname, country, city, avatar, created_at`,
      [email, hashedPassword, fullName, nickname, country, city],
    )

    // Формируем токен (в реальном приложении здесь должна быть генерация JWT)
    const token = "fake-jwt-token-" + Math.random().toString(36).substring(2, 15)

    res.status(201).json({
      success: true,
      message: "Пользователь успешно зарегистрирован",
      user: {
        userId: newUser.rows[0].user_id,
        email: newUser.rows[0].email,
        fullName: newUser.rows[0].full_name,
        nickname: newUser.rows[0].nickname,
        country: newUser.rows[0].country,
        city: newUser.rows[0].city,
        avatar: newUser.rows[0].avatar,
        createdAt: newUser.rows[0].created_at,
      },
      token,
    })
  } catch (error) {
    console.error("❌ Ошибка при регистрации пользователя:", error)
    res.status(500).json({
      success: false,
      message: "Ошибка при регистрации пользователя",
      error: error.message,
    })
  }
})

// Вход пользователя
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Проверяем, что все обязательные поля заполнены
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email и пароль обязательны",
      })
    }

    // Ищем пользователя по email
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email])

    if (user.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Неверный email или пароль",
      })
    }

    // Проверяем пароль
    const isMatch = await bcrypt.compare(password, user.rows[0].password)

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Неверный email или пароль",
      })
    }

    // Формируем токен (в реальном приложении здесь должна быть генерация JWT)
    const token = "fake-jwt-token-" + Math.random().toString(36).substring(2, 15)

    res.json({
      success: true,
      message: "Вход выполнен успешно",
      user: {
        userId: user.rows[0].user_id,
        email: user.rows[0].email,
        fullName: user.rows[0].full_name,
        nickname: user.rows[0].nickname,
        country: user.rows[0].country,
        city: user.rows[0].city,
        avatar: user.rows[0].avatar,
        createdAt: user.rows[0].created_at,
      },
      token,
    })
  } catch (error) {
    console.error("❌ Ошибка при входе пользователя:", error)
    res.status(500).json({
      success: false,
      message: "Ошибка при входе пользователя",
      error: error.message,
    })
  }
})

// Загрузка аватара пользователя
router.post("/upload-avatar", upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Файл не был загружен",
      })
    }

    // Получаем email из запроса (в реальном приложении здесь должна быть проверка токена)
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email не указан",
      })
    }

    // Получаем пользователя из базы данных
    const user = await getUserByEmail(email)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Пользователь не найден",
      })
    }

    const file = req.file

    // Относительный путь для доступа к файлу через API
    const avatarUrl = `/uploads/avatars/${file.filename}`

    // Обновляем URL аватара в базе данных
    await pool.query(
      `
      UPDATE users
      SET avatar = $1
      WHERE email = $2
    `,
      [avatarUrl, email],
    )

    console.log("Аватар успешно загружен для пользователя:", email)

    res.status(200).json({
      success: true,
      avatarUrl,
      message: "Аватар успешно загружен",
    })
  } catch (error) {
    console.error("❌ Ошибка при загрузке аватара:", error)
    res.status(500).json({
      success: false,
      message: "Произошла ошибка при загрузке аватара",
      error: error.message,
    })
  }
})

// Вспомогательная функция для получения пользователя по email
async function getUserByEmail(email) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email])

  return result.rows.length > 0 ? result.rows[0] : null
}

export default router
