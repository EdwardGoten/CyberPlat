from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib import messages
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy, reverse
from .models import Player, Team, Tournament, News, TeamInvitation, Match, TournamentStage
from .forms import UserRegisterForm, PlayerForm, TeamForm, TournamentForm, NewsForm, MatchResultForm
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth import update_session_auth_hash
from django.http import JsonResponse, HttpResponseForbidden
from django.db.models import Q, Prefetch
from django.utils import timezone
import datetime

def home(request):
    tournaments = Tournament.objects.all().order_by('-start_date')[:3]
    news = News.objects.all().order_by('-created_at')[:5]
    context = {
        'tournaments': tournaments,
        'news': news,
    }
    return render(request, 'tournaments/home.html', context)

def register(request):
    if request.method == 'POST':
        user_form = UserRegisterForm(request.POST)
        player_form = PlayerForm(request.POST)
        
        if user_form.is_valid() and player_form.is_valid():
            # Создаем пользователя
            user = user_form.save()
            
            # Получаем или создаем профиль игрока
            try:
                # Пытаемся получить существующий профиль
                player = user.player
            except Player.DoesNotExist:
                # Если профиль не существует, создаем новый
                player = Player(user=user)
            
            # Обновляем данные профиля из формы
            player.nickname = player_form.cleaned_data['nickname']
            if 'steam_id' in player_form.cleaned_data:
                player.steam_id = player_form.cleaned_data['steam_id']
            if 'first_name' in player_form.cleaned_data:
                player.first_name = player_form.cleaned_data['first_name']
            if 'last_name' in player_form.cleaned_data:
                player.last_name = player_form.cleaned_data['last_name']
            if 'country' in player_form.cleaned_data:
                player.country = player_form.cleaned_data['country']
            if 'city' in player_form.cleaned_data:
                player.city = player_form.cleaned_data['city']
            if 'role' in player_form.cleaned_data:
                player.role = player_form.cleaned_data['role']
            
            # Сохраняем профиль
            player.save()
            
            # Выводим сообщение об успешной регистрации
            messages.success(request, 'Аккаунт успешно создан! Теперь вы можете войти.')
            return redirect('login')
        else:
            # Если формы невалидны, выводим сообщения об ошибках
            for field, errors in user_form.errors.items():
                for error in errors:
                    messages.error(request, f"Ошибка в поле '{field}': {error}")
            
            for field, errors in player_form.errors.items():
                for error in errors:
                    messages.error(request, f"Ошибка в поле '{field}': {error}")
    else:
        user_form = UserRegisterForm()
        player_form = PlayerForm()
    
    return render(request, 'tournaments/register.html', {
        'user_form': user_form,
        'player_form': player_form
    })

@login_required
def profile(request):
    try:
        player = request.user.player
    except:
        player = None
    
    # Инициализируем формы по умолчанию
    player_form = PlayerForm(instance=player)
    password_form = PasswordChangeForm(request.user)
    
    if request.method == 'POST':
        # Проверяем, какая форма была отправлена
        if 'profile_form' in request.POST:
            player_form = PlayerForm(request.POST, request.FILES, instance=player)
            if player_form.is_valid():
                player = player_form.save(commit=False)
                if not player.user:
                    player.user = request.user
                player.save()
                messages.success(request, 'Ваш профиль был успешно обновлен!')
                return redirect('profile')
            else:
                messages.error(request, 'Пожалуйста, исправьте ошибки в форме.')
        elif 'password_form' in request.POST:
            password_form = PasswordChangeForm(request.user, request.POST)
            if password_form.is_valid():
                user = password_form.save()
                # Обновляем сессию, чтобы пользователь не вышел из системы
                update_session_auth_hash(request, user)
                messages.success(request, 'Ваш пароль был успешно изменен!')
                return redirect('profile')
            else:
                messages.error(request, 'Пожалуйста, исправьте ошибки в форме.')
    
    context = {
        'player_form': player_form,
        'password_form': password_form,
        'player': player,
    }
    return render(request, 'tournaments/profile.html', context)

# Team views
class TeamListView(ListView):
    model = Team
    template_name = 'tournaments/team_list.html'
    context_object_name = 'teams'
    ordering = ['name']

class TeamDetailView(DetailView):
    model = Team
    template_name = 'tournaments/team_detail.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        team = self.get_object()
        
        # Проверяем, является ли текущий пользователь капитаном команды
        is_captain = False
        if self.request.user.is_authenticated:
            try:
                is_captain = team.captain == self.request.user.player
            except:
                pass
        
        context['is_captain'] = is_captain
        
        # Получаем основных и запасных игроков
        context['main_players'] = team.players.all()
        context['substitute_players'] = []
        
        # Получаем турниры, в которых участвует команда, и убеждаемся, что у них есть идентификаторы
        team_tournaments = []
        for tournament in team.tournaments.all():
            if tournament.pk is not None:
                team_tournaments.append(tournament)
        
        context['team_tournaments'] = team_tournaments
        
        return context

class TeamCreateView(LoginRequiredMixin, CreateView):
    model = Team
    form_class = TeamForm
    template_name = 'tournaments/team_form.html'
    success_url = reverse_lazy('team_list')
    
    def form_valid(self, form):
        # Добавляем отладочное сообщение
        messages.info(self.request, 'Форма валидна, пытаемся создать команду...')
        
        # Сохраняем команду
        self.object = form.save()
        
        # Добавляем создателя как капитана и игрока
        try:
            player = self.request.user.player
            self.object.captain = player
            self.object.players.add(player)
            self.object.save()
            messages.success(self.request, f'Команда {self.object.name} успешно создана!')
        except Exception as e:
            messages.warning(self.request, f'Ошибка при добавлении вас в команду: {str(e)}')
            messages.warning(self.request, 'Пожалуйста, заполните свой профиль игрока, чтобы быть добавленным в команду.')
        
        return super().form_valid(form)
    
    def form_invalid(self, form):
        # Добавляем отладочное сообщение с ошибками формы
        messages.error(self.request, f'Ошибка при создании команды: {form.errors}')
        return super().form_invalid(form)

class TeamUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Team
    form_class = TeamForm
    template_name = 'tournaments/team_form.html'
    
    def test_func(self):
        team = self.get_object()
        try:
            return team.captain == self.request.user.player
        except:
            return False

@login_required
def team_delete(request, pk):
    team = get_object_or_404(Team, pk=pk)
    
    # Проверяем, является ли пользователь капитаном команды
    try:
        if team.captain != request.user.player:
            messages.error(request, 'Только капитан может удалить команду.')
            return redirect('team_detail', pk=team.pk)
    except:
        messages.error(request, 'У вас нет прав для удаления этой команды.')
        return redirect('team_detail', pk=team.pk)
    
    if request.method == 'POST':
        team_name = team.name
        team.delete()
        messages.success(request, f'Команда {team_name} была успешно удалена.')
        return redirect('team_list')
    
    return render(request, 'tournaments/team_confirm_delete.html', {'team': team})

@login_required
def remove_player(request, team_id, player_id):
    team = get_object_or_404(Team, id=team_id)
    player = get_object_or_404(Player, id=player_id)
    
    # Проверяем, является ли пользователь капитаном команды
    try:
        if team.captain != request.user.player:
            messages.error(request, 'Только капитан может удалять игроков из команды.')
            return redirect('team_detail', pk=team.pk)
    except:
        messages.error(request, 'У вас нет прав для удаления игроков из этой команды.')
        return redirect('team_detail', pk=team.pk)
    
    # Нельзя удалить капитана
    if player == team.captain:
        messages.error(request, 'Нельзя удалить капитана команды. Сначала передайте капитанство другому игроку.')
        return redirect('team_detail', pk=team.pk)
    
    # Удаляем игрока из команды
    team.players.remove(player)
    messages.success(request, f'Игрок {player.nickname} был удален из команды.')
    
    return redirect('team_detail', pk=team.pk)

@login_required
def transfer_captaincy(request, team_id, player_id):
    team = get_object_or_404(Team, id=team_id)
    new_captain = get_object_or_404(Player, id=player_id)
    
    # Проверяем, является ли пользователь капитаном команды
    try:
        if team.captain != request.user.player:
            messages.error(request, 'Только капитан может передать капитанство.')
            return redirect('team_detail', pk=team.pk)
    except:
        messages.error(request, 'У вас нет прав для передачи капитанства в этой команде.')
        return redirect('team_detail', pk=team.pk)
    
    # Проверяем, является ли новый капитан членом команды
    if new_captain not in team.players.all():
        messages.error(request, 'Игрок должен быть членом команды, чтобы стать капитаном.')
        return redirect('team_detail', pk=team.pk)
    
    # Передаем капитанство
    team.captain = new_captain
    team.save()
    messages.success(request, f'Капитанство передано игроку {new_captain.nickname}.')
    
    return redirect('team_detail', pk=team.pk)

@login_required
def manage_team_roles(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    
    # Проверяем, является ли пользователь капитаном команды
    try:
        if team.captain != request.user.player:
            messages.error(request, 'Только капитан может управлять ролями игроков.')
            return redirect('team_detail', pk=team.pk)
    except:
        messages.error(request, 'У вас нет прав для управления ролями в этой команде.')
        return redirect('team_detail', pk=team.pk)
    
    # Получаем список доступных ролей
    role_choices = Player.ROLE_CHOICES
    
    if request.method == 'POST':
        # Словарь для отслеживания уже назначенных ролей
        assigned_roles = {}
        
        # Обрабатываем данные формы
        for player in team.players.all():
            role_key = f'role_{player.id}'
            new_role = request.POST.get(role_key, '')
            
            # Пропускаем, если роль не выбрана
            if not new_role:
                continue
            
            # Проверяем, не назначена ли уже эта роль другому игроку
            if new_role in assigned_roles:
                messages.error(
                    request, 
                    f'Роль "{dict(role_choices)[new_role]}" уже назначена игроку {assigned_roles[new_role]}. '
                    f'Каждая роль может быть назначена только одному игроку.'
                )
                return render(request, 'tournaments/manage_team_roles.html', {
                    'team': team,
                    'role_choices': role_choices,
                })
            
            # Запоминаем назначенную роль
            assigned_roles[new_role] = player.nickname
            
            # Обновляем роль игрока
            player.role = new_role
            player.save()
        
        messages.success(request, 'Роли игроков успешно обновлены!')
        return redirect('team_detail', pk=team.pk)
    
    return render(request, 'tournaments/manage_team_roles.html', {
        'team': team,
        'role_choices': role_choices,
    })

# Tournament views
class TournamentListView(ListView):
    model = Tournament
    template_name = 'tournaments/tournament_list.html'
    context_object_name = 'tournaments'
    ordering = ['-start_date']

class TournamentDetailView(DetailView):
    model = Tournament
    template_name = 'tournaments/tournament_detail.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        tournament = self.get_object()
        
        # Получаем матчи турнира
        context['matches'] = Match.objects.filter(tournament=tournament).order_by('match_date')
        
        # Получаем активную вкладку
        tab = self.request.GET.get('tab', 'main')
        context['active_tab'] = tab
        
        # Если активна вкладка "bracket", загружаем данные для турнирной сетки
        if tab == 'bracket':
            # Получаем все стадии турнира с матчами
            stages = TournamentStage.objects.filter(tournament=tournament).prefetch_related(
                Prefetch('matches', queryset=Match.objects.all().select_related('team1', 'team2'))
            ).order_by('order')
            
            context['stages'] = stages
        
        return context

class TournamentCreateView(LoginRequiredMixin, CreateView):
    model = Tournament
    form_class = TournamentForm
    template_name = 'tournaments/tournament_form.html'

@login_required
def tournament_join(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    
    # Проверяем, что турнир еще не начался
    if tournament.status != 'upcoming':
        messages.error(request, 'Регистрация на этот турнир закрыта.')
        return redirect('tournament_detail', pk=tournament.pk)
    
    # Проверяем, что у пользователя есть команда
    try:
        player = request.user.player
        team = None
        
        # Находим команду, где пользователь является капитаном
        for t in player.teams.all():
            if t.captain == player:
                team = t
                break
        
        if not team:
            messages.error(request, 'Вы должны быть капитаном команды, чтобы зарегистрировать ее на турнир.')
            return redirect('tournament_detail', pk=tournament.pk)
        
        # Проверяем, не зарегистрирована ли команда уже на турнир
        if team in tournament.teams.all():
            messages.warning(request, 'Ваша команда уже зарегистрирована на этот турнир.')
            return redirect('tournament_detail', pk=tournament.pk)
        
        # Регистрируем команду на турнир
        tournament.teams.add(team)
        messages.success(request, f'Команда {team.name} успешно зарегистрирована на турнир {tournament.name}!')
        
    except Exception as e:
        messages.error(request, f'Ошибка при регистрации на турнир: {str(e)}')
    
    return redirect('tournament_detail', pk=tournament.pk)

@login_required
def generate_tournament_bracket(request, tournament_id):
    tournament = get_object_or_404(Tournament, id=tournament_id)
    
    # Проверяем права доступа (только администратор может генерировать сетку)
    if not request.user.is_staff:
        messages.error(request, 'У вас нет прав для генерации турнирной сетки.')
        return redirect('tournament_detail', pk=tournament.pk)
    
    # Проверяем, что турнир в статусе "upcoming"
    if tournament.status != 'upcoming':
        messages.error(request, 'Турнирная сетка может быть сгенерирована только для предстоящих турниров.')
        return redirect('tournament_detail', pk=tournament.pk)
    
    # Проверяем, что сетка еще не была сгенерирована
    if tournament.bracket_generated:
        messages.warning(request, 'Турнирная сетка уже была сгенерирована ранее.')
        return redirect('tournament_detail', pk=tournament.pk)
    
    # Генерируем сетку
    success = tournament.generate_bracket()
    
    if success:
        # Обновляем статус турнира на "ongoing"
        tournament.status = 'ongoing'
        tournament.save()
        messages.success(request, 'Турнирная сетка успешно сгенерирована!')
    else:
        messages.error(request, 'Не удалось сгенерировать турнирную сетку. Убедитесь, что в турнире зарегистрировано достаточное количество команд.')
    
    return redirect(reverse('tournament_detail', kwargs={'pk': tournament.pk}) + '?tab=bracket')

@login_required
def update_match_result(request, match_id):
    match = get_object_or_404(Match, id=match_id)
    tournament = match.tournament
    
    # Проверяем права доступа (только администратор может обновлять результаты)
    if not request.user.is_staff:
        messages.error(request, 'У вас нет прав для обновления результатов матчей.')
        return redirect('tournament_detail', pk=tournament.pk)
    
    if request.method == 'POST':
        form = MatchResultForm(request.POST, instance=match)
        if form.is_valid():
            match = form.save(commit=False)
            match.completed = True
            match.save()
            
            # Обновляем следующий матч
            match.update_next_match()
            
            messages.success(request, 'Результаты матча успешно обновлены!')
            return redirect(reverse('tournament_detail', kwargs={'pk': tournament.pk}) + '?tab=bracket')
    else:
        form = MatchResultForm(instance=match)
    
    context = {
        'form': form,
        'match': match,
        'tournament': tournament
    }
    return render(request, 'tournaments/update_match_result.html', context)

# News views
class NewsListView(ListView):
    model = News
    template_name = 'tournaments/news_list.html'
    context_object_name = 'news_list'
    ordering = ['-created_at']

class NewsDetailView(DetailView):
    model = News
    template_name = 'tournaments/news_detail.html'

class NewsCreateView(LoginRequiredMixin, CreateView):
    model = News
    form_class = NewsForm
    template_name = 'tournaments/news_form.html'

# Team invitation views
@login_required
def invite_player(request, team_id):
    team = get_object_or_404(Team, id=team_id)
    
    # Check if user is captain
    try:
        if team.captain != request.user.player:
            messages.error(request, 'Только капитан команды может приглашать игроков.')
            return redirect('team_detail', pk=team.pk)
    except:
        messages.error(request, 'Вам необходимо заполнить свой профиль игрока.')
        return redirect('profile')
    
    if request.method == 'POST':
        # Получаем никнейм из формы - используем правильное имя поля
        nickname = request.POST.get('nickname')
        
        # Добавляем отладочное сообщение
        messages.info(request, f'Ищем игрока с никнеймом: "{nickname}"')
        
        if not nickname:
            messages.error(request, 'Никнейм не может быть пустым.')
            return render(request, 'tournaments/invite_player.html', {'team': team})
        
        try:
            player = Player.objects.get(nickname=nickname)
            
            # Проверяем, не является ли игрок текущим пользователем
            if player == request.user.player:
                messages.warning(request, 'Вы не можете пригласить себя в команду.')
                return redirect('team_detail', pk=team.pk)
            
            # Проверяем, не состоит ли игрок уже в команде
            if player in team.players.all():
                messages.warning(request, f'Игрок {player.nickname} уже состоит в команде.')
                return redirect('team_detail', pk=team.pk)
            
            # Проверяем, не отправлено ли уже приглашение
            if TeamInvitation.objects.filter(team=team, player=player, status='pending').exists():
                messages.warning(request, f'Приглашение для игрока {player.nickname} уже отправлено и ожидает ответа.')
                return redirect('team_detail', pk=team.pk)
            
            # Создаем приглашение
            invitation = TeamInvitation(team=team, player=player)
            invitation.save()
            messages.success(request, f'Приглашение отправлено игроку {player.nickname}.')
            return redirect('team_detail', pk=team.pk)
            
        except Player.DoesNotExist:
            messages.error(request, f'Игрок с никнеймом "{nickname}" не найден.')
    
    return render(request, 'tournaments/invite_player.html', {'team': team})

@login_required
def invitations(request):
    try:
        player = request.user.player
        invitations = TeamInvitation.objects.filter(player=player, status='pending')
    except:
        messages.error(request, 'You need to complete your player profile first.')
        return redirect('profile')
    
    return render(request, 'tournaments/invitations.html', {'invitations': invitations})

@login_required
def accept_invitation(request, invitation_id):
    invitation = get_object_or_404(TeamInvitation, id=invitation_id, player=request.user.player, status='pending')
    
    invitation.status = 'accepted'
    invitation.save()
    
    # Добавляем игрока в команду
    invitation.team.players.add(invitation.player)
    messages.success(request, f'Вы присоединились к команде {invitation.team.name}.')
    
    return redirect('invitations')

@login_required
def decline_invitation(request, invitation_id):
    invitation = get_object_or_404(TeamInvitation, id=invitation_id, player=request.user.player, status='pending')
    
    invitation.status = 'declined'
    invitation.save()
    
    messages.info(request, f'Вы отклонили приглашение от команды {invitation.team.name}.')
    
    return redirect('invitations')

class PlayerListView(ListView):
    model = Player
    template_name = 'tournaments/player_list.html'
    context_object_name = 'players'
    paginate_by = 12
    
    def get_queryset(self):
        queryset = super().get_queryset().prefetch_related('teams')
        
        # Исключаем администраторов из списка игроков
        queryset = queryset.exclude(user__username='admin')  # Исключаем пользователя с именем 'admin'
        queryset = queryset.exclude(user__is_staff=True)     # Исключаем всех сотрудников
        queryset = queryset.exclude(user__is_superuser=True) # Исключаем всех суперпользователей
        
        search = self.request.GET.get('search')
        if search:
            queryset = queryset.filter(nickname__icontains=search)
        return queryset

@login_required
def invite_player_direct(request, player_id):
    player = get_object_or_404(Player, id=player_id)
    
    # Проверяем, есть ли у пользователя команда и является ли он капитаном
    try:
        user_player = request.user.player
        team = None
        
        for t in user_player.teams.all():
            if t.captain == user_player:
                team = t
                break
        
        if not team:
            messages.error(request, 'Вы должны быть капитаном команды, чтобы приглашать игроков.')
            return redirect('player_list')
        
        # Проверяем, не состоит ли игрок уже в команде
        if player in team.players.all():
            messages.warning(request, f'Игрок {player.nickname} уже состоит в вашей команде.')
            return redirect('player_list')
        
        # Проверяем, не отправлено ли уже приглашение
        if TeamInvitation.objects.filter(team=team, player=player, status='pending').exists():
            messages.warning(request, f'Приглашение для игрока {player.nickname} уже отправлено и ожидает ответа.')
            return redirect('player_list')
        
        # Создаем приглашение
        invitation = TeamInvitation(team=team, player=player)
        invitation.save()
        messages.success(request, f'Приглашение отправлено игроку {player.nickname}.')
        
    except Exception as e:
        messages.error(request, f'Ошибка при отправке приглашения: {str(e)}')
    
    return redirect('player_list')

def generate_bracket(self):
    teams = list(self.teams.all())
    num_teams = len(teams)

    if num_teams < 2:
        return False

    # Определяем количество матчей в первом раунде
    matches_in_first_round = 2**(num_teams-1).bit_length() - num_teams
    
    # Создаем стадии турнира
    stages = []
    num_stages = (num_teams-1).bit_length()
    for i in range(num_stages):
        stage = TournamentStage.objects.create(tournament=self, name=f'Раунд {i+1}', order=i+1)
        stages.append(stage)
    
    # Перемешиваем команды для случайного распределения
    import random
    random.shuffle(teams)
    
    # Создаем матчи первого раунда
    for i in range(matches_in_first_round):
        team1 = teams.pop()
        team2 = teams.pop()

        # Создаем datetime из date
        match_datetime = datetime.datetime.combine(
            self.start_date, 
            datetime.time(12, 0)  # Полдень
        )
        # Применяем временную зону
        match_datetime = timezone.make_aware(match_datetime)

        match = Match.objects.create(
            tournament=self,
            stage=stages[0],
            team1=team1,
            team2=team2,
            match_date=match_datetime,  # Используем datetime с временной зоной
            match_number=i+1,
            next_match_number=(i+1+1)//2 if i < matches_in_first_round-1 else None
        )
    
    # Создаем матчи для команд, прошедших автоматически
    byes = teams
    for i, team in enumerate(byes):
        # Создаем datetime из date
        match_datetime = datetime.datetime.combine(
            self.start_date, 
            datetime.time(12, 0)  # Полдень
        )
        # Применяем временную зону
        match_datetime = timezone.make_aware(match_datetime)

        match = Match.objects.create(
            tournament=self,
            stage=stages[0],
            team1=team,
            match_date=match_datetime,
            match_number=matches_in_first_round + i + 1,
            next_match_number=(matches_in_first_round + i + 1 + 1) // 2 if matches_in_first_round + i < num_teams - 1 else None
        )
    
    # Устанавливаем флаг генерации сетки
    self.bracket_generated = True
    self.save()
    
    return True

@login_required
def complete_tournament_view(request, tournament_id):
    # Проверяем права доступа (только администратор может завершить турнир)
    if not request.user.is_staff:
        messages.error(request, 'У вас нет прав для завершения турнира.')
        return redirect('tournament_detail', pk=tournament_id)
    
    tournament = get_object_or_404(Tournament, id=tournament_id)
    
    # Проверяем, что турнир в статусе "ongoing"
    if tournament.status != 'ongoing':
        messages.error(request, 'Только активные турниры могут быть завершены.')
        return redirect('tournament_detail', pk=tournament_id)
    
    # Получаем финальную стадию
    final_stage = TournamentStage.objects.filter(
        tournament=tournament
    ).order_by('-order').first()
    
    if not final_stage:
        messages.error(request, 'Не найдены стадии для турнира.')
        return redirect('tournament_detail', pk=tournament_id)
    
    # Получаем финальный матч
    final_match = Match.objects.filter(
        tournament=tournament,
        stage=final_stage
    ).first()
    
    if not final_match:
        messages.error(request, 'Не найден финальный матч для турнира.')
        return redirect('tournament_detail', pk=tournament_id)
    
    # Проверяем, завершен ли финальный матч
    force_complete = request.GET.get('force', 'false').lower() == 'true'
    
    if final_match.completed or force_complete:
        # Если финальный матч завершен, устанавливаем победителя
        if final_match.completed:
            winner = final_match.get_winner()
            if winner:
                tournament.winner = winner
                messages.success(request, f'Установлен победитель турнира: {winner.name}')
            else:
                messages.warning(request, 'Финальный матч завершен, но победитель не определен.')
        
        # Проверяем, все ли матчи завершены
        all_matches = Match.objects.filter(tournament=tournament)
        incomplete_matches = all_matches.filter(completed=False)
        
        if incomplete_matches.exists() and not force_complete:
            messages.warning(
                request, 
                f'Не все матчи завершены ({incomplete_matches.count()} из {all_matches.count()}). '
                f'Используйте принудительное завершение, если хотите завершить турнир сейчас.'
            )
            return redirect('tournament_detail', pk=tournament_id)
        
        # Устанавливаем статус турнира как "completed"
        tournament.status = 'completed'
        tournament.save()
        
        messages.success(request, f'Турнир {tournament.name} успешно завершен!')
    else:
        messages.warning(request, 'Финальный матч не завершен. Турнир не может быть завершен.')
    
    return redirect('tournament_detail', pk=tournament_id)
