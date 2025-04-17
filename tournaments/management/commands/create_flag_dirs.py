# tournaments/management/commands/create_flag_dirs.py

from django.core.management.base import BaseCommand
import os
from django.conf import settings
import shutil

class Command(BaseCommand):
    help = 'Создает директории для флагов стран и добавляет базовые флаги'

    def handle(self, *args, **options):
        self.stdout.write('Создаем директории для флагов стран...')
        
        # Создаем директорию для флагов
        static_dir = os.path.join(settings.BASE_DIR, 'tournaments', 'static')
        img_dir = os.path.join(static_dir, 'img')
        flags_dir = os.path.join(img_dir, 'flags')
        
        os.makedirs(flags_dir, exist_ok=True)
        
        # Создаем пустой файл default.png
        default_flag = os.path.join(flags_dir, 'default.png')
        if not os.path.exists(default_flag):
            # Создаем пустое изображение 16x16 пикселей
            try:
                from PIL import Image
                img = Image.new('RGBA', (16, 16), (128, 128, 128, 255))
                img.save(default_flag)
                self.stdout.write(f'Создан файл флага по умолчанию: {default_flag}')
            except ImportError:
                # Если PIL не установлен, просто создаем пустой файл
                with open(default_flag, 'wb') as f:
                    f.write(b'')
                self.stdout.write(f'Создан пустой файл флага по умолчанию: {default_flag}')
        
        # Список стран для создания пустых файлов флагов
        countries = ['ru', 'us', 'eu', 'br', 'cn', 'mn', 'kz', 'ua', 'de', 'fr', 'uk', 'se', 'dk', 'fi', 'no']
        
        for country in countries:
            flag_file = os.path.join(flags_dir, f'{country}.png')
            if not os.path.exists(flag_file):
                # Копируем default.png
                shutil.copy(default_flag, flag_file)
                self.stdout.write(f'Создан файл флага для страны {country}: {flag_file}')
        
        self.stdout.write(self.style.SUCCESS(f'Директория для флагов создана: {flags_dir}'))
        self.stdout.write(self.style.SUCCESS(f'Добавлены базовые файлы флагов для {len(countries)} стран'))
