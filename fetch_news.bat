@echo off
chcp 65001 > nul
echo Запуск получения новостей с QCF...
python -X utf8 run_news_fetcher.py
echo Новости успешно получены.
pause
