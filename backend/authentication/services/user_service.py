"""
Serviço de gerenciamento do usuário local.

Responsável por criar ou atualizar o registro de User no banco de dados
a partir dos dados recebidos do Microsoft Graph. Isola o mapeamento
Graph → modelo local das views e do serviço Graph.
"""
import logging

from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

User = get_user_model()


def get_or_create_user(profile: dict, ms_groups: list[dict]) -> 'User':
    """
    Cria ou atualiza o usuário local com base nos dados do Microsoft Graph.

    Estratégia de upsert:
      - A chave primária de negócio é `microsoft_id` (campo `id` do Graph /me).
        Este campo é imutável no Azure AD — identificar o usuário por ele
        evita duplicatas se o e-mail for alterado.
      - Se o usuário já existir, todos os campos são atualizados para refletir
        o estado atual no Azure AD (ex.: mudança de grupos a cada login).
      - Se não existir, um novo registro é criado.

    Args:
        profile:   Dicionário retornado por graph_service.get_user_profile()
                   Campos esperados: id, displayName, mail, userPrincipalName
        ms_groups: Lista de grupos retornada por graph_service.get_user_groups()
                   Campos usados: displayName

    Returns:
        Instância do User local criada ou atualizada.
    """
    microsoft_id = profile['id']
    display_name = profile.get('displayName', '')

    # Preferir `mail`; usar `userPrincipalName` como fallback (ex.: contas guest)
    email = (profile.get('mail') or profile.get('userPrincipalName', '')).lower()

    # Extrair apenas os displayNames dos grupos para armazenamento local
    group_names = [
        g['displayName']
        for g in ms_groups
        if g.get('displayName')
    ]

    user, created = User.objects.update_or_create(
        microsoft_id=microsoft_id,
        defaults={
            'email': email,
            'username': email,  # email normalizado como username
            'first_name': _first_name(display_name),
            'last_name': _last_name(display_name),
            'microsoft_groups': group_names,
        },
    )

    action = 'criado' if created else 'atualizado'
    logger.info(
        'Usuário %s (microsoft_id=%s, grupos=%s)',
        action,
        microsoft_id,
        group_names,
    )

    return user


# ─── helpers privados ────────────────────────────────────────────────────────

def _first_name(display_name: str) -> str:
    """Extrai o primeiro nome do displayName."""
    return display_name.split(' ', 1)[0] if display_name else ''


def _last_name(display_name: str) -> str:
    """Extrai o sobrenome do displayName (tudo após o primeiro espaço)."""
    parts = display_name.split(' ', 1)
    return parts[1] if len(parts) > 1 else ''
