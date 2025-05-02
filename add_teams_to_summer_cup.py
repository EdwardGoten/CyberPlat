import os
import django
import sys

# Настраиваем Django
sys.path.append('.')  # Добавляем текущую директорию в путь
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cs2_tournament_platform.settings')
django.setup()

from tournaments.models import Team, Tournament
from django.db.models import Count

def add_teams_to_tournament(tournament_name="Summer CUP 2025"):
    """
    Добавляет все команды в указанный турнир
    
    Args:
        tournament_name: Название турнира, по умолчанию "Summer CUP 2025"
    """
    # Получаем турнир
    try:
        tournament = Tournament.objects.get(name=tournament_name)
        print(f"Найден турнир: {tournament.name} (ID: {tournament.pk})")
    except Tournament.DoesNotExist:
        print(f"Турнир '{tournament_name}' не найден.")
        return
    except Tournament.MultipleObjectsReturned:
        print(f"Найдено несколько турниров с именем '{tournament_name}'. Используем первый.")
        tournament = Tournament.objects.filter(name=tournament_name).first()
    
    # Получаем все команды
    teams = Team.objects.all()
    
    if not teams.exists():
        print("Команды не найдены. Сначала создайте команды.")
        return
    
    # Получаем список команд, которые уже участвуют в турнире
    existing_teams = tournament.teams.all()
    existing_team_ids = [team.id for team in existing_teams]
    
    # Добавляем команды, которые еще не участвуют в турнире
    teams_added = 0
    for team in teams:
        if team.id not in existing_team_ids:
            # Проверяем, что в команде есть игроки
            if team.players.count() > 0:
                tournament.teams.add(team)
                teams_added += 1
                print(f"Команда '{team.name}' добавлена в турнир.")
            else:
                print(f"Команда '{team.name}' пропущена, так как в ней нет игроков.")
    
    if teams_added == 0:
        print("Все команды уже участвуют в турнире или не имеют игроков.")
    else:
        print(f"Всего добавлено {teams_added} команд в турнир '{tournament.name}'.")
        print(f"Теперь в турнире участвует {tournament.teams.count()} команд.")

if __name__ == "__main__":
    add_teams_to_tournament()
