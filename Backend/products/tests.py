
from decimal import Decimal

from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from products.models import Product

User = get_user_model()


class ProductAPITests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(
            username="product_user1",
            password="TestPassword123!"
        )

        self.user2 = User.objects.create_user(
            username="product_user2",
            password="TestPassword123!"
        )

        self.url = '/api/products/products/'

        self.client.force_authenticate(user=self.user1)

        self.product = Product.objects.create(
            owner=self.user1,
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

        self.assertEqual(
            Product.objects.filter(owner=self.user1).count(),
            2
        )

        new_product = Product.objects.get(sku="TEST-KEY-001")
        self.assertEqual(new_product.owner, self.user1)

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

    def test_user_cannot_see_another_users_products(self):
        Product.objects.create(
            owner=self.user2,
            name="Private Product",
            sku="PRIVATE-001",
            category="Electronics",
            price=Decimal("500.00"),
            stock=5
        )

        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]['name'],
            "Test Headphones"
        )

    def test_user_cannot_retrieve_another_users_product(self):
        other_product = Product.objects.create(
            owner=self.user2,
            name="Private Product",
            sku="PRIVATE-002",
            category="Electronics",
            price=Decimal("500.00"),
            stock=5
        )

        response = self.client.get(
            f'{self.url}{other_product.id}/'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_user_cannot_update_another_users_product(self):
        other_product = Product.objects.create(
            owner=self.user2,
            name="Private Product",
            sku="PRIVATE-003",
            category="Electronics",
            price=Decimal("500.00"),
            stock=5
        )

        response = self.client.patch(
            f'{self.url}{other_product.id}/',
            {"price": "100"},
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

        other_product.refresh_from_db()
        self.assertEqual(other_product.price, Decimal("500.00"))

    def test_user_cannot_delete_another_users_product(self):
        other_product = Product.objects.create(
            owner=self.user2,
            name="Private Product",
            sku="PRIVATE-004",
            category="Electronics",
            price=Decimal("500.00"),
            stock=5
        )

        response = self.client.delete(
            f'{self.url}{other_product.id}/'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

        self.assertTrue(
            Product.objects.filter(id=other_product.id).exists()
        )

    def test_unauthenticated_user_cannot_access_products(self):
        anonymous_client = APIClient()

        response = anonymous_client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )
