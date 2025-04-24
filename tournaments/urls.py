from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('register/', views.register, name='register'),
    path('login/', auth_views.LoginView.as_view(template_name='tournaments/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(template_name='tournaments/logged_out.html', http_method_names=['get', 'post']), name='logout'),
    path('profile/', views.profile, name='profile'),
    
    # Player URLs
    path('players/', views.PlayerListView.as_view(), name='player_list'),
    path('players/<int:player_id>/invite/', views.invite_player_direct, name='invite_player_direct'),
    
    # Team URLs
    path('teams/', views.TeamListView.as_view(), name='team_list'),
    path('teams/<int:pk>/', views.TeamDetailView.as_view(), name='team_detail'),
    path('teams/new/', views.TeamCreateView.as_view(), name='team_create'),
    path('teams/<int:pk>/update/', views.TeamUpdateView.as_view(), name='team_update'),
    path('teams/<int:pk>/edit/', views.TeamUpdateView.as_view(), name='team_edit'),
    path('teams/<int:pk>/delete/', views.team_delete, name='team_delete'),
    path('teams/<int:team_id>/invite/', views.invite_player, name='invite_player'),
    path('teams/<int:team_id>/remove/<int:player_id>/', views.remove_player, name='remove_player'),
    path('teams/<int:team_id>/captain/<int:player_id>/', views.transfer_captaincy, name='transfer_captaincy'),
    path('teams/<int:team_id>/manage-roles/', views.manage_team_roles, name='manage_team_roles'),
    path('invitations/', views.invitations, name='invitations'),
    path('invitations/<int:invitation_id>/accept/', views.accept_invitation, name='accept_invitation'),
    path('invitations/<int:invitation_id>/decline/', views.decline_invitation, name='decline_invitation'),
    
    # Tournament URLs
    path('tournaments/', views.TournamentListView.as_view(), name='tournament_list'),
    path('tournaments/<int:pk>/', views.TournamentDetailView.as_view(), name='tournament_detail'),
    path('tournaments/new/', views.TournamentCreateView.as_view(), name='tournament_create'),
    path('tournaments/<int:tournament_id>/join/', views.tournament_join, name='tournament_join'),
    path('tournaments/<int:tournament_id>/generate-bracket/', views.generate_tournament_bracket, name='generate_tournament_bracket'),
    path('tournaments/<int:tournament_id>/complete/', views.complete_tournament_view, name='complete_tournament'),  # Новый URL
    path('matches/<int:match_id>/update-result/', views.update_match_result, name='update_match_result'),
    
    # News URLs
    path('news/', views.NewsListView.as_view(), name='news_list'),
    path('news/<int:pk>/', views.NewsDetailView.as_view(), name='news_detail'),
    path('news/new/', views.NewsCreateView.as_view(), name='news_create'),
]
