import os
import django
import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime
import logging
import urllib.parse

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('news_fetcher.log', encoding='utf-8')
    ]
)

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cs2_tournament_platform.settings')
django.setup()

from tournaments.models import News
from django.utils.text import slugify
from django.core.files.base import ContentFile
from django.conf import settings
import urllib.request
import os

def fetch_qcf_news():
    # Правильный URL для страницы новостей
    url = "https://qcf.kz/novosti/"
    
    try:
        logging.info(f"Получение новостей с URL: {url}")
        response = requests.get(url)
        response.raise_for_status()  # Проверка на ошибки HTTP
        
        # Проверяем кодировку
        logging.info(f"Кодировка ответа: {response.encoding}")
        response.encoding = 'utf-8'  # Устанавливаем кодировку явно
        
    except requests.exceptions.RequestException as e:
        logging.error(f"Ошибка при получении страницы: {e}")
        return

    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Логируем структуру HTML для отладки
    logging.info("Анализ структуры HTML страницы...")
    
    # Находим все новостные блоки
    news_items = soup.select('.anwp-pg-post-teaser')
    
    if not news_items:
        logging.warning("Не найдены блоки новостей на странице. Проверяем альтернативные селекторы...")
        # Пробуем альтернативные селекторы
        news_items = soup.select('.news-item')
        if not news_items:
            news_items = soup.select('article')
            if not news_items:
                logging.error("Не удалось найти блоки новостей на странице")
                return
    
    logging.info(f"Найдено {len(news_items)} новостей на странице")
    
    for item in news_items:
        try:
            # Извлекаем заголовок
            title_element = item.select_one('.anwp-pg-post-teaser__title')
            if not title_element:
                title_element = item.select_one('h2') or item.select_one('h3') or item.select_one('.title')
            
            if not title_element:
                logging.warning("Не найден заголовок новости, пропускаем")
                continue
                
            title = title_element.text.strip()
            logging.info(f"Обрабатываем новость: {title}")
            
            # Получаем ссылку на полную новость
            link_element = title_element.find('a')
            if not link_element:
                link_element = item.select_one('a')
            
            if not link_element or not link_element.get('href'):
                logging.warning(f"Не найдена ссылка для новости '{title}', пропускаем")
                continue
                
            news_link = link_element.get('href')
            if not news_link.startswith('http'):
                news_link = urllib.parse.urljoin('https://qcf.kz', news_link)
            
            logging.info(f"URL новости: {news_link}")
            
            # Проверяем, существует ли уже новость с таким заголовком
            existing_news = News.objects.filter(title=title).first()
            if existing_news:
                # Обновляем URL источника, если он отсутствует
                if not existing_news.source_url:
                    existing_news.source_url = news_link
                    existing_news.save()
                    logging.info(f"Обновлен URL источника для новости: {title}")
                else:
                    logging.info(f"Новость уже существует: {title}")
                continue
            
            # Получаем дату
            date_element = item.select_one('.anwp-pg-post-teaser__bottom-meta time')
            if date_element:
                date_str = date_element.get('datetime')
                if date_str:
                    try:
                        # Парсим строку даты и времени
                        date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    except ValueError:
                        logging.warning(f"Неверный формат даты: {date_str}")
                        date = datetime.now()
                else:
                    date = datetime.now()
            else:
                logging.warning("Не найдена дата новости")
                date = datetime.now()
            
            # Получаем содержимое
            content_element = item.select_one('.anwp-pg-post-teaser__excerpt')
            if not content_element:
                content_element = item.select_one('.excerpt') or item.select_one('.content') or item.select_one('p')
            
            if content_element:
                content = content_element.text.strip()
            else:
                logging.warning("Не найдено содержимое новости")
                content = ""
            
            # Получаем изображение
            image_url = None
            image_element = item.select_one('.anwp-pg-post-teaser__thumbnail-img')
            if not image_element:
                image_element = item.select_one('img')
            
            if image_element and image_element.get('src'):
                image_url = image_element.get('src')
                if not image_url.startswith('http'):
                    image_url = urllib.parse.urljoin('https://qcf.kz', image_url)
                logging.info(f"URL изображения: {image_url}")
            
            # Создаем новую запись в базе данных
            news = News(
                title=title,
                content=content,
                created_at=date,
                updated_at=date,
                source_url=news_link  # Сохраняем URL источника
            )
            
            # Сохраняем новость, чтобы получить ID
            news.save()
            
            # Загружаем и сохраняем изображение, если оно есть
            if image_url:
                try:
                    # Получаем имя файла из URL
                    image_name = os.path.basename(image_url)
                    if '?' in image_name:
                        image_name = image_name.split('?')[0]
                    
                    # Если нет расширения, добавляем .jpg
                    if '.' not in image_name:
                        image_name += '.jpg'
                    
                    # Загружаем изображение
                    img_response = requests.get(image_url, timeout=10)
                    img_response.raise_for_status()
                    
                    # Сохраняем изображение в объект новости
                    news.image.save(
                        image_name,
                        ContentFile(img_response.content),
                        save=True
                    )
                    
                    logging.info(f"Изображение сохранено: {image_name}")
                except Exception as e:
                    logging.error(f"Ошибка при сохранении изображения: {e}")
                    # Если не удалось сохранить изображение, используем изображение по умолчанию
                    news.image = 'default-news.jpg'
                    news.save()
            else:
                # Если изображение не найдено, используем изображение по умолчанию
                news.image = 'default-news.jpg'
                news.save()
            
            logging.info(f"Добавлена новая новость: {title}")
            
        except Exception as e:
            logging.error(f"Ошибка при обработке новости: {e}")

if __name__ == "__main__":
    logging.info("Запуск скрипта получения новостей")
    fetch_qcf_news()
    logging.info("Скрипт завершен")
