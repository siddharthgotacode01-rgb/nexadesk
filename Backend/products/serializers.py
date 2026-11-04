
from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):

    price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0
    )

    stock = serializers.IntegerField(
        min_value=0
    )

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('owner',)

    def validate_sku(self, value):
        request = self.context.get('request')

        if request and request.user.is_authenticated:
            products = Product.objects.filter(
                owner=request.user,
                sku=value
            )

            if self.instance:
                products = products.exclude(pk=self.instance.pk)

            if products.exists():
                raise serializers.ValidationError(
                    "You already have a product with this SKU."
                )

        return value
