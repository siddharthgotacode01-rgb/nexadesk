from django.db import models
from django.conf import settings


class Product(models.Model):

    owner = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    related_name='products'
)

    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)

    image = models.ImageField(
        upload_to='products/',
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'sku'],
                name='unique_product_sku_per_owner'
            )
        ]

    def __str__(self):
        return self.name