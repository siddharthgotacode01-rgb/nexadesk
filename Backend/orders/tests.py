
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse

from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from customers.models import Customer
from products.models import Product
from orders.models import Order


User = get_user_model()


class OrderAPITests(APITestCase):

    def setUp(self):
        # Create two separate accounts
        self.user1 = User.objects.create_user(
            username="user1",
            password="testpassword123"
        )

        self.user2 = User.objects.create_user(
            username="user2",
            password="testpassword123"
        )

        # Authenticate as user1
        self.client.force_authenticate(user=self.user1)

        # Create customers belonging to different accounts
        self.customer = Customer.objects.create(
            owner=self.user1,
            name="Test Customer",
            email="test@example.com",
            phone="9999999999",
            address="Delhi",
            city="Delhi"
        )

        self.other_customer = Customer.objects.create(
            owner=self.user2,
            name="Other Customer",
            email="other@example.com",
            phone="8888888888",
            address="Mumbai",
            city="Mumbai"
        )

        # Create products belonging to different accounts
        self.product = Product.objects.create(
            owner=self.user1,
            name="Test Headphones",
            sku="TEST-HEAD-001",
            category="Electronics",
            price=Decimal("1200.00"),
            stock=10
        )

        self.other_product = Product.objects.create(
            owner=self.user2,
            name="Other Headphones",
            sku="TEST-HEAD-002",
            category="Electronics",
            price=Decimal("1500.00"),
            stock=10
        )

        self.order_url = reverse("order-list")

        # Create an existing order belonging to user1
        self.order = Order.objects.create(
            owner=self.user1,
            customer=self.customer,
            product=self.product,
            quantity=2,
            total=Decimal("2400.00")
        )

        # Reflect the stock already deducted for this order
        self.product.stock = 8
        self.product.save()

    def test_create_order_deducts_stock(self):
        response = self.client.post(
            self.order_url,
            {
                "customer": self.customer.id,
                "product": self.product.id,
                "quantity": 2
            },
            format="json"
        )

        self.product.refresh_from_db()

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        self.assertEqual(self.product.stock, 6)

        self.assertEqual(
            Decimal(str(response.data["total"])),
            Decimal("2400.00")
        )

        self.assertEqual(
            Order.objects.filter(owner=self.user1).count(),
            2
        )

    def test_delete_order_restores_stock(self):
        response = self.client.delete(
            reverse("order-detail", args=[self.order.id])
        )

        self.product.refresh_from_db()

        self.assertEqual(
            response.status_code,
            status.HTTP_204_NO_CONTENT
        )

        self.assertEqual(self.product.stock, 10)

    def test_zero_quantity_is_rejected(self):
        response = self.client.post(
            self.order_url,
            {
                "customer": self.customer.id,
                "product": self.product.id,
                "quantity": 0
            },
            format="json"
        )

        self.product.refresh_from_db()

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertIn("quantity", response.data)
        self.assertEqual(self.product.stock, 8)

    def test_insufficient_stock_is_rejected(self):
        response = self.client.post(
            self.order_url,
            {
                "customer": self.customer.id,
                "product": self.product.id,
                "quantity": 15
            },
            format="json"
        )

        self.product.refresh_from_db()

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(self.product.stock, 8)
        self.assertEqual(Order.objects.count(), 1)

    def test_user_cannot_create_order_for_another_users_customer(self):
        response = self.client.post(
            self.order_url,
            {
                "customer": self.other_customer.id,
                "product": self.product.id,
                "quantity": 2
            },
            format="json"
        )

        self.product.refresh_from_db()

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(self.product.stock, 8)
        self.assertEqual(Order.objects.count(), 1)

    def test_user_cannot_create_order_for_another_users_product(self):
        response = self.client.post(
            self.order_url,
            {
                "customer": self.customer.id,
                "product": self.other_product.id,
                "quantity": 2
            },
            format="json"
        )

        self.other_product.refresh_from_db()

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertEqual(self.other_product.stock, 10)
        self.assertEqual(Order.objects.count(), 1)

    def test_user_cannot_see_another_users_orders(self):
        self.client.force_authenticate(user=self.user2)

        response = self.client.get(self.order_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_user_cannot_retrieve_another_users_order(self):
        self.client.force_authenticate(user=self.user2)

        response = self.client.get(
            reverse("order-detail", args=[self.order.id])
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_user_cannot_update_another_users_order(self):
        self.client.force_authenticate(user=self.user2)

        response = self.client.patch(
            reverse("order-detail", args=[self.order.id]),
            {"status": "Completed"},
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_user_cannot_delete_another_users_order(self):
        self.client.force_authenticate(user=self.user2)

        response = self.client.delete(
            reverse("order-detail", args=[self.order.id])
        )

        self.product.refresh_from_db()

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

        self.assertEqual(self.product.stock, 8)
        self.assertTrue(Order.objects.filter(pk=self.order.id).exists())

    def test_unauthenticated_user_cannot_access_orders(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(self.order_url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )
