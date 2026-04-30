from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Varejista',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(help_text='Razão social ou nome fantasia do varejista.', max_length=255, verbose_name='Nome')),
                ('cnpj', models.CharField(db_index=True, help_text='CNPJ no formato XX.XXX.XXX/XXXX-XX. Deve ser único.', max_length=18, unique=True, verbose_name='CNPJ')),
                ('consumidor', models.CharField(blank=True, help_text='Classificação do tipo de consumidor (ex.: B2B, B2C, Varejo).', max_length=255, verbose_name='Consumidor')),
                ('telefone', models.CharField(blank=True, help_text='Telefone de contato com DDD.', max_length=20, verbose_name='Telefone')),
                ('email', models.EmailField(blank=True, max_length=254, verbose_name='E-mail')),
                ('cep', models.CharField(blank=True, help_text='CEP no formato XXXXX-XXX.', max_length=9, verbose_name='CEP')),
                ('endereco', models.CharField(blank=True, help_text='Logradouro sem número.', max_length=255, verbose_name='Endereço')),
                ('numero', models.CharField(blank=True, help_text='Número do endereço.', max_length=20, verbose_name='Número')),
                ('bairro', models.CharField(blank=True, max_length=100, verbose_name='Bairro')),
                ('complemento', models.CharField(blank=True, max_length=100, verbose_name='Complemento')),
                ('cidade', models.CharField(blank=True, max_length=100, verbose_name='Cidade')),
                ('estado', models.CharField(blank=True, help_text='Sigla UF com 2 letras (ex.: SP, MG).', max_length=2, verbose_name='Estado')),
                ('ct', models.CharField(help_text='Código de tomador. Campo obrigatório.', max_length=255, verbose_name='CT')),
                ('ativo', models.BooleanField(default=True, help_text='Registros inativos são tratados como excluídos logicamente.', verbose_name='Ativo')),
                ('criado_em', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('atualizado_em', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
            ],
            options={
                'verbose_name': 'Varejista',
                'verbose_name_plural': 'Varejistas',
                'ordering': ['nome'],
            },
        ),
    ]
