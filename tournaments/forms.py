from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Player, Team, Tournament, News, Match

class UserRegisterForm(UserCreationForm):
    email = forms.EmailField()
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Добавляем переводы подсказок для пароля
        self.fields['password1'].help_text = 'Пароль должен содержать не менее 8 символов и не может быть слишком простым.'

class PlayerForm(forms.ModelForm):
    class Meta:
        model = Player
        fields = ['nickname', 'first_name', 'last_name', 'country', 'city', 'role', 'avatar']

class TeamForm(forms.ModelForm):
    tag = forms.CharField(max_length=10, required=False, help_text="Короткое название команды (3-5 символов)")
    
    class Meta:
        model = Team
        fields = ['name', 'tag', 'logo', 'country']
        
    def clean(self):
        cleaned_data = super().clean()
        name = cleaned_data.get('name')
        tag = cleaned_data.get('tag')
        
        # Если тег не указан, создаем его из первых 3-5 букв названия команды
        if name and not tag:
            tag = name[:min(5, len(name))].upper()
            cleaned_data['tag'] = tag
            
        return cleaned_data
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # Если тег не указан, используем первые 3-5 букв названия команды
        if not instance.tag and instance.name:
            instance.tag = instance.name[:min(5, len(instance.name))].upper()
            
        if commit:
            instance.save()
            
        return instance

class TournamentForm(forms.ModelForm):
    class Meta:
        model = Tournament
        fields = ['name', 'description', 'start_date', 'end_date', 'location', 'prize_pool', 'image', 'format', 'status']
        widgets = {
            'start_date': forms.DateInput(attrs={'type': 'date'}),
            'end_date': forms.DateInput(attrs={'type': 'date'}),
        }

class NewsForm(forms.ModelForm):
    class Meta:
        model = News
        fields = ['title', 'content', 'image']

class MatchResultForm(forms.ModelForm):
    class Meta:
        model = Match
        fields = ['team1_score', 'team2_score']
        widgets = {
            'team1_score': forms.NumberInput(attrs={'min': 0, 'max': 100}),
            'team2_score': forms.NumberInput(attrs={'min': 0, 'max': 100}),
        }
