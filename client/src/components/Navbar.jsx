import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  InputBase,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = () => {
  // Используем контекст авторизации вместо локального состояния
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Обработчики для меню профиля
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Обработчик для мобильного меню
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Обработчик выхода из системы
  const handleLogout = () => {
    logout(); // Используем функцию из контекста
    handleMenuClose();
    setMobileOpen(false);
    navigate('/');
  };

  // Проверка активного пути
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Мобильное меню
  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <Typography variant="h6" sx={{ ...logoStyle, mb: 1 }}>
          CyberPlat
        </Typography>
        {user && (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
            <Avatar sx={{ width: 60, height: 60, mb: 1 }} />
            <Typography variant="body2">{user.email}</Typography>
          </Box>
        )}
      </Box>
      <Divider />
      <List>
        <ListItem button component={Link} to="/" onClick={() => setMobileOpen(false)} selected={isActive("/")}>
          <ListItemText primary="Главная" />
        </ListItem>

        <ListItem
          button
          component={Link}
          to="/profile"
          onClick={() => setMobileOpen(false)}
          selected={isActive("/profile")}
        >
          <ListItemText primary="Личный кабинет" />
        </ListItem>

        {!isAuthenticated && (
          <ListItem
            button
            component={Link}
            to="/auth"
            onClick={() => setMobileOpen(false)}
            selected={isActive("/auth")}
          >
            <ListItemText primary="Вход / Регистрация" />
          </ListItem>
        )}

        {isAuthenticated && (
          <ListItem button onClick={handleLogout}>
            <ListItemText primary="Выйти" />
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#fff",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        color: "#333",
        width: "100%",
        left: 0,
        right: 0,
        boxSizing: "border-box",
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          boxSizing: "border-box",
          maxWidth: "100%",
        }}
      >
        <Toolbar sx={toolbarStyle}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Typography
                variant="h6"
                component={Link}
                to="/"
                sx={{
                  ...logoStyle,
                  textDecoration: 'none',
                }}
              >
                CyberPlat
              </Typography>
            </Box>
          </Box>

          {/* Десктопное меню */}
          {!isMobile && (
            <Box sx={{ display: "flex", alignItems: "center", ml: 4 }}>
              <Button
                sx={{
                  ...navButtonStyles,
                  color: isActive("/") ? "#6a3de8" : "#333",
                  fontWeight: isActive("/") ? "bold" : "normal",
                }}
                component={Link}
                to="/"
              >
                Главная
              </Button>

              <Button
                sx={{
                  ...navButtonStyles,
                  color: isActive("/profile") ? "#6a3de8" : "#333",
                  fontWeight: isActive("/profile") ? "bold" : "normal",
                }}
                component={Link}
                to="/profile"
              >
                Личный кабинет
              </Button>
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", ml: "auto" }}>
            {/* Поиск */}
            <Box
              sx={{
                position: "relative",
                borderRadius: "20px",
                backgroundColor: "#f5f5f5",
                display: "flex",
                alignItems: "center",
                px: 2,
                mr: { xs: 1, sm: 2 },
              }}
            >
              <SearchIcon sx={{ color: "#999", mr: 1 }} />
              <InputBase
                placeholder="Искать..."
                sx={{
                  color: "#333",
                  "& .MuiInputBase-input": {
                    py: 1,
                    width: { xs: "100px", sm: "150px" },
                  },
                }}
              />
            </Box>

            {isAuthenticated ? (
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <Avatar sx={{ width: 32, height: 32 }} />
              </IconButton>
            ) : (
              <>
                {/* Кнопки Вход и Регистрация точно как в вашем файле */}
                <Button
                  sx={{
                    color: "#333",
                    fontWeight: "medium",
                    textTransform: "none",
                    mr: 1,
                  }}
                  component={Link}
                  to="/auth"
                >
                  Вход
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#6a3de8",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "#5a2dd8",
                    },
                    fontWeight: "bold",
                    textTransform: "none",
                    borderRadius: "20px",
                    px: 2,
                  }}
                  component={Link}
                  to="/auth"
                >
                  Регистрация
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>

      {/* Мобильное меню (drawer) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Лучшая производительность на мобильных устройствах
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 250 },
        }}
      >
        {drawer}
      </Drawer>

      {/* Меню профиля */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        keepMounted
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
          Профиль
        </MenuItem>
        <MenuItem onClick={handleLogout}>Выйти</MenuItem>
      </Menu>
    </AppBar>
  );
};

// Стили
const toolbarStyle = {
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  padding: { xs: "8px 0", md: "8px 0" },
  boxSizing: "border-box",
};

const logoStyle = {
  fontWeight: "bold",
  color: "#6a3de8",
  textTransform: "uppercase",
};

const navButtonStyles = {
  fontSize: "15px",
  textTransform: "none",
  marginRight: "15px",
  padding: "8px 12px",
  borderRadius: "4px",
  "&:hover": {
    backgroundColor: "rgba(106, 61, 232, 0.05)",
    color: "#6a3de8",
  },
};

export default Navbar;