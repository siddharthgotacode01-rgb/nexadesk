from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):

    list_display = (
        'name',
        'sku',
        'category',
        'price',
        'stock',
        'created_at'
    )

    search_fields = (
        'name',
        'sku',
        'category'
    )

    list_filter = (
        'category',
    )