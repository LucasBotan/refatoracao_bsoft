from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Painel admin com campos adicionais do Azure AD."""

    list_display = ('email', 'username', 'first_name', 'last_name', 'is_staff', 'microsoft_id')
    search_fields = ('email', 'username', 'microsoft_id')
    ordering = ('email',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Azure Active Directory', {
            'fields': ('microsoft_id', 'microsoft_groups'),
        }),
    )
