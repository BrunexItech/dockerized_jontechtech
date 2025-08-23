# heroes/serializers.py
from rest_framework import serializers
from .models import Hero

class HeroSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = Hero
        fields = ["id", "title", "description", "category", "image", "created_at"]
