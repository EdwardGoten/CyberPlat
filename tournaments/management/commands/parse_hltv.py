# tournaments/management/commands/parse_hltv.py

from django.core.management.base import BaseCommand
from tournaments.utils.hltv_parser import parse_hltv_news

class Command(BaseCommand):
    help = 'Парсит новости с сайта HLTV.org и сохраняет их в базу данных'

    def handle(self, *args, **options):
        self.stdout.write('Начинаем парсинг новостей HLTV...')
        success = parse_hltv_news()
        if success:
            self.stdout.write(self.style.SUCCESS('Парсинг новостей HLTV успешно завершен!'))
        else:
            self.stdout.write(self.style.ERROR('Произошла ошибка при парсинге новостей HLTV.'))
