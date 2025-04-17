from django.db import models
from django.contrib.auth.models import User

class Team(models.Model):
    name = models.CharField(max_length=100, unique=True)
    logo = models.ImageField(upload_to='team_logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    captain = models.ForeignKey('Player', on_delete=models.SET_NULL, null=True, blank=True, related_name='captain_of')
    
    def __str__(self):
        return self.name
    
    def get_player_count(self):
        return self.players.count()
    
    def can_add_more_players(self):
        return self.get_player_count() < 6

# tournaments/models.py

class Player(models.Model):
    ROLE_CHOICES = [
        ('captain', 'Капитан'),
        ('main', 'Основной игрок'),
        ('substitute', 'Запасной игрок'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    nickname = models.CharField(max_length=50)
    first_name = models.CharField(max_length=50, blank=True, null=True, verbose_name='Имя')
    last_name = models.CharField(max_length=50, blank=True, null=True, verbose_name='Фамилия')
    country = models.CharField(max_length=50, blank=True, null=True, verbose_name='Страна')
    city = models.CharField(max_length=50, blank=True, null=True, verbose_name='Город')
    avatar = models.ImageField(upload_to='player_avatars/', blank=True, null=True, verbose_name='Аватар')
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='players')
    steam_id = models.CharField(max_length=30, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='main')
    
    def __str__(self):
        return self.nickname
    
    def get_avatar_url(self):
        if self.avatar:
            return self.avatar.url
        return '/static/img/default-avatar.png'  # Путь к изображению по умолчанию

class TeamInvitation(models.Model):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='invitations')
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='invitations')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('team', 'player')
    
    def __str__(self):
        return f"{self.team.name} - {self.player.nickname}"

class Tournament(models.Model):
    # Существующие поля
    image = models.ImageField(upload_to='tournament_images/', blank=True, null=True, verbose_name='Изображение')
    winner = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='won_tournaments', verbose_name='Победитель')

    STATUS_CHOICES = [
        ('upcoming', 'Предстоящий'),
        ('ongoing', 'Проходит'),
        ('completed', 'Завершен'),
    ]
    
    FORMAT_CHOICES = [
        ('single_elimination', 'Single Elimination'),
        ('double_elimination', 'Double Elimination'),
        ('round_robin', 'Round Robin'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='single_elimination')
    teams = models.ManyToManyField(Team, related_name='tournaments', blank=True)
    prize_pool = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def __str__(self):
        return self.name

class Match(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='matches')
    team1 = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='team1_matches')
    team2 = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='team2_matches')
    team1_score = models.IntegerField(default=0)
    team2_score = models.IntegerField(default=0)
    match_date = models.DateTimeField()
    completed = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.team1} vs {self.team2} - {self.tournament.name}"
    
class News(models.Model):
    title = models.CharField(max_length=255, verbose_name='Заголовок')
    content = models.TextField(verbose_name='Содержание')
    image_url = models.URLField(verbose_name='URL изображения', blank=True, null=True)
    source_url = models.URLField(verbose_name='URL источника')
    published_date = models.DateTimeField(verbose_name='Дата публикации')
    is_featured = models.BooleanField(default=False, verbose_name='Главная новость')
    
    class Meta:
        verbose_name = 'Новость'
        verbose_name_plural = 'Новости'
        ordering = ['-published_date']
    
    def __str__(self):
        return self.title
    
    def short_content(self):
        """Возвращает сокращенное содержание для превью"""
        if len(self.content) > 200:
            return self.content[:200] + '...'
        return self.content
    
# Добавьте этот код в ваш существующий файл models.py

class HLTVNews(models.Model):
    title = models.CharField(max_length=255, verbose_name="Заголовок")
    title_ru = models.CharField(max_length=255, verbose_name="Заголовок (RU)", blank=True, null=True)
    content = models.TextField(verbose_name="Содержание", blank=True)
    content_ru = models.TextField(verbose_name="Содержание (RU)", blank=True)
    image_url = models.URLField(verbose_name="URL изображения", blank=True, null=True)
    source_url = models.URLField(verbose_name="URL источника")
    published_date = models.DateTimeField(verbose_name="Дата публикации")
    time_ago = models.CharField(max_length=50, verbose_name="Время публикации", blank=True)
    comments_count = models.IntegerField(verbose_name="Количество комментариев", default=0)
    country_code = models.CharField(max_length=10, verbose_name="Код страны", blank=True)
    is_featured = models.BooleanField(verbose_name="Главная новость", default=False)
    
    class Meta:
        verbose_name = "Новость HLTV"
        verbose_name_plural = "Новости HLTV"
        ordering = ['-published_date']
    
    def __str__(self):
        return self.title
