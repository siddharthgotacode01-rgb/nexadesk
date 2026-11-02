
from rest_framework import serializers
from .models import Order


class OrderSerializer(serializers.ModelSerializer):

    customer_name = serializers.CharField(
        source='customer.name',
        read_only=True
    )

    product_name = serializers.CharField(
        source='product.name',
        read_only=True
    )

    quantity = serializers.IntegerField(
        min_value=1
    )

    class Meta:
        model = Order

        fields = [
            'id',
            'customer',
            'customer_name',
            'product',
            'product_name',
            'quantity',
            'total',
            'status',
            'created_at',
        ]

        read_only_fields = [
            'id',
            'total',
            'created_at',
        ]
