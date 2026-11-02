
from rest_framework import status
from rest_framework.test import APITestCase

from customers.models import Customer


class CustomerAPITests(APITestCase):

    def setUp(self):
        self.url = '/api/customers/'

        self.customer = Customer.objects.create(
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

        self.assertEqual(Customer.objects.count(), 2)

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
