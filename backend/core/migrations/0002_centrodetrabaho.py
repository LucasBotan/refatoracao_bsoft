from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CentroDeTrabalho',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ct', models.CharField(db_index=True, help_text='Código do centro de trabalho. Deve ser único.', max_length=255, unique=True, verbose_name='CT')),
                ('nome', models.CharField(help_text='Nome do centro de trabalho.', max_length=255, verbose_name='Nome')),
                ('uf', models.CharField(help_text='Sigla do estado (ex.: SP, MG).', max_length=2, verbose_name='UF')),
            ],
            options={
                'verbose_name': 'Centro de Trabalho',
                'verbose_name_plural': 'Centros de Trabalho',
                'ordering': ['nome'],
            },
        ),
    ]
