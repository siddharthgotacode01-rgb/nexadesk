
from decimal import Decimal

from rest_framework import status
from rest_framework.test import APITestCase

from products.models import Product


class ProductAPITests(APITestCase):

    def setUp(self):
        self.url = '/api/products/'

        self.product = Product.objects.create(
            name="Test Headphones",
            sku="TEST-HEAD-001",
            category="Electronics",
            description="Test product",
            price=Decimal("1200.00"),
            stock=10
        )

    def test_create_product(self):

        response = self.client.post(
            self.url,
            {
                "name": "Test Keyboard",
                "sku": "TEST-KEY-001",
                "category": "Electronics",
                "description": "Mechanical keyboard",
                "price": "1500.00",
                "stock": 5
            },
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        self.assertEqual(Product.objects.count(), 2)

    def test_negative_price_is_rejected(self):

        response = self.client.post(
            self.url,
            {
                "name": "Invalid Product",
                "sku": "TEST-PRICE-001",
                "category": "Testing",
                "price": "-100",
                "stock": 5
            },
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertIn('price', response.data)
        self.assertEqual(Product.objects.count(), 1)

    def test_negative_stock_is_rejected(self):

        response = self.client.post(
            self.url,
            {
                "name": "Invalid Product",
                "sku": "TEST-STOCK-001",
                "category": "Testing",
                "price": "100",
                "stock": -5
            },
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertIn('stock', response.data)
        self.assertEqual(Product.objects.count(), 1)

    def test_duplicate_sku_is_rejected(self):

        response = self.client.post(
            self.url,
            {
                "name": "Duplicate Product",
                "sku": "TEST-HEAD-001",
                "category": "Electronics",
                "price": "500",
                "stock": 5
            },
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertIn('sku', response.data)
        self.assertEqual(Product.objects.count(), 1)
