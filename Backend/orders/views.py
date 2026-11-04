from django.db import transaction

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import Order
from .serializers import OrderSerializer
from products.models import Product


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects
            .filter(owner=self.request.user)
            .select_related('customer', 'product')
            .order_by('-created_at')
        )

    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            customer = serializer.validated_data['customer']
            product_data = serializer.validated_data['product']
            quantity = serializer.validated_data['quantity']

            # Verify customer ownership
            if customer.owner_id != request.user.id:
                raise ValidationError(
                    'Customer does not belong to your account.'
                )

            # Retrieve only a product owned by this user
            try:
                product = Product.objects.select_for_update().get(
                    pk=product_data.pk,
                    owner=request.user
                )
            except Product.DoesNotExist:
                raise ValidationError(
                    'Product does not belong to your account.'
                )

            # Check available stock
            if product.stock < quantity:
                raise ValidationError(
                    'Not enough stock available.'
                )

            # Deduct stock
            product.stock -= quantity
            product.save(update_fields=['stock'])

            # Create order with automatic ownership
            serializer.save(
                owner=request.user,
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
                or 'customer' in self.request.data
            ):
                raise ValidationError(
                    'Changing the customer, product or quantity '
                    'of an existing order is not supported yet.'
                )

            serializer.save()

    def perform_destroy(self, instance):
        with transaction.atomic():
            try:
                product = Product.objects.select_for_update().get(
                    pk=instance.product_id,
                    owner=self.request.user
                )
            except Product.DoesNotExist:
                raise ValidationError(
                    'Associated product does not belong to your account.'
                )

            product.stock += instance.quantity
            product.save(update_fields=['stock'])

            instance.delete()