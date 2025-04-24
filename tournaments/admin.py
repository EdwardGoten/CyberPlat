from django.contrib import admin
from .models import Player, Team, Tournament, News, TeamInvitation

class PlayerAdmin(admin.ModelAdmin):
    list_display = ('nickname', 'first_name', 'last_name', 'country', 'role')
    search_fields = ('nickname', 'first_name', 'last_name')
    list_filter = ('country', 'role')

class TeamAdmin(admin.ModelAdmin):
    list_display = ('name', 'tag', 'country', 'captain')
    search_fields = ('name', 'tag')
    list_filter = ('country',)

class TournamentAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'location', 'prize_pool', 'winner')
    search_fields = ('name', 'location')
    list_filter = ('start_date', 'end_date')

class NewsAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'updated_at')
    search_fields = ('title', 'content')
    list_filter = ('created_at', 'updated_at')

class TeamInvitationAdmin(admin.ModelAdmin):
    list_display = ('team', 'player', 'status', 'created_at')
    list_filter = ('status', 'created_at')

admin.site.register(Player, PlayerAdmin)
admin.site.register(Team, TeamAdmin)
admin.site.register(Tournament, TournamentAdmin)
admin.site.register(News, NewsAdmin)
admin.site.register(TeamInvitation, TeamInvitationAdmin)
