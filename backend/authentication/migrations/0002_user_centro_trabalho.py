import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
        ('core', '0002_centrodetrabaho'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='centro_trabalho',
            field=models.ForeignKey(
                blank=True,
                help_text='Filial à qual o usuário está associado. NULL indica primeiro acesso — acesso bloqueado até seleção.',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='usuarios',
                to='core.centrodetrabalho',
                verbose_name='Centro de Trabalho',
            ),
        ),
    ]
