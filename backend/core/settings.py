"""
Configurações Django para o projeto de autenticação Microsoft.

Variáveis sensíveis (CLIENT_ID, CLIENT_SECRET, etc.) são carregadas
exclusivamente via variáveis de ambiente / arquivo .env.
"""
import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# Carrega o arquivo .env localizado na raiz do projeto backend
load_dotenv(Path(__file__).resolve().parent.parent / '.env')

BASE_DIR = Path(__file__).resolve().parent.parent

# ==============================================================================
# CONFIGURAÇÕES ESSENCIAIS
# ==============================================================================

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-dev-only-change-in-production')

DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# ==============================================================================
# APLICAÇÕES INSTALADAS
# ==============================================================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'corsheaders',
    # Local
    'authentication',
]

# ==============================================================================
# MIDDLEWARE
# ==============================================================================

MIDDLEWARE = [
    # CorsMiddleware deve vir antes de CommonMiddleware
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'
WSGI_APPLICATION = 'core.wsgi.application'

# ==============================================================================
# TEMPLATES
# ==============================================================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ==============================================================================
# BANCO DE DADOS
# ==============================================================================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ==============================================================================
# MODELO DE USUÁRIO CUSTOMIZADO
# Deve ser definido antes das migrações. Referencia authentication.User.
# ==============================================================================

AUTH_USER_MODEL = 'authentication.User'

# ==============================================================================
# DJANGO REST FRAMEWORK
# ==============================================================================

REST_FRAMEWORK = {
    # JWT como mecanismo de autenticação para chamadas de API
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    # Por padrão, todos os endpoints exigem autenticação
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# ==============================================================================
# JWT — djangorestframework-simplejwt
# ==============================================================================

SIMPLE_JWT = {
    # Access token com validade curta por segurança
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    # Refresh token com validade longa para experiência do usuário
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    # Rotacionar refresh token a cada uso
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# ==============================================================================
# AZURE AD / MICROSOFT IDENTITY PLATFORM
# Configurações lidas exclusivamente via variáveis de ambiente
# ==============================================================================

AZURE_AD_CLIENT_ID = os.environ.get('CLIENT_ID', '')
AZURE_AD_CLIENT_SECRET = os.environ.get('CLIENT_SECRET', '')
AZURE_AD_TENANT_ID = os.environ.get('TENANT_ID', '')
AZURE_AD_REDIRECT_URI = os.environ.get(
    'REDIRECT_URI', 'http://localhost:8000/auth/callback/'
)

# URL base do frontend React (usado para redirect após callback OAuth2)
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Escopos OAuth2 necessários para dados de usuário e grupos
AZURE_AD_SCOPES = [
    'User.Read',            # Acesso a /me (nome, email, ID)
    'GroupMember.Read.All', # Acesso a /me/memberOf (grupos)
]

# ==============================================================================
# SESSÕES (necessário para armazenar o state OAuth2 anti-CSRF)
# ==============================================================================

SESSION_ENGINE = 'django.contrib.sessions.backends.db'
# 10 minutos é suficiente para o usuário completar o login Microsoft
SESSION_COOKIE_AGE = 600
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# ==============================================================================
# CORS
# ==============================================================================

CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS', 'http://localhost:3000'
).split(',')
CORS_ALLOW_CREDENTIALS = True

# ==============================================================================
# ARQUIVOS ESTÁTICOS
# ==============================================================================

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ==============================================================================
# INTERNACIONALIZAÇÃO
# ==============================================================================

LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# ==============================================================================
# LOGGING
# ==============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        # Logger dedicado para o app de autenticação
        'authentication': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
