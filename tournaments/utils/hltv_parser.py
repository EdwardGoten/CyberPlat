# tournaments/utils/hltv_parser.py

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import pytz
import re
import os
import logging
import time
import json
from django.utils import timezone
from tournaments.models import HLTVNews
from urllib.parse import urljoin
# Удаляем импорт googletrans
# from googletrans import Translator

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def parse_hltv_news():
    """Парсит новости с сайта HLTV.org и сохраняет их в базу данных"""
    logger.info("Начинаем парсинг новостей с сайта HLTV.org")
    
    # Базовый URL сайта HLTV
    base_url = 'https://www.hltv.org'
    
    logger.info(f"Запрашиваем страницу: {base_url}")
    
    try:
        # Используем заголовки для имитации браузера
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5,en;q=0.3',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0'
        }
        
        # Выполняем запрос к сайту
        response = requests.get(base_url, headers=headers, timeout=10)
        response.raise_for_status()
        logger.info(f"Получен ответ от сервера: {response.status_code}")
        
        # Сохраняем HTML для отладки
        debug_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'debug')
        os.makedirs(debug_dir, exist_ok=True)
        with open(os.path.join(debug_dir, 'hltv_response.html'), 'w', encoding='utf-8') as f:
            f.write(response.text)
        logger.info(f"HTML-ответ сохранен в {os.path.join(debug_dir, 'hltv_response.html')}")
        
        # Парсим HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Ищем главную новость (featured)
        featured_news = None
        featured_article = soup.select_one('.standard-headline, .featured-news')
        
        if featured_article:
            logger.info("Найдена главная новость")
            
            try:
                # Извлекаем данные главной новости
                featured_link = featured_article.find('a', href=True)
                if featured_link:
                    featured_url = urljoin(base_url, featured_link['href'])
                    featured_title = featured_link.get_text(strip=True)
                    
                    # Ищем изображение
                    featured_img = featured_article.find('img')
                    featured_img_url = None
                    if featured_img and featured_img.get('src'):
                        featured_img_url = urljoin(base_url, featured_img['src'])
                    
                    # Получаем детали новости
                    featured_content, featured_date = fetch_news_details(featured_url, headers)
                    
                    # Простой перевод заголовка и содержания
                    featured_title_ru = simple_translate(featured_title)
                    featured_content_ru = simple_translate(featured_content)
                    
                    # Создаем объект главной новости
                    featured_news = {
                        'title': featured_title,
                        'title_ru': featured_title_ru,
                        'content': featured_content,
                        'content_ru': featured_content_ru,
                        'image_url': featured_img_url,
                        'source_url': featured_url,
                        'published_date': featured_date,
                        'time_ago': 'Недавно',
                        'comments_count': 0,
                        'country_code': '',
                        'is_featured': True
                    }
                    
                    logger.info(f"Данные главной новости получены: {featured_title}")
            except Exception as e:
                logger.error(f"Ошибка при парсинге главной новости: {e}", exc_info=True)
        
        # Ищем обычные новости
        news_list = []
        news_articles = soup.select('.newslist .newsitem, .newslist article, .g-grid .standard-newsline')
        
        if not news_articles:
            # Альтернативный селектор
            news_articles = soup.select('.newslist tr, .newslist .news-item')
        
        logger.info(f"Найдено новостей: {len(news_articles)}")
        
        for article in news_articles[:10]:  # Берем только 10 последних новостей
            try:
                # Извлекаем ссылку и заголовок
                link = article.find('a', href=True)
                if not link:
                    continue
                
                news_url = urljoin(base_url, link['href'])
                news_title = link.get_text(strip=True)
                
                if not news_title:
                    # Ищем заголовок в другом месте
                    title_elem = article.select_one('.newstext, .title, .headline')
                    if title_elem:
                        news_title = title_elem.get_text(strip=True)
                
                # Ищем время публикации
                time_elem = article.select_one('.newsrecent, .date, .time')
                time_ago = time_elem.get_text(strip=True) if time_elem else 'Недавно'
                
                # Ищем количество комментариев
                comments_elem = article.select_one('.newstc, .comments')
                comments_count = 0
                if comments_elem:
                    comments_text = comments_elem.get_text(strip=True)
                    comments_match = re.search(r'\d+', comments_text)
                    if comments_match:
                        comments_count = int(comments_match.group())
                
                # Ищем флаг страны
                country_elem = article.select_one('.flag, img[src*="flag"]')
                country_code = ''
                if country_elem:
                    country_src = country_elem.get('src', '')
                    country_match = re.search(r'\/([a-z]{2})\.', country_src)
                    if country_match:
                        country_code = country_match.group(1)
                
                # Ищем изображение
                img = article.find('img')
                img_url = None
                if img and img.get('src'):
                    img_url = urljoin(base_url, img['src'])
                
                # Получаем детали новости
                content, published_date = fetch_news_details(news_url, headers)
                
                # Простой перевод заголовка и содержания
                title_ru = simple_translate(news_title)
                content_ru = simple_translate(content)
                
                # Добавляем новость в список
                news_list.append({
                    'title': news_title,
                    'title_ru': title_ru,
                    'content': content,
                    'content_ru': content_ru,
                    'image_url': img_url,
                    'source_url': news_url,
                    'published_date': published_date,
                    'time_ago': time_ago,
                    'comments_count': comments_count,
                    'country_code': country_code,
                    'is_featured': False
                })
                
                logger.info(f"Данные новости получены: {news_title}")
            
            except Exception as e:
                logger.error(f"Ошибка при парсинге новости: {e}", exc_info=True)
        
        # Добавляем главную новость в начало списка, если она есть
        if featured_news:
            news_list.insert(0, featured_news)
        
        # Сохраняем новости в базу данных
        news_count = 0
        for news_data in news_list:
            if not HLTVNews.objects.filter(source_url=news_data['source_url']).exists():
                news = HLTVNews(
                    title=news_data['title'],
                    title_ru=news_data['title_ru'],
                    content=news_data['content'],
                    content_ru=news_data['content_ru'],
                    image_url=news_data['image_url'],
                    source_url=news_data['source_url'],
                    published_date=news_data['published_date'],
                    time_ago=news_data['time_ago'],
                    comments_count=news_data['comments_count'],
                    country_code=news_data['country_code'],
                    is_featured=news_data['is_featured']
                )
                news.save()
                logger.info(f"Новость сохранена: {news_data['title']}")
                news_count += 1
            else:
                logger.info(f"Новость уже существует: {news_data['title']}")
        
        # Проверяем, есть ли новости в базе данных
        total_news_count = HLTVNews.objects.count()
        logger.info(f"Всего новостей в базе данных: {total_news_count}")
        logger.info(f"Добавлено новых новостей: {news_count}")
        
        if total_news_count == 0:
            logger.warning("Новости не были добавлены. Создаем тестовые новости.")
            create_test_hltv_news()
        
        return True
    
    except Exception as e:
        logger.error(f"Ошибка при парсинге новостей: {e}", exc_info=True)
        # Создаем тестовые новости в случае ошибки
        logger.info("Создаем тестовые новости из-за ошибки")
        create_test_hltv_news()
        return False

def fetch_news_details(url, headers):
    """Получает детали новости (содержание и дату) со страницы новости"""
    try:
        logger.info(f"Получаем детали новости с URL: {url}")
        
        # Добавляем небольшую задержку перед запросом
        time.sleep(1)
        
        # Выполняем запрос к странице новости
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Парсим HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Ищем содержание новости
        content = ""
        content_selectors = [
            '.newstext', '.article-content', '.text-content', '.news-content',
            '.standard-box', '.article', '.news-article'
        ]
        
        for selector in content_selectors:
            content_elem = soup.select_one(selector)
            if content_elem:
                # Ищем абзацы
                paragraphs = content_elem.find_all('p')
                if paragraphs:
                    # Берем первые 2-3 абзаца
                    content = ' '.join([p.get_text(strip=True) for p in paragraphs[:3]])
                    if content:
                        break
        
        # Если не нашли содержание, берем любой текст из страницы
        if not content:
            # Ищем любой текстовый элемент
            for tag in ['p', 'div', 'span']:
                elems = soup.find_all(tag)
                for elem in elems:
                    text = elem.get_text(strip=True)
                    if text and len(text) > 50:  # Минимальная длина для содержания
                        content = text
                        break
                if content:
                    break
        
        # Если все равно не нашли содержание, используем заголовок
        if not content:
            title_elem = soup.find(['h1', 'h2'])
            if title_elem:
                content = f"Подробности о новости '{title_elem.get_text(strip=True)}' читайте на сайте HLTV.org."
            else:
                content = "Подробности читайте на сайте HLTV.org."
        
        logger.info(f"Получено содержание: {content[:100]}...")
        
        # Ищем дату публикации
        published_date = timezone.now()  # По умолчанию текущая дата
        
        date_selectors = [
            '.date', 'time', '.timeago', '.article-date', '.time-date',
            '.datetime', '.article-time', '.news-date'
        ]
        
        for selector in date_selectors:
            date_elem = soup.select_one(selector)
            if date_elem:
                date_text = date_elem.get_text(strip=True)
                logger.info(f"Найдена дата: {date_text}")
                
                # Пробуем разные форматы даты
                try:
                    # Проверяем на формат "X hours/days ago"
                    if 'ago' in date_text.lower():
                        time_value = re.search(r'(\d+)', date_text)
                        if time_value:
                            value = int(time_value.group(1))
                            if 'hour' in date_text.lower():
                                published_date = timezone.now() - timedelta(hours=value)
                            elif 'day' in date_text.lower():
                                published_date = timezone.now() - timedelta(days=value)
                            elif 'minute' in date_text.lower():
                                published_date = timezone.now() - timedelta(minutes=value)
                            elif 'second' in date_text.lower():
                                published_date = timezone.now() - timedelta(seconds=value)
                            break
                    
                    # Формат: DD/MM/YYYY или MM/DD/YYYY
                    date_match = re.search(r'(\d{1,2})[/\.-](\d{1,2})[/\.-](\d{4})', date_text)
                    if date_match:
                        day, month, year = date_match.groups()
                        published_date = datetime(int(year), int(month), int(day))
                        published_date = pytz.timezone('UTC').localize(published_date)
                        break
                except Exception as e:
                    logger.error(f"Ошибка при парсинге даты: {e}")
        
        return content, published_date
    
    except Exception as e:
        logger.error(f"Ошибка при получении деталей новости: {e}", exc_info=True)
        return "Подробности читайте на сайте HLTV.org.", timezone.now()

def simple_translate(text):
    """Простой перевод текста на русский язык без использования внешних API"""
    if not text:
        return ""
    
    # Словарь с базовыми переводами для CS2 терминов
    translations = {
        "Major": "Мейджор",
        "qualify": "квалифицируются",
        "qualifies": "квалифицируется",
        "qualified": "квалифицировались",
        "spot": "место",
        "spots": "места",
        "secure": "обеспечивают",
        "secures": "обеспечивает",
        "secured": "обеспечили",
        "team": "команда",
        "teams": "команды",
        "player": "игрок",
        "players": "игроки",
        "tournament": "турнир",
        "tournaments": "турниры",
        "match": "матч",
        "matches": "матчи",
        "round": "раунд",
        "rounds": "раунды",
        "win": "победа",
        "wins": "победы",
        "lose": "поражение",
        "loses": "поражения",
        "lost": "проиграли",
        "defeat": "поражение",
        "defeats": "поражения",
        "defeated": "победили",
        "sign": "подписывают",
        "signs": "подписывает",
        "signed": "подписали",
        "join": "присоединяются к",
        "joins": "присоединяется к",
        "joined": "присоединились к",
        "leave": "покидают",
        "leaves": "покидает",
        "left": "покинули",
        "announce": "объявляют",
        "announces": "объявляет",
        "announced": "объявили",
        "report": "сообщают",
        "reports": "сообщает",
        "reported": "сообщили",
        "confirm": "подтверждают",
        "confirms": "подтверждает",
        "confirmed": "подтвердили",
        "out of": "выбывают из",
        "contention": "борьбы",
        "Austin": "Остин",
        "flawless": "безупречный",
        "run": "выступление",
        "earn": "получают",
        "earns": "получает",
        "earned": "получили",
        "home": "домашний",
        "berth": "место",
        "over": "над",
        "after": "после",
        "from": "из",
        "for": "для",
        "in": "в",
        "on": "на",
        "with": "с",
        "and": "и",
        "the": "",
        "a": "",
        "an": "",
    }
    
    # Простая замена слов
    translated = text
    for eng, rus in translations.items():
        # Заменяем только целые слова, учитывая регистр
        translated = re.sub(r'\b' + re.escape(eng) + r'\b', rus, translated, flags=re.IGNORECASE)
    
    return translated

def create_test_hltv_news():
    """Создает тестовые новости HLTV"""
    if HLTVNews.objects.exists():
        logger.info("Тестовые новости HLTV уже существуют")
        return
    
    logger.info("Создаем тестовые новости HLTV...")
    
    # Создаем тестовые новости на основе скриншота
    test_news = [
        {
            "title": "Falcons sign m0NESY",
            "title_ru": "Falcons подписывают m0NESY",
            "content": "Falcons have announced the signing of Ilya 'm0NESY' Osipov from G2. The 19-year-old Russian AWPer joins the French organization after a successful stint with G2, where he helped the team win several tournaments including IEM Cologne 2023.",
            "content_ru": "Falcons объявили о подписании Ильи 'm0NESY' Осипова из G2. 19-летний российский AWPer присоединяется к французской организации после успешного периода в G2, где он помог команде выиграть несколько турниров, включая IEM Cologne 2023.",
            "image_url": "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-gNtfnP4hmxcLjwSM8nLNpq7ws6sp13.png",
            "source_url": "https://www.hltv.org/news/falcons-sign-monesy",
            "published_date": timezone.now(),
            "time_ago": "1 час назад",
            "comments_count": 354,
            "country_code": "ru",
            "is_featured": True
        },
        {
            "title": "Short: Listen to OG's comms in their Major-qualifying round",
            "title_ru": "Короткое видео: Послушайте коммуникацию OG в их раунде квалификации на мейджор",
            "content": "OG have released a short video featuring the team's communications during their successful Major qualification match. The video gives fans a glimpse into the team's strategy and callouts during crucial rounds.",
            "content_ru": "OG выпустили короткое видео с коммуникацией команды во время их успешного матча квалификации на мейджор. Видео дает фанатам представление о стратегии команды и коллаутах во время решающих раундов.",
            "image_url": None,
            "source_url": "https://www.hltv.org/news/short-listen-to-ogs-comms",
            "published_date": timezone.now() - timedelta(minutes=13),
            "time_ago": "13 минут назад",
            "comments_count": 353,
            "country_code": "eu",
            "is_featured": False
        },
        {
            "title": "Chinggis Warriors secure Austin Major spot",
            "title_ru": "Chinggis Warriors обеспечивают место на мейджоре в Остине",
            "content": "Chinggis Warriors have secured a spot at the Austin Major after winning the Asian qualifier. The Mongolian team defeated several strong opponents on their way to qualification, showing impressive form throughout the tournament.",
            "content_ru": "Chinggis Warriors обеспечили себе место на мейджоре в Остине после победы в азиатской квалификации. Монгольская команда победила нескольких сильных соперников на пути к квалификации, показав впечатляющую форму на протяжении всего турнира.",
            "image_url": None,
            "source_url": "https://www.hltv.org/news/chinggis-warriors-secure-austin-major-spot",
            "published_date": timezone.now() - timedelta(hours=2),
            "time_ago": "2 часа назад",
            "comments_count": 27,
            "country_code": "mn",
            "is_featured": False
        },
        {
            "title": "TYLOO qualify for Austin Major over Rare Atom",
            "title_ru": "TYLOO квалифицируются на мейджор в Остине, обыграв Rare Atom",
            "content": "TYLOO have qualified for the Austin Major after defeating Rare Atom in the Chinese qualifier finals. The veteran Chinese organization will return to a Major for the first time since the Stockholm Major in 2021.",
            "content_ru": "TYLOO квалифицировались на мейджор в Остине после победы над Rare Atom в финале китайской квалификации. Ветеранская китайская организация вернется на мейджор впервые с мейджора в Стокгольме в 2021 году.",
            "image_url": None,
            "source_url": "https://www.hltv.org/news/tyloo-qualify-for-austin-major",
            "published_date": timezone.now() - timedelta(hours=5),
            "time_ago": "5 часов назад",
            "comments_count": 71,
            "country_code": "cn",
            "is_featured": False
        },
        {
            "title": "FlyQuest qualify for Austin Major after flawless MRQ run",
            "title_ru": "FlyQuest квалифицируются на мейджор в Остине после безупречного выступления в MRQ",
            "content": "FlyQuest have secured a spot at the Austin Major after a flawless run through the North American Major Regional Qualifier. The team didn't drop a single map throughout the qualification process, showcasing their dominance in the region.",
            "content_ru": "FlyQuest обеспечили себе место на мейджоре в Остине после безупречного выступления в североамериканской региональной квалификации. Команда не проиграла ни одной карты на протяжении всего процесса квалификации, продемонстрировав свое доминирование в регионе.",
            "image_url": None,
            "source_url": "https://www.hltv.org/news/flyquest-qualify-for-austin-major",
            "published_date": timezone.now() - timedelta(hours=8),
            "time_ago": "8 часов назад",
            "comments_count": 31,
            "country_code": "us",
            "is_featured": False
        },
        {
            "title": "Fluxo and Wildcard earn Austin Major spots",
            "title_ru": "Fluxo и Wildcard получают места на мейджоре в Остине",
            "content": "Fluxo and Wildcard have secured spots at the Austin Major through their respective regional qualifiers. The Brazilian and Oceanic representatives will join the growing list of teams set to compete at the prestigious event in May.",
            "content_ru": "Fluxo и Wildcard обеспечили себе места на мейджоре в Остине через свои региональные квалификации. Представители Бразилии и Океании присоединятся к растущему списку команд, которые будут соревноваться на престижном турнире в мае.",
            "image_url": None,
            "source_url": "https://www.hltv.org/news/fluxo-and-wildcard-earn-austin-major-spots",
            "published_date": timezone.now() - timedelta(hours=14),
            "time_ago": "14 часов назад",
            "comments_count": 43,
            "country_code": "br",
            "is_featured": False
        },
        {
            "title": "Complexity secure home Major berth, Imperial qualify from South America",
            "title_ru": "Complexity обеспечивают место на домашнем мейджоре, Imperial квалифицируются из Южной Америки",
            "content": "Complexity have secured a spot at their home Major in Austin, while Imperial have qualified through the South American qualifier. The North American organization will have the advantage of playing in front of their home crowd, while the Brazilian legends will represent South America at the event.",
            "content_ru": "Complexity обеспечили себе место на домашнем мейджоре в Остине, а Imperial квалифицировались через южноамериканскую квалификацию. Североамериканская организация получит преимущество игры перед домашней публикой, а бразильские легенды будут представлять Южную Америку на турнире.",
            "image_url": None,
            "source_url": "https://www.hltv.org/news/complexity-secure-home-major-berth",
            "published_date": timezone.now() - timedelta(hours=20),
            "time_ago": "20 часов назад",
            "comments_count": 29,
            "country_code": "us",
            "is_featured": False
        }
    ]
    
    for news_data in test_news:
        news = HLTVNews(
            title=news_data["title"],
            title_ru=news_data["title_ru"],
            content=news_data["content"],
            content_ru=news_data["content_ru"],
            image_url=news_data["image_url"],
            source_url=news_data["source_url"],
            published_date=news_data["published_date"],
            time_ago=news_data["time_ago"],
            comments_count=news_data["comments_count"],
            country_code=news_data["country_code"],
            is_featured=news_data["is_featured"]
        )
        news.save()
        logger.info(f"Создана тестовая новость HLTV: {news_data['title']}")
    
    # Проверяем, что новости созданы
    count = HLTVNews.objects.count()
    logger.info(f"Всего новостей HLTV в базе данных после создания тестовых: {count}")
