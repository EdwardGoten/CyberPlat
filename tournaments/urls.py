from django.urls import path
from . import views
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register, name='register'),
    path('login/', auth_views.LoginView.as_view(template_name='tournaments/login.html'), name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile, name='profile'),
    
    # Маршруты для команд
    path('teams/', views.team_list, name='team_list'),
    path('teams/<int:pk>/', views.team_detail, name='team_detail'),
    path('teams/create/', views.team_create, name='team_create'),
    path('teams/<int:pk>/edit/', views.team_edit, name='team_edit'),
    path('teams/<int:team_pk>/invite/', views.invite_player, name='invite_player'),
    path('teams/<int:team_pk>/remove/<int:player_pk>/', views.remove_player, name='remove_player'),
    path('teams/<int:team_pk>/transfer-captaincy/<int:player_pk>/', views.transfer_captaincy, name='transfer_captaincy'),
    
    # Маршруты для приглашений
    path('invitations/', views.invitations, name='invitations'),
    path('invitations/<int:invitation_pk>/accept/', views.accept_invitation, name='accept_invitation'),
    path('invitations/<int:invitation_pk>/decline/', views.decline_invitation, name='decline_invitation'),
    
    # Маршруты для турниров
    path('tournaments/', views.tournament_list, name='tournament_list'),
    path('tournaments/<int:pk>/', views.tournament_detail, name='tournament_detail'),
    path('tournaments/<int:pk>/join/', views.tournament_join, name='tournament_join'),

    path('hltv-news/', views.hltv_news, name='hltv_news'),
]