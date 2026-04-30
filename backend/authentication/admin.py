from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Painel admin com campos adicionais do Azure AD."""

    list_display = ('email', 'username', 'first_name', 'last_name', 'is_staff', 'microsoft_id', 'centro_trabalho')
    search_fields = ('email', 'username', 'microsoft_id')
    list_filter = BaseUserAdmin.list_filter + ('centro_trabalho',)
    list_select_related = ('centro_trabalho',)
    ordering = ('email',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Azure Active Directory', {
            'fields': ('microsoft_id', 'microsoft_groups'),
        }),
        ('Centro de Trabalho', {
            'fields': ('centro_trabalho',),
        }),
    )
