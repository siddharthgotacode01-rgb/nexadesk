
from rest_framework import serializers
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):

    name = serializers.CharField(
        max_length=150,
        allow_blank=False,
        trim_whitespace=True
    )

    email = serializers.EmailField(
        required=False,
        allow_blank=True
    )

    class Meta:
        model = Customer
        fields = '__all__'
