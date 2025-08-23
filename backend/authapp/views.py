# authapp/views.py
import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)

logger = logging.getLogger(__name__)
User = get_user_model()
token_generator = PasswordResetTokenGenerator()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        s = UserRegistrationSerializer(data=request.data)
        if s.is_valid():
            user = s.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        s = UserLoginSerializer(data=request.data)
        if s.is_valid():
            return Response(s.validated_data, status=status.HTTP_200_OK)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    """
    POST: { "email": "user@example.com" }
    Always 200 to avoid email enumeration.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        s = ForgotPasswordSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        email = s.validated_data["email"].lower().strip()

        user = User.objects.filter(email=email, is_active=True).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = token_generator.make_token(user)
            frontend = getattr(settings, "FRONTEND_URL", "").rstrip("/")
            reset_link = f"{frontend}/reset-password?uid={uid}&token={token}"

            subject = "Reset your password"
            text_message = (
                "Hi,\n\nUse the link below to reset your password:\n"
                f"{reset_link}\n\nIf you didn't request this, ignore this email."
            )
            html_message = f"""
                <p>Hi,</p>
                <p>Use the link below to reset your password:</p>
                <p><a href="{reset_link}">{reset_link}</a></p>
                <p>If you didn't request this, you can safely ignore this email.</p>
            """

            try:
                send_mail(
                    subject=subject,
                    message=text_message,
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", getattr(settings, "EMAIL_HOST_USER", None)),
                    recipient_list=[email],
                    html_message=html_message,
                    fail_silently=False,  # raise so we can log
                )
                logger.info("Password reset email sent to %s", email)
            except Exception:
                logger.exception("Password reset email FAILED for %s", email)

        return Response({"detail": "Check your email address for a reset link."}, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    """
    POST: { "uid": "<uidb64>", "token": "<token>", "new_password": "..." }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        s = ResetPasswordSerializer(data=request.data)
        s.is_valid(raise_exception=True)

        uidb64 = s.validated_data["uid"]
        token = s.validated_data["token"]
        new_password = s.validated_data["new_password"]

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid, is_active=True)
        except Exception:
            return Response({"detail": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)

        if not token_generator.check_token(user, token):
            return Response({"detail": "Expired or invalid token."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=["password"])
        return Response({"detail": "Password reset successful."}, status=status.HTTP_200_OK)
