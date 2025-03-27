"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Skeleton,
  Link as MuiLink,
  Alert,
} from "@mui/material"
import { Link } from "react-router-dom"
import CalendarTodayIcon from "@mui/icons-material/CalendarToday"
import PersonIcon from "@mui/icons-material/Person"

import { getNews } from "../api"

/**
 * @typedef {Object} NewsItem
 * @property {number} id - Идентификатор новости
 * @property {string} title - Заголовок новости
 * @property {string} image - URL изображения
 * @property {string} date - Дата публикации
 * @property {string} author - Автор новости
 * @property {string} excerpt - Краткое содержание
 * @property {string} url - Ссылка на полную новость
 */

// Резервные новости на случай, если API недоступен
const fallbackNews = [
  {
    id: 1,
    title: "NAVI обыграли Vitality и вышли в финал IEM Katowice 2024",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=300&auto=format&fit=crop",
    date: "2024-02-10",
    author: "HLTV.org Staff",
    excerpt:
      "Natus Vincere победили Team Vitality со счетом 2-1 в полуфинале IEM Katowice 2024 и вышли в гранд-финал турнира.",
    url: "#",
  },
  {
    id: 2,
    title: "FaZe Clan выиграли ESL Pro League Season 17",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=300&auto=format&fit=crop",
    date: "2024-01-15",
    author: "HLTV.org Staff",
    excerpt:
      "FaZe Clan одержали победу над G2 Esports в финале ESL Pro League Season 17 со счетом 3-1 и стали чемпионами турнира.",
    url: "#",
  },
  {
    id: 3,
    title: "Объявлены участники BLAST Premier Spring Final 2024",
    image: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=600&h=300&auto=format&fit=crop",
    date: "2024-03-01",
    author: "HLTV.org Staff",
    excerpt:
      "Организаторы BLAST Premier Spring Final 2024 анонсировали список из восьми команд, которые примут участие в турнире.",
    url: "#",
  },
]

const Home = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.down("md"))
  const [isLoading, setIsLoading] = useState(true)
  const [news, setNews] = useState(fallbackNews)
  const [error, setError] = useState(null)
  const [tournamentTab, setTournamentTab] = useState(0)

  // Функция для загрузки новостей
  const fetchNews = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Проверяем, запущен ли сервер, и если нет, используем моковые данные
      try {
        const data = await getNews();

        if (Array.isArray(data) && data.length > 0) {
          setNews(data)
          console.log("Новости успешно загружены:", data.length)
        } else {
          console.log("Получен пустой массив новостей, используем резервные данные")
          setNews(fallbackNews)
        }
      } catch (error) {
        console.error("Ошибка при загрузке новостей:", error)
        // Используем резервные данные без показа ошибки пользователю
        setNews(fallbackNews)
        // Не устанавливаем ошибку, чтобы не показывать сообщение
        // setError("Не удалось загрузить новости. Используются резервные данные.");
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Загружаем новости при монтировании компонента
  useEffect(() => {
    // Загружаем новости только один раз при монтировании
    fetchNews()
    // Не устанавливаем никаких интервалов для повторных запросов
  }, []) // Пустой массив зависимостей гарантирует однократное выполнение

  // Данные для слайдера с изображениями киберспорта
  const bannerData = {
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&h=500&auto=format&fit=crop",
    title: "CYBERPLAT CHAMPIONSHIP",
    subtitle: "призовой фонд",
    prize: "2 000 000₸",
  }

  // Данные для турниров с изображениями киберспорта
  const tournamentsData = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1548686304-89d188a80029?w=400&h=200&auto=format&fit=crop",
      title: "ACG Student League 2023",
      date: "01.09.2023 - 30.11.2023",
      prize: "1 500 000₸",
      status: "registration",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=200&auto=format&fit=crop",
      title: "CyberPlat Championship",
      date: "15.10.2023 - 15.12.2023",
      prize: "2 000 000₸",
      status: "active",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1542751371-6533a4048fab?w=400&h=200&auto=format&fit=crop",
      title: "Winter Cup 2023",
      date: "01.12.2023 - 15.01.2024",
      prize: "1 000 000₸",
      status: "past",
    },
  ]

  const handleTournamentTabChange = (event, newValue) => {
    setTournamentTab(newValue)
  }

  const filteredTournaments = tournamentsData.filter((tournament) => {
    if (tournamentTab === 0) return tournament.status === "registration"
    if (tournamentTab === 1) return tournament.status === "active"
    if (tournamentTab === 2) return tournament.status === "past"
    return true
  })

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#f0f0f0", // Светло-серый фон
        width: "100%",
        maxWidth: "100%",
        color: "#333333", // Темный текст для контраста
        boxSizing: "border-box", // Добавлено для правильного расчета размеров
      }}
    >
      {/* Основной контент */}
      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          zIndex: 1,
          pt: 2,
          pb: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          boxSizing: "border-box",
          maxWidth: "100% !important",
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {/* Главный баннер */}
        <Box
          sx={{
            position: "relative",
            mb: 6,
            width: "100%",
            height: { xs: "300px", md: "400px", lg: "500px" },
            borderRadius: "10px",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundImage: `url(${bannerData.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.6)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
              textAlign: "center",
              padding: { xs: 2, md: 4 },
            }}
          >
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: "bold",
                mb: 1,
                fontSize: { xs: "1.8rem", sm: "2.5rem", md: "3rem" },
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              {bannerData.title}
            </Typography>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {bannerData.subtitle}
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: "bold",
                color: "#ff3d57",
                mb: 3,
                fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.5rem" },
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              {bannerData.prize}
            </Typography>

            <Button
              variant="contained"
              color="primary"
              size="large"
              component={Link}
              to="/tournaments"
              sx={{
                backgroundColor: "#ff3d57",
                "&:hover": {
                  backgroundColor: "#e0354d",
                },
                fontWeight: "bold",
                px: 4,
                py: 1.5,
              }}
            >
              ПОДРОБНЕЕ
            </Button>
          </Box>
        </Box>

        {/* Новости с HLTV.org */}
        <Box sx={{ mb: 6, width: "100%" }}>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mb: 3, width: "100%" }}>
            <Typography
              variant="h5"
              component="h2"
              sx={{
                fontWeight: "bold",
                position: "relative",
                textAlign: "center",
                "&:after": {
                  content: '""',
                  position: "absolute",
                  bottom: -8,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "60px",
                  height: "3px",
                  backgroundColor: "#ff3d57",
                  borderRadius: "2px",
                },
              }}
            >
              Новости CS2
            </Typography>
          </Box>

          {error &&
            false && ( // Временно отключаем отображение ошибки
              <Alert severity="warning" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

          {isLoading ? (
            // Скелетон загрузки для новостей
            <Grid container spacing={3}>
              {[1, 2, 3].map((item) => (
                <Grid item xs={12} md={4} key={item}>
                  <Card sx={{ height: "100%" }}>
                    <Skeleton variant="rectangular" height={200} />
                    <CardContent>
                      <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
                      <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
                      <Skeleton variant="text" height={20} sx={{ mb: 1 }} />
                      <Skeleton variant="text" height={20} width="60%" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={3}>
              {news.slice(0, 3).map((item) => (
                <Grid item xs={12} md={4} key={item.id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-5px)",
                        boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                      },
                      backgroundColor: "#ffffff", // Белый фон карточек
                      color: "#333333", // Темный текст
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)", // Легкая тень
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={
                        item.image ||
                        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=300&auto=format&fit=crop"
                      }
                      alt={item.title}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        component="h3"
                        sx={{
                          fontWeight: "bold",
                          mb: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          height: "3.6em",
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          mb: 2,
                          color: "text.secondary",
                          fontSize: "0.875rem",
                        }}
                      >
                        <CalendarTodayIcon sx={{ fontSize: "0.875rem", mr: 0.5 }} />
                        <Typography variant="body2" sx={{ mr: 2 }}>
                          {new Date(item.date).toLocaleDateString()}
                        </Typography>
                        <PersonIcon sx={{ fontSize: "0.875rem", mr: 0.5 }} />
                        <Typography variant="body2">{item.author}</Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          height: "4.5em",
                        }}
                      >
                        {item.excerpt}
                      </Typography>
                      <MuiLink
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: "#ff3d57",
                          fontWeight: "medium",
                          textDecoration: "none",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        Читать далее
                      </MuiLink>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Турниры */}
        <Box sx={{ mb: 6, width: "100%" }}>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: "bold",
              mb: 3,
              textAlign: "center",
              position: "relative",
              "&:after": {
                content: '""',
                position: "absolute",
                bottom: -8,
                left: "50%",
                transform: "translateX(-50%)",
                width: "60px",
                height: "3px",
                backgroundColor: "#ff3d57",
                borderRadius: "2px",
              },
            }}
          >
            Турниры
          </Typography>

          <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
            <Tabs
              value={tournamentTab}
              onChange={handleTournamentTabChange}
              sx={{
                "& .MuiTabs-indicator": {
                  backgroundColor: "#ff3d57",
                },
                "& .Mui-selected": {
                  color: "#ff3d57 !important",
                },
                "& .MuiTab-root": {
                  color: "#555555", // Темный текст для вкладок
                },
              }}
            >
              <Tab label="Регистрация" sx={{ fontWeight: "bold" }} />
              <Tab label="Активные" sx={{ fontWeight: "bold" }} />
              <Tab label="Прошедшие" sx={{ fontWeight: "bold" }} />
            </Tabs>
          </Box>

          <Grid container spacing={3} justifyContent="center">
            {filteredTournaments.map((tournament) => (
              <Grid item xs={12} sm={6} md={4} key={tournament.id}>
                <Card
                  sx={{
                    borderRadius: "10px",
                    overflow: "hidden",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "0 8px 15px rgba(0,0,0,0.12)",
                    },
                    backgroundColor: "#ffffff", // Белый фон карточек
                    color: "#333333", // Темный текст
                  }}
                >
                  <Box
                    sx={{
                      height: "200px",
                      width: "100%",
                      backgroundImage: `url(${tournament.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      position: "relative",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        backgroundColor: "#ff3d57",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    >
                      {tournament.status === "registration" && "Регистрация"}
                      {tournament.status === "active" && "Активный"}
                      {tournament.status === "past" && "Завершен"}
                    </Box>
                  </Box>
                  <CardContent>
                    <Typography variant="h6" component="div" sx={{ fontWeight: "bold", mb: 1 }}>
                      {tournament.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {tournament.date}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: "bold", color: "#ff3d57" }}>
                      Призовой фонд: {tournament.prize}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  )
}

export default Home

