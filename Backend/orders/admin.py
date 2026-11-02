
from django.contrib import admin
from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'customer',
        'product',
        'quantity',
        'total',
        'status',
        'created_at'
    )

    search_fields = (
        'customer__name',
        'product__name'
    )

    list_filter = (
        'status',
        'created_at'
    )
