import os
import sys
import subprocess
from datetime import datetime, timedelta

def setup_windows_task():
    """Настройка задачи в Планировщике заданий Windows для запуска скрипта каждый час"""
    try:
        # Получаем текущую директорию и пути к файлам
        current_dir = os.path.dirname(os.path.abspath(__file__))
        python_path = sys.executable
        script_path = os.path.join(current_dir, 'run_news_fetcher.py')
        
        # Имя задачи
        task_name = "CS2TournamentNewsFetcher"
        
        # Проверяем, существует ли уже задача
        check_task_cmd = f'schtasks /query /tn "{task_name}" 2>nul'
        task_exists = subprocess.call(check_task_cmd, shell=True) == 0
        
        if task_exists:
            print(f"Задача '{task_name}' уже существует в Планировщике заданий Windows.")
            choice = input("Хотите пересоздать задачу? (y/n): ")
            if choice.lower() != 'y':
                return
            
            # Удаляем существующую задачу
            delete_cmd = f'schtasks /delete /tn "{task_name}" /f'
            subprocess.call(delete_cmd, shell=True)
        
        # Создаем команду для запуска
        command = f'"{python_path}" "{script_path}"'
        
        # Время начала (через минуту от текущего времени)
        start_time = (datetime.now() + timedelta(minutes=1)).strftime("%H:%M")
        
        # Создаем задачу, которая запускается каждый час
        create_task_cmd = (
            f'schtasks /create /tn "{task_name}" /tr "{command}" '
            f'/sc HOURLY /st {start_time} /ru SYSTEM /f'
        )
        
        result = subprocess.call(create_task_cmd, shell=True)
        
        if result == 0:
            print(f"Задача '{task_name}' успешно создана в Планировщике заданий Windows.")
            print(f"Скрипт будет запускаться каждый час, начиная с {start_time}.")
        else:
            print("Ошибка при создании задачи. Попробуйте запустить скрипт от имени администратора.")
    
    except Exception as e:
        print(f"Ошибка при настройке задачи: {e}")
        print("Попробуйте запустить скрипт от имени администратора.")

if __name__ == "__main__":
    setup_windows_task()
