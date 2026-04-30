from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_alter_varejista_email'),
    ]

    operations = [
        migrations.CreateModel(
            name='CodigoCliente',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo', models.CharField(help_text='Código do produto no sistema do varejista.', max_length=60, verbose_name='Código')),
                ('necessita_saida', models.BooleanField(default=True, help_text='Se verdadeiro, o item gera lançamento de saída.', verbose_name='Necessita Saída')),
                ('centro_de_trabalho', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='codigos_cliente',
                    to='core.centrodetrabalho',
                    verbose_name='Centro de Trabalho',
                )),
                ('varejista', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='codigos_cliente',
                    to='core.varejista',
                    verbose_name='Varejista',
                )),
            ],
            options={
                'verbose_name': 'Código de Cliente',
                'verbose_name_plural': 'Códigos de Cliente',
                'unique_together': {('codigo', 'varejista', 'centro_de_trabalho')},
            },
        ),
        migrations.CreateModel(
            name='NotaFiscal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('numero', models.CharField(max_length=20, verbose_name='Número')),
                ('serie', models.CharField(max_length=5, verbose_name='Série')),
                ('chave_acesso', models.CharField(blank=True, max_length=44, verbose_name='Chave de Acesso')),
                ('protocolo', models.CharField(blank=True, max_length=50, verbose_name='Protocolo')),
                ('data_emissao', models.DateTimeField(verbose_name='Data de Emissão')),
                ('valor_total', models.DecimalField(decimal_places=2, max_digits=15, verbose_name='Valor Total')),
                ('observacao', models.TextField(blank=True, verbose_name='Observação')),
                ('criado_em', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('atualizado_em', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
                ('centro_de_trabalho', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='notas_fiscais',
                    to='core.centrodetrabalho',
                    verbose_name='Centro de Trabalho',
                )),
                ('varejista', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='notas_fiscais',
                    to='core.varejista',
                    verbose_name='Varejista',
                )),
            ],
            options={
                'verbose_name': 'Nota Fiscal',
                'verbose_name_plural': 'Notas Fiscais',
                'ordering': ['-criado_em'],
                'unique_together': {('numero', 'serie', 'varejista', 'centro_de_trabalho')},
            },
        ),
        migrations.CreateModel(
            name='ItemNotaFiscal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('codigo_varejo', models.CharField(max_length=60, verbose_name='Código de Varejo')),
                ('descricao', models.CharField(max_length=255, verbose_name='Descrição')),
                ('ean', models.CharField(blank=True, max_length=14, verbose_name='EAN')),
                ('ncm', models.CharField(blank=True, max_length=8, verbose_name='NCM')),
                ('quantidade', models.IntegerField(verbose_name='Quantidade')),
                ('valor_unitario', models.DecimalField(decimal_places=4, max_digits=15, verbose_name='Valor Unitário')),
                ('quantidade_restante', models.IntegerField(default=0, verbose_name='Quantidade Restante')),
                ('gera_saida', models.BooleanField(default=False, verbose_name='Gera Saída')),
                ('status', models.CharField(
                    choices=[('OK', 'OK'), ('NAO_CADASTRADO', 'Não Cadastrado')],
                    default='OK',
                    max_length=20,
                    verbose_name='Status',
                )),
                ('nota_fiscal', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='itens',
                    to='core.notafiscal',
                    verbose_name='Nota Fiscal',
                )),
            ],
            options={
                'verbose_name': 'Item de Nota Fiscal',
                'verbose_name_plural': 'Itens de Nota Fiscal',
            },
        ),
    ]
