from django.core.management.base import BaseCommand
from tournaments.models import Team, Tournament

class Command(BaseCommand):
    help = 'Добавляет все команды в турнир Summer CUP 2025'

    def add_arguments(self, parser):
        parser.add_argument('--tournament', type=str, default="Summer CUP 2025", 
                            help='Название турнира (по умолчанию "Summer CUP 2025")')

    def handle(self, *args, **options):
        tournament_name = options['tournament']
        
        # Получаем турнир
        try:
            tournament = Tournament.objects.get(name=tournament_name)
            self.stdout.write(self.style.SUCCESS(f"Найден турнир: {tournament.name} (ID: {tournament.pk})"))
        except Tournament.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"Турнир '{tournament_name}' не найден."))
            return
        except Tournament.MultipleObjectsReturned:
            self.stdout.write(self.style.WARNING(f"Найдено несколько турниров с именем '{tournament_name}'. Используем первый."))
            tournament = Tournament.objects.filter(name=tournament_name).first()
        
        # Получаем все команды
        teams = Team.objects.all()
        
        if not teams.exists():
            self.stdout.write(self.style.ERROR("Команды не найдены. Сначала создайте команды."))
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
                    self.stdout.write(f"Команда '{team.name}' добавлена в турнир.")
                else:
                    self.stdout.write(self.style.WARNING(f"Команда '{team.name}' пропущена, так как в ней нет игроков."))
        
        if teams_added == 0:
            self.stdout.write(self.style.WARNING("Все команды уже участвуют в турнире или не имеют игроков."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Всего добавлено {teams_added} команд в турнир '{tournament.name}'."))
            self.stdout.write(self.style.SUCCESS(f"Теперь в турнире участвует {tournament.teams.count()} команд."))
