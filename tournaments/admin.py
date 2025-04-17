from django.contrib import admin
from .models import Team, Player, Tournament, Match, TeamInvitation, News

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'captain', 'get_player_count', 'created_at')
    search_fields = ('name',)

@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ('nickname', 'user', 'team', 'role', 'steam_id')
    list_filter = ('team', 'role')
    search_fields = ('nickname', 'user__username', 'steam_id')

@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'status', 'format')
    list_filter = ('status', 'format')
    search_fields = ('name', 'description')
    filter_horizontal = ('teams',)

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ('tournament', 'team1', 'team2', 'team1_score', 'team2_score', 'match_date', 'completed')
    list_filter = ('tournament', 'completed')
    search_fields = ('tournament__name', 'team1__name', 'team2__name')

@admin.register(TeamInvitation)
class TeamInvitationAdmin(admin.ModelAdmin):
    list_display = ('team', 'player', 'created_at')
    list_filter = ('team',)
    search_fields = ('team__name', 'player__nickname')

@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ('title', 'published_date', 'is_featured')
    list_filter = ('is_featured', 'published_date')
    search_fields = ('title', 'content')
    date_hierarchy = 'published_date'
    actions = ['make_featured']
    
    def make_featured(self, request, queryset):
        # Сначала снимаем флаг со всех новостей
        News.objects.update(is_featured=False)
        
        # Устанавливаем флаг для выбранной новости (берем первую, если выбрано несколько)
        queryset.first().is_featured = True
        queryset.first().save()
        
        self.message_user(request, 'Выбранная новость установлена как главная.')
    
    make_featured.short_description = 'Сделать главной новостью'