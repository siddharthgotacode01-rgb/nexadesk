
from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from customers.models import Customer

User = get_user_model()


class CustomerAPITests(APITestCase):

    def setUp(self):
        self.user1 = User.objects.create_user(
            username="customer_user1",
            password="TestPassword123!"
        )

        self.user2 = User.objects.create_user(
            username="customer_user2",
            password="TestPassword123!"
        )

        self.url = '/api/customers/customers/'

        self.client.force_authenticate(user=self.user1)

        self.customer = Customer.objects.create(
            owner=self.user1,
            name="Test Customer",
            email="test@example.com",
            phone="9999999999",
            address="Delhi",
            city="Delhi"
        )

    def test_create_customer(self):
        response = self.client.post(
            self.url,
            {
                "name": "New Customer",
                "email": "new@example.com",
                "phone": "8888888888",
                "address": "Rohini",
                "city": "Delhi"
            },
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED
        )

        self.assertEqual(
            Customer.objects.filter(owner=self.user1).count(),
            2
        )

        new_customer = Customer.objects.get(name="New Customer")
        self.assertEqual(new_customer.owner, self.user1)

    def test_invalid_email_is_rejected(self):
        response = self.client.post(
            self.url,
            {
                "name": "Invalid Email Customer",
                "email": "not-an-email",
                "phone": "9999999999",
                "address": "Delhi",
                "city": "Delhi"
            },
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertIn('email', response.data)
        self.assertEqual(Customer.objects.count(), 1)

    def test_empty_name_is_rejected(self):
        response = self.client.post(
            self.url,
            {
                "name": "   ",
                "email": "valid@example.com",
                "phone": "9999999999",
                "address": "Delhi",
                "city": "Delhi"
            },
            format='json'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST
        )

        self.assertIn('name', response.data)
        self.assertEqual(Customer.objects.count(), 1)

    def test_retrieve_customer_list(self):
        response = self.client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK
        )

        self.assertEqual(len(response.data), 1)
        self.assertEqual(
            response.data[0]['name'],
            "Test Customer"
        )

    def test_user_cannot_see_another_users_customers(self):
        Customer.objects.create(
            owner=self.user2,
            name="Private Customer",
            email="private@example.com",
            city="Mumbai"
        )

        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Test Customer")

    def test_user_cannot_retrieve_another_users_customer(self):
        other_customer = Customer.objects.create(
            owner=self.user2,
            name="Private Customer",
            email="private@example.com",
            city="Mumbai"
        )

        response = self.client.get(
            f'{self.url}{other_customer.id}/'
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_404_NOT_FOUND
        )

    def test_unauthenticated_user_cannot_access_customers(self):
        anonymous_client = APIClient()

        response = anonymous_client.get(self.url)

        self.assertEqual(
            response.status_code,
            status.HTTP_401_UNAUTHORIZED
        )
