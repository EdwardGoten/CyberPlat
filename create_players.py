# Создайте файл create_players.py в корне проекта

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cs2_tournament_platform.settings')
django.setup()

from django.contrib.auth.models import User
from tournaments.models import Player

# Получаем всех пользователей
users = User.objects.all()

# Для каждого пользователя проверяем наличие объекта Player
for user in users:
    try:
        # Пытаемся получить объект Player
        player = user.player
        print(f"Пользователь {user.username} уже имеет объект Player")
    except:
        # Если объекта Player нет, создаем его
        player = Player(user=user, nickname=user.username)
        player.save()
        print(f"Создан объект Player для пользователя {user.username}")

print("Готово!")