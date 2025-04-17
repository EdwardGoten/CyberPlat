from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login
from django.contrib.auth import logout
from django.contrib import messages
from django.db.models import Q
from .models import Team, Player, Tournament, Match, TeamInvitation, News
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm
from .forms import UserEditForm, PlayerProfileForm, CustomPasswordChangeForm, UserRegistrationForm, TeamForm
from tournaments.models import News, Tournament, HLTVNews
from django.db import DatabaseError


def home(request):
    # Получаем новости HLTV (с обработкой ошибок)
    hltv_featured = None
    hltv_news = []
    
    try:
        # Импортируем HLTVNews только здесь, чтобы избежать ошибок при отсутствии таблицы
        from tournaments.models import HLTVNews
        hltv_featured = HLTVNews.objects.filter(is_featured=True).first()
        hltv_news = HLTVNews.objects.filter(is_featured=False).order_by('-published_date')[:8]
    except (DatabaseError, ImportError):
        # Если таблица не существует или возникла другая ошибка, просто продолжаем без новостей HLTV
        pass
    
    # Получаем турниры
    upcoming_tournaments = Tournament.objects.filter(status='registration').order_by('start_date')[:4]
    ongoing_tournaments = Tournament.objects.filter(status='active').order_by('start_date')[:4]
    past_tournaments = Tournament.objects.filter(status='completed').order_by('-end_date')[:4]
    
    context = {
        'hltv_featured': hltv_featured,
        'hltv_news': hltv_news,
        'upcoming_tournaments': upcoming_tournaments,
        'ongoing_tournaments': ongoing_tournaments,
        'past_tournaments': past_tournaments,
    }
    
    return render(request, 'tournaments/home.html', context)


def register(request):
    if request.method == 'POST':
        user_form = UserRegistrationForm(request.POST)
        player_form = PlayerProfileForm(request.POST)
        
        if user_form.is_valid() and player_form.is_valid():
            # Создаем пользователя, но пока не сохраняем
            user = user_form.save(commit=False)
            user.set_password(user_form.cleaned_data['password'])
            user.save()
            
            # Создаем профиль игрока, но пока не сохраняем
            player = player_form.save(commit=False)
            player.user = user  # Связываем с пользователем
            player.save()
            
            # Автоматически входим в систему
            login(request, user)
            messages.success(request, 'Регистрация успешна! Добро пожаловать!')
            return redirect('profile')
    else:
        user_form = UserRegistrationForm()
        player_form = PlayerProfileForm()
    
    return render(request, 'tournaments/register.html', {
        'user_form': user_form,
        'player_form': player_form
    })

@login_required
def profile(request):
    if request.method == 'POST':
        if 'profile_form' in request.POST:
            user_form = UserEditForm(request.POST, instance=request.user)
            player_form = PlayerProfileForm(request.POST, request.FILES, instance=request.user.player)
            
            if user_form.is_valid() and player_form.is_valid():
                user_form.save()
                player_form.save()
                messages.success(request, 'Профиль успешно обновлен.')
                return redirect('profile')
        
        elif 'password_form' in request.POST:
            password_form = CustomPasswordChangeForm(request.user, request.POST)
            
            if password_form.is_valid():
                user = password_form.save()
                update_session_auth_hash(request, user)  # Важно, чтобы пользователь не вышел из системы
                messages.success(request, 'Пароль успешно изменен.')
                return redirect('profile')
    else:
        user_form = UserEditForm(instance=request.user)
        player_form = PlayerProfileForm(instance=request.user.player)
        password_form = CustomPasswordChangeForm(request.user)
    
    return render(request, 'tournaments/profile.html', {
        'user_form': user_form,
        'player_form': player_form,
        'password_form': password_form
    })

# Представления для команд
def team_list(request):
    teams = Team.objects.all().order_by('name')
    return render(request, 'tournaments/team_list.html', {'teams': teams})

def team_detail(request, pk):
    team = get_object_or_404(Team, pk=pk)
    return render(request, 'tournaments/team_detail.html', {'team': team})

# Представления для турниров
def tournament_list(request):
    tournaments = Tournament.objects.all().order_by('-start_date')
    return render(request, 'tournaments/tournament_list.html', {'tournaments': tournaments})

def tournament_detail(request, pk):
    tournament = get_object_or_404(Tournament, pk=pk)
    matches = Match.objects.filter(tournament=tournament).order_by('match_date')
    return render(request, 'tournaments/tournament_detail.html', {
        'tournament': tournament,
        'matches': matches,
    })

@login_required
def tournament_join(request, pk):
    tournament = get_object_or_404(Tournament, pk=pk)
    player = request.user.player
    
    if not player.team:
        messages.error(request, 'Вы должны быть в команде, чтобы присоединиться к турниру!')
        return redirect('tournament_detail', pk=pk)
    
    if player.team in tournament.teams.all():
        messages.info(request, 'Ваша команда уже участвует в этом турнире!')
    else:
        tournament.teams.add(player.team)
        messages.success(request, 'Ваша команда присоединилась к турниру!')
    
    return redirect('tournament_detail', pk=pk)

# Обновленное представление для создания команды
@login_required
def team_create(request):
    # Проверяем, есть ли у пользователя объект Player
    try:
        player = request.user.player
    except:
        # Если нет, создаем его
        player = Player(user=request.user, nickname=request.user.username)
        player.save()
        messages.info(request, 'Профиль игрока был автоматически создан. Вы можете обновить его в настройках профиля.')
    
    if request.method == 'POST':
        form = TeamForm(request.POST, request.FILES)
        if form.is_valid():
            team = form.save(commit=False)
            team.save()
            
            # Обновляем игрока и делаем его капитаном
            player.team = team
            player.role = 'captain'
            player.save()
            
            # Обновляем команду, устанавливая капитана
            team.captain = player
            team.save()
            
            messages.success(request, 'Команда создана! Вы назначены капитаном.')
            return redirect('team_detail', pk=team.pk)
    else:
        form = TeamForm()
    
    return render(request, 'tournaments/team_form.html', {'form': form})

# Обновленное представление для просмотра команды
def team_detail(request, pk):
    team = get_object_or_404(Team, pk=pk)
    # Проверяем, что пользователь аутентифицирован, имеет связанного игрока и является капитаном команды
    is_captain = request.user.is_authenticated and hasattr(request.user, 'player') and team.captain == request.user.player
    
    # Добавим отладочную информацию
    print(f"User authenticated: {request.user.is_authenticated}")
    print(f"User has player: {hasattr(request.user, 'player')}")
    if hasattr(request.user, 'player'):
        print(f"Team captain: {team.captain}")
        print(f"User player: {request.user.player}")
        print(f"Is captain: {team.captain == request.user.player}")
    
    context = {
        'team': team,
        'is_captain': is_captain,
        'main_players': team.players.filter(role__in=['captain', 'main']),
        'substitute_players': team.players.filter(role='substitute'),
    }
    
    return render(request, 'tournaments/team_detail.html', context)

# Новое представление для редактирования команды
@login_required
def team_edit(request, pk):
    team = get_object_or_404(Team, pk=pk)
    
    # Проверяем, является ли пользователь капитаном команды
    if team.captain != request.user.player:
        messages.error(request, 'Только капитан может редактировать команду.')
        return redirect('team_detail', pk=team.pk)
    
    if request.method == 'POST':
        form = TeamForm(request.POST, request.FILES, instance=team)
        if form.is_valid():
            form.save()
            messages.success(request, 'Информация о команде обновлена.')
            return redirect('team_detail', pk=team.pk)
    else:
        form = TeamForm(instance=team)
    
    return render(request, 'tournaments/team_form.html', {'form': form, 'edit_mode': True})

# Новое представление для приглашения игрока
@login_required
def invite_player(request, team_pk):
    team = get_object_or_404(Team, pk=team_pk)
    
    # Проверяем, является ли пользователь капитаном команды
    if team.captain != request.user.player:
        messages.error(request, 'Только капитан может приглашать игроков.')
        return redirect('team_detail', pk=team_pk)
    
    # Проверяем, не достигнут ли лимит игроков
    if not team.can_add_more_players():
        messages.error(request, 'Достигнут максимальный размер команды (6 игроков).')
        return redirect('team_detail', pk=team_pk)
    
    if request.method == 'POST':
        nickname = request.POST.get('nickname')
        
        if not nickname:
            messages.error(request, 'Введите никнейм игрока.')
            return redirect('invite_player', team_pk=team_pk)
        
        try:
            player = Player.objects.get(nickname=nickname)
            
            # Проверяем, не является ли игрок уже членом команды
            if player.team:
                messages.error(request, f'Игрок {nickname} уже состоит в команде.')
                return redirect('invite_player', team_pk=team_pk)
            
            # Проверяем, не было ли уже отправлено приглашение
            if TeamInvitation.objects.filter(team=team, player=player).exists():
                messages.error(request, f'Приглашение игроку {nickname} уже отправлено.')
                return redirect('invite_player', team_pk=team_pk)
            
            # Создаем приглашение
            invitation = TeamInvitation(team=team, player=player)
            invitation.save()
            
            messages.success(request, f'Приглашение игроку {nickname} отправлено.')
            return redirect('team_detail', pk=team_pk)
            
        except Player.DoesNotExist:
            messages.error(request, f'Игрок с никнеймом {nickname} не найден.')
            return redirect('invite_player', team_pk=team_pk)
    
    return render(request, 'tournaments/invite_player.html', {'team': team})

# Новое представление для просмотра приглашений
@login_required
def invitations(request):
    player = request.user.player
    invitations = TeamInvitation.objects.filter(player=player)
    
    return render(request, 'tournaments/invitations.html', {'invitations': invitations})

# Новое представление для принятия приглашения
@login_required
def accept_invitation(request, invitation_pk):
    invitation = get_object_or_404(TeamInvitation, pk=invitation_pk, player=request.user.player)
    team = invitation.team
    player = invitation.player
    
    # Проверяем, не достигнут ли лимит игроков
    if not team.can_add_more_players():
        messages.error(request, f'Команда {team.name} уже заполнена (максимум 6 игроков).')
        invitation.delete()
        return redirect('invitations')
    
    # Добавляем игрока в команду
    player.team = team
    player.role = 'main' if team.players.filter(role='main').count() < 5 else 'substitute'
    player.save()
    
    # Удаляем приглашение
    invitation.delete()
    
    # Удаляем все другие приглашения для этого игрока
    TeamInvitation.objects.filter(player=player).delete()
    
    messages.success(request, f'Вы присоединились к команде {team.name}.')
    return redirect('team_detail', pk=team.pk)

# Новое представление для отклонения приглашения
@login_required
def decline_invitation(request, invitation_pk):
    invitation = get_object_or_404(TeamInvitation, pk=invitation_pk, player=request.user.player)
    team_name = invitation.team.name
    
    # Удаляем приглашение
    invitation.delete()
    
    messages.success(request, f'Вы отклонили приглашение от команды {team_name}.')
    return redirect('invitations')

# Новое представление для удаления игрока из команды
@login_required
def remove_player(request, team_pk, player_pk):
    team = get_object_or_404(Team, pk=team_pk)
    player = get_object_or_404(Player, pk=player_pk)
    
    # Проверяем, является ли пользователь капитаном команды
    if team.captain != request.user.player:
        messages.error(request, 'Только капитан может удалять игроков из команды.')
        return redirect('team_detail', pk=team_pk)
    
    # Проверяем, не пытается ли капитан удалить самого себя
    if player == team.captain:
        messages.error(request, 'Вы не можете удалить себя из команды. Сначала передайте права капитана другому игроку.')
        return redirect('team_detail', pk=team_pk)
    
    # Проверяем, состоит ли игрок в этой команде
    if player.team != team:
        messages.error(request, 'Этот игрок не состоит в вашей команде.')
        return redirect('team_detail', pk=team_pk)
    
    # Удаляем игрока из команды
    player.team = None
    player.role = 'main'  # Сбрасываем роль
    player.save()
    
    messages.success(request, f'Игрок {player.nickname} удален из команды.')
    return redirect('team_detail', pk=team_pk)

# Новое представление для передачи прав капитана
@login_required
def transfer_captaincy(request, team_pk, player_pk):
    team = get_object_or_404(Team, pk=team_pk)
    new_captain = get_object_or_404(Player, pk=player_pk)
    
    # Проверяем, является ли пользователь капитаном команды
    if team.captain != request.user.player:
        messages.error(request, 'Только капитан может передать права капитана.')
        return redirect('team_detail', pk=team_pk)
    
    # Проверяем, состоит ли игрок в этой команде
    if new_captain.team != team:
        messages.error(request, 'Этот игрок не состоит в вашей команде.')
        return redirect('team_detail', pk=team_pk)
    
    # Меняем капитана
    old_captain = team.captain
    old_captain.role = 'main'
    old_captain.save()
    
    new_captain.role = 'captain'
    new_captain.save()
    
    team.captain = new_captain
    team.save()
    
    messages.success(request, f'Права капитана переданы игроку {new_captain.nickname}.')
    return redirect('team_detail', pk=team_pk)


def logout_view(request):
    logout(request)
    messages.success(request, 'Вы успешно вышли из системы.')
    return redirect('home')

def hltv_news(request):
    # Получаем главную новость
    featured_news = HLTVNews.objects.filter(is_featured=True).first()
    
    # Получаем остальные новости
    news_list = HLTVNews.objects.filter(is_featured=False).order_by('-published_date')[:10]
    
    context = {
        'featured_news': featured_news,
        'news_list': news_list,
    }
    
    return render(request, 'tournaments/hltv_news.html', context)