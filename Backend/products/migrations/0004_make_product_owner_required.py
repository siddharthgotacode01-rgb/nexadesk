from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        (
            'products',
            '0003_verify_product_ownershi',
        ),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='owner',
            field=models.ForeignKey(
                to='auth.user',
                on_delete=django.db.models.deletion.CASCADE,
                related_name='products',
            ),
        ),
    ]
    