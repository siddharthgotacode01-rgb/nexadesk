from django.db import migrations


def verify_product_ownership(apps, schema_editor):
    Product = apps.get_model('products', 'Product')

    unassigned = Product.objects.filter(owner__isnull=True).count()

    if unassigned:
        raise RuntimeError(
            f'{unassigned} products have no owner. '
            'Assign them before making ownership mandatory.'
        )


class Migration(migrations.Migration):

    dependencies = [
        (
            'products',
            '0002_product_owner_alter_product_name_alter_product_sku_and_more'
        ),
    ]

    operations = [
        migrations.RunPython(
            verify_product_ownership,
            migrations.RunPython.noop
        ),
    ]