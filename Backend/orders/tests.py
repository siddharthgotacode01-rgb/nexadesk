
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from customers.models import Customer
from products.models import Product
from orders.models import Order


class OrderAPITests(APITestCase):

    def setUp(self):
        self.customer = Customer.objects.create(
            name="Test Customer",
            email="test@example.com",
            phone="9999999999",
            address="Delhi",
            city="Delhi"
        )

        self.product = Product.objects.create(
            name="Test Headphones",
            sku="TEST-HEAD-001",
            category="Electronics",
            price=Decimal("1200.00"),
            stock=10
        )

        self.order_url = reverse('order-list')

    def test_create_order_deducts_stock(self):

        response = self.client.post(
            self.order_url,
            {
                "customer": self.customer.id,
                "product": self.product.id,
                "quantity": 2
            },
            format='json'
        )

        self.product.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.product.stock, 8)
        self.assertEqual(
            Decimal(str(response.data['total'])),
            Decimal("2400.00")
        )

    def test_delete_order_restores_stock(self):

        order = Order.objects.create(
            customer=self.customer,
            product=self.product,
            quantity=2,
            total=Decimal("2400.00")
        )

        self.product.stock = 8
        self.product.save()

        response = self.client.delete(
            reverse('order-detail', args=[order.id])
        )

        self.product.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.product.stock, 10)

    def test_zero_quantity_is_rejected(self):

        response = self.client.post(
            self.order_url,
            {
                "customer": self.customer.id,
                "product": self.product.id,
                "quantity": 0
            },
            format='json'
        )

        self.product.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('quantity', response.data)
        self.assertEqual(self.product.stock, 10)

    def test_insufficient_stock_is_rejected(self):

        response = self.client.post(
            self.order_url,
            {
                "customer": self.customer.id,
                "product": self.product.id,
                "quantity": 15
            },
            format='json'
        )

        self.product.refresh_from_db()

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(self.product.stock, 10)
        self.assertEqual(Order.objects.count(), 0)
