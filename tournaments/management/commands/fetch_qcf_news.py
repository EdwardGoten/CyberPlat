from django.core.management.base import BaseCommand
import os
import sys
import django
import datetime

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

# Import the fetch_news_from_qcf function
from fetch_qcf_news import fetch_news_from_qcf

class Command(BaseCommand):
    help = 'Fetches news from QCF website and saves them to the database'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to fetch news from QCF...'))
        
        success = fetch_news_from_qcf()
        
        if success:
            self.stdout.write(self.style.SUCCESS('Successfully fetched news from QCF'))
        else:
            self.stdout.write(self.style.ERROR('Failed to fetch news from QCF'))
