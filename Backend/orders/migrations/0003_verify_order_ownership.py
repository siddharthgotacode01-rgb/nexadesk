from django.db import migrations


def verify_order_ownership(apps, schema_editor):
    Order = apps.get_model('orders', 'Order')

    unassigned = Order.objects.filter(owner__isnull=True).count()

    if unassigned:
        raise RuntimeError(
            f'{unassigned} orders have no owner. '
            'Assign them before making ownership mandatory.'
        )


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_order_owner'),
    ]

    operations = [
        migrations.RunPython(
            verify_order_ownership,
            migrations.RunPython.noop
        ),
    ]