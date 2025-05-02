import os
import django
import sys

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cs2_tournament_platform.settings')
django.setup()

from tournaments.models import Team, Player
from django.contrib.auth.models import User

def debug_team_detail():
    print("\n=== ОТЛАДКА СТРАНИЦЫ КОМАНДЫ ===")
    
    # Получаем команду с ID=5
    try:
        team = Team.objects.get(pk=5)
        print(f"Команда найдена: {team.name} (ID: {team.pk})")
        
        # Проверяем капитана
        if team.captain:
            print(f"Капитан команды: {team.captain.nickname} (ID: {team.captain.pk})")
            
            # Проверяем, связан ли капитан с пользователем
            if team.captain.user:
                print(f"Пользователь капитана: {team.captain.user.username} (ID: {team.captain.user.pk})")
            else:
                print("У капитана нет связанного пользователя!")
        else:
            print("У команды нет капитана!")
        
        # Проверяем игроков
        players = team.players.all()
        print(f"Количество игроков: {players.count()}")
        
        for player in players:
            print(f"- Игрок: {player.nickname} (ID: {player.pk})")
            print(f"  Роль: {player.role}")
            
            # Проверяем метод get_role_display
            try:
                role_display = player.get_role_display()
                print(f"  Отображаемая роль: {role_display}")
            except Exception as e:
                print(f"  Ошибка при получении отображаемой роли: {str(e)}")
    
    except Team.DoesNotExist:
        print("Команда с ID=5 не найдена!")
    except Exception as e:
        print(f"Ошибка при получении команды: {str(e)}")
    
    print("=== КОНЕЦ ОТЛАДКИ ===\n")

if __name__ == "__main__":
    debug_team_detail()
