
from django.db import models
from customers.models import Customer
from products.models import Product
from django.conf import settings


class Order(models.Model):

    owner = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name='orders'
)

    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Completed', 'Completed'),
    ]

    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name='orders'
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='orders'
    )

    quantity = models.PositiveIntegerField()

    total = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='Pending'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Order #{self.id} - {self.customer.name}"
