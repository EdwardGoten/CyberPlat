import os
import sys
import django
import logging
import datetime

# Настройка логирования
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, 'news_fetcher.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(log_file, encoding='utf-8')
    ]
)

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cs2_tournament_platform.settings')

try:
    django.setup()
    logging.info("Django успешно настроен")
except Exception as e:
    logging.error(f"Ошибка при настройке Django: {e}")
    sys.exit(1)

try:
    # Импортируем функцию fetch_news из скрипта fetch_qcf_news.py
    from fetch_qcf_news import fetch_qcf_news
    
    logging.info(f"Запуск получения новостей: {datetime.datetime.now()}")
    
    # Запускаем функцию получения новостей
    fetch_qcf_news()
    
    logging.info(f"Получение новостей завершено: {datetime.datetime.now()}")
    
except Exception as e:
    logging.error(f"Ошибка при выполнении скрипта: {e}")
    sys.exit(1)
