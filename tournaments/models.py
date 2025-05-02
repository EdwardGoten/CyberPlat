from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.urls import reverse
import random

class Player(models.Model):
    ROLE_CHOICES = [
        ('rifler', 'Rifler'),
        ('awper', 'AWPer'),
        ('igl', 'In-game Leader'),
        ('support', 'Support'),
        ('lurker', 'Lurker'),
    ]
    
    COUNTRY_CHOICES = [
        ('', 'Select Country'),
        ('US', 'United States'),
        ('UK', 'United Kingdom'),
        ('RU', 'Russia'),
        ('UA', 'Ukraine'),
        ('DE', 'Germany'),
        ('FR', 'France'),
        ('BR', 'Brazil'),
        ('SE', 'Sweden'),
        ('DK', 'Denmark'),
        ('FI', 'Finland'),
        ('NO', 'Norway'),
        ('CN', 'China'),
        ('KZ', 'Kazakhstan'),
        ('EU', 'Europe'),
        ('MN', 'Mongolia'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    nickname = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, choices=COUNTRY_CHOICES, blank=True)
    city = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, blank=True)
    avatar = models.ImageField(upload_to='player_avatars/', blank=True, null=True)
    
    def __str__(self):
        return self.nickname

class Team(models.Model):
    name = models.CharField(max_length=100)
    tag = models.CharField(max_length=10)
    logo = models.ImageField(upload_to='team_logos/', blank=True, null=True)
    country = models.CharField(max_length=100, choices=Player.COUNTRY_CHOICES, blank=True)
    players = models.ManyToManyField(Player, related_name='teams', blank=True)
    captain = models.ForeignKey(Player, on_delete=models.SET_NULL, null=True, blank=True, related_name='captain_of')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name
    
    def get_absolute_url(self):
        return reverse('team_detail', kwargs={'pk': self.pk})
    
    def get_player_count(self):
        return self.players.count()

class Tournament(models.Model):
    FORMAT_CHOICES = [
        ('single_elimination', 'Single Elimination'),
        ('double_elimination', 'Double Elimination'),
        ('round_robin', 'Round Robin'),
        ('swiss', 'Swiss System'),
    ]
    
    STATUS_CHOICES = [
        ('upcoming', 'Upcoming'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    location = models.CharField(max_length=200, blank=True)
    prize_pool = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    teams = models.ManyToManyField(Team, related_name='tournaments', blank=True)
    image = models.ImageField(upload_to='tournament_images/', blank=True, null=True)
    winner = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='tournaments_won')
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='single_elimination')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    bracket_generated = models.BooleanField(default=False)
    
    def __str__(self):
        return self.name
    
    def get_absolute_url(self):
        return reverse('tournament_detail', kwargs={'pk': self.pk})
    
    def get_status_display(self):
        return dict(self.STATUS_CHOICES).get(self.status, self.status)
    
    def get_format_display(self):
        return dict(self.FORMAT_CHOICES).get(self.format, self.format)
    
    def generate_bracket(self):
        """Генерирует турнирную сетку для турнира"""
        if self.bracket_generated:
            return False
        
        # Получаем список команд
        teams = list(self.teams.all())
        
        if len(teams) < 2:
            return False
        
        # Перемешиваем команды для случайного распределения
        random.shuffle(teams)
        
        # Определяем количество раундов и матчей
        team_count = len(teams)
        rounds_needed = 0
        while 2 ** rounds_needed < team_count:
            rounds_needed += 1
        
        total_slots = 2 ** rounds_needed
        byes = total_slots - team_count  # Количество "пропусков" (bye)
        
        # Создаем стадии турнира
        stages = []
        for i in range(rounds_needed):
            stage_name = f"Раунд {i+1}"
            if i == rounds_needed - 1:
                stage_name = "Финал"
            elif i == rounds_needed - 2:
                stage_name = "Полуфинал"
            elif i == rounds_needed - 3:
                stage_name = "Четвертьфинал"
                
            stage = TournamentStage.objects.create(
                tournament=self,
                name=stage_name,
                order=i+1
            )
            stages.append(stage)
        
        # Создаем матчи первого раунда
        matches_in_first_round = total_slots // 2
        for i in range(matches_in_first_round):
            # Определяем команды для матча
            team1 = None
            team2 = None
            
            # Распределяем команды и bye
            if i < byes:
                # Этот матч имеет bye
                if i < len(teams):
                    team1 = teams[i]
            else:
                # Обычный матч
                idx1 = i
                idx2 = total_slots - 1 - i
                
                if idx1 < len(teams):
                    team1 = teams[idx1]
                if idx2 < len(teams):
                    team2 = teams[idx2]
            
            # Создаем матч с timezone-aware datetime
            match_datetime = timezone.make_aware(
                timezone.datetime.combine(self.start_date, timezone.datetime.min.time())
            )
            
            # Определяем номер следующего матча
            next_match_number = (i + 1 + 1) // 2  # +1 для индексации с 1
            
            match = Match.objects.create(
                tournament=self,
                stage=stages[0],
                team1=team1,
                team2=team2,
                match_date=match_datetime,
                match_number=i + 1,
                next_match_number=next_match_number
            )
            
            # Если одна из команд отсутствует (bye), автоматически устанавливаем победителя
            if team1 and not team2:
                match.team1_score = 1
                match.team2_score = 0
                match.completed = True
                match.save()
                match.update_next_match()  # Вызываем метод для обновления следующего матча
            
        # Создаем пустые матчи для последующих раундов
        for stage_idx in range(1, len(stages)):
            matches_in_round = 2 ** (rounds_needed - stage_idx - 1)
            for i in range(matches_in_round):
                # Вычисляем следующий номер матча
                next_match_number = None
                if stage_idx < len(stages) - 1:
                    next_match_number = (i + 1 + 1) // 2  # +1 для индексации с 1
                
                # Создаем матч с timezone-aware datetime
                match_datetime = timezone.make_aware(
                    timezone.datetime.combine(
                        self.start_date + timezone.timedelta(days=stage_idx), 
                        timezone.datetime.min.time()
                    )
                )
                
                Match.objects.create(
                    tournament=self,
                    stage=stages[stage_idx],
                    match_number=i + 1,
                    match_date=match_datetime,
                    next_match_number=next_match_number
                )
        
        self.bracket_generated = True
        self.save()
        return True

class TournamentStage(models.Model):
    """Модель для представления стадии турнира (например, 1/8 финала, четвертьфинал и т.д.)"""
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='stages')
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=1)  # Порядок стадии в турнире
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.tournament.name} - {self.name}"

class Match(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='matches')
    stage = models.ForeignKey(TournamentStage, on_delete=models.CASCADE, related_name='matches', null=True, blank=True)
    team1 = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='matches_as_team1', null=True, blank=True)
    team2 = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='matches_as_team2', null=True, blank=True)
    match_date = models.DateTimeField()  # Изменено с DateField на DateTimeField
    team1_score = models.IntegerField(default=0)
    team2_score = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)
    match_number = models.PositiveIntegerField(default=1)  # Номер матча в стадии
    next_match_number = models.PositiveIntegerField(null=True, blank=True)  # Номер следующего матча
    
    class Meta:
        ordering = ['stage__order', 'match_number']
    
    def __str__(self):
        team1_name = self.team1.name if self.team1 else "TBD"
        team2_name = self.team2.name if self.team2 else "TBD"
        return f"{team1_name} vs {team2_name} - {self.tournament.name}"
    
    def get_winner(self):
        if not self.completed:
            return None
        if self.team1_score > self.team2_score:
            return self.team1
        elif self.team2_score > self.team1_score:
            return self.team2
        return None
    
    def update_next_match(self):
        """Обновляет следующий матч после завершения текущего"""
        if not self.completed or not self.next_match_number:
            return
        
        winner = self.get_winner()
        if not winner:
            return
        
        # Находим следующую стадию
        next_stages = TournamentStage.objects.filter(
            tournament=self.tournament,
            order__gt=self.stage.order
        ).order_by('order')
        
        if not next_stages.exists():
            # Это финальный матч
            if winner:
                self.tournament.winner = winner
                self.tournament.status = 'completed'
                self.tournament.save()
            return
        
        next_stage = next_stages.first()
        
        # Находим следующий матч
        next_match = Match.objects.filter(
            tournament=self.tournament,
            stage=next_stage,
            match_number=self.next_match_number
        ).first()
        
        if next_match:
            # Определяем, в какую позицию (team1 или team2) поместить победителя
            # Для четных номеров матчей, победитель идет во вторую позицию следующего матча
            # Для нечетных номеров матчей, победитель идет в первую позицию следующего матча
            if self.match_number % 2 == 0:
                next_match.team2 = winner
            else:
                next_match.team1 = winner
            
            next_match.save()
            
            # Проверяем, заполнены ли обе команды в следующем матче
            if next_match.team1 and next_match.team2:
                # Если да, обновляем дату матча на будущее время
                current_time = timezone.now()
                next_match.match_date = current_time + timezone.timedelta(days=1)
                next_match.save()

class News(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    image = models.ImageField(upload_to='news_images/', blank=True, null=True)
    source_url = models.URLField(blank=True, null=True, verbose_name="URL источника")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('news_detail', kwargs={'pk': self.pk})
    
    class Meta:
        verbose_name_plural = "News"

class TeamInvitation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='invitations')
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='invitations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.team.name} invited {self.player.nickname}"
