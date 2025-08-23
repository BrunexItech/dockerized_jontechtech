# authapp/urls.py
from django.urls import path
from .views import RegisterView, LoginView, MeView, ForgotPasswordView, ResetPasswordView

urlpatterns = [
    path("register/",         RegisterView.as_view(),       name="register"),
    path("login/",            LoginView.as_view(),          name="login"),
    path("me/",               MeView.as_view(),             name="me"),
    path("forgot-password/",  ForgotPasswordView.as_view(), name="forgot_password"),
    path("reset-password/",   ResetPasswordView.as_view(),  name="reset_password"),
]
