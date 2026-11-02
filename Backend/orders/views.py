
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import Order
from .serializers import OrderSerializer
from products.models import Product


class OrderViewSet(viewsets.ModelViewSet):

    queryset = Order.objects.select_related(
        'customer',
        'product'
    ).all().order_by('-created_at')

    serializer_class = OrderSerializer

    def create(self, request, *args, **kwargs):

        with transaction.atomic():

            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            product = serializer.validated_data['product']
            quantity = serializer.validated_data['quantity']

            try:
                product = Product.objects.select_for_update().get(
                    pk=product.pk
                )
            except Product.DoesNotExist:
                raise ValidationError('Product not found.')

            if product.stock < quantity:
                raise ValidationError(
                    'Not enough stock available.'
                )

            product.stock -= quantity
            product.save(update_fields=['stock'])

            serializer.save(
                total=product.price * quantity
            )

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

    def perform_update(self, serializer):

        with transaction.atomic():

            if (
                'quantity' in self.request.data
                or 'product' in self.request.data
            ):
                raise ValidationError(
                    'Changing the product or quantity of an existing order '
                    'is not supported yet.'
                )

            serializer.save()

    def perform_destroy(self, instance):

        with transaction.atomic():

            product = Product.objects.select_for_update().get(
                pk=instance.product_id
            )

            product.stock += instance.quantity
            product.save(update_fields=['stock'])

            instance.delete()
