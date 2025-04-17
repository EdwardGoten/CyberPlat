from PIL import Image, ImageDraw, ImageFont
import os

# Создаем директорию, если она не существует
os.makedirs('static/img', exist_ok=True)

# Функция для создания изображения-заполнителя
def create_placeholder(filename, width, height, text, bg_color=(200, 200, 200), text_color=(50, 50, 50)):
    img = Image.new('RGB', (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    # Используем шрифт по умолчанию
    font = ImageFont.load_default()
    
    # Рисуем текст по центру
    text_width, text_height = draw.textsize(text, font=font) if hasattr(draw, 'textsize') else (width//2, height//2)
    position = ((width - text_width) // 2, (height - text_height) // 2)
    draw.text(position, text, fill=text_color, font=font)
    
    # Сохраняем изображение
    img.save(f'static/img/{filename}')
    print(f'Создан файл static/img/{filename}')

# Создаем заполнители
create_placeholder('default-news-banner.jpg', 1200, 600, 'News Banner')
create_placeholder('default-news.jpg', 800, 400, 'News Image')
create_placeholder('default-banner.jpg', 1200, 600, 'Banner Image')
create_placeholder('default-tournament.jpg', 800, 400, 'Tournament Image')