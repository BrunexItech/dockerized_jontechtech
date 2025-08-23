# products/receipts.py

from io import BytesIO
import logging
from django.template.loader import render_to_string
from django.template import TemplateDoesNotExist
from django.core.mail import EmailMessage
from django.conf import settings
from django.utils import timezone
from django.core.files.base import ContentFile
from xhtml2pdf import pisa

logger = logging.getLogger(__name__)


def render_receipt_pdf(order) -> bytes:
    """
    Render the receipt HTML template into PDF bytes.

    Raises:
        ValueError: if the template is missing or xhtml2pdf fails.
    """
    # 1) Load HTML from template
    try:
        html = render_to_string("receipts/receipt.html", {"order": order})
    except TemplateDoesNotExist as e:
        logger.exception("Receipt template not found: %s", e)
        raise ValueError(
            "Receipt template not found. Put it at "
            "'products/templates/receipts/receipt.html' or 'templates/receipts/receipt.html'."
        )

    # 2) Convert HTML -> PDF
    pdf_io = BytesIO()
    result = pisa.CreatePDF(html, dest=pdf_io)
    if result.err:
        logger.error("xhtml2pdf failed with %d error(s).", result.err)
        raise ValueError("Failed to render receipt PDF (xhtml2pdf error).")

    data = pdf_io.getvalue()
    if not data:
        raise ValueError("Failed to render receipt PDF (empty output).")

    return data


def ensure_receipt_pdf(order, *, regenerate: bool = False) -> None:
    """
    Ensure order.receipt_pdf exists. If missing (or regenerate=True), generate and save it.

    Side effects:
        - Sets order.receipt_number if missing
        - Saves file to order.receipt_pdf
        - Updates order.receipt_generated_at
    """
    if order.receipt_pdf and not regenerate:
        return

    if not order.receipt_number:
        # Example: R-2025-000123
        order.receipt_number = f"R-{timezone.now():%Y}-{order.id:06d}"

    pdf_bytes = render_receipt_pdf(order)
    fname = f"{order.receipt_number}.pdf"

    order.receipt_pdf.save(fname, ContentFile(pdf_bytes), save=False)
    order.receipt_generated_at = timezone.now()
    order.save(update_fields=["receipt_pdf", "receipt_generated_at", "receipt_number"])


def send_receipt_email(order, to_email: str) -> None:
    """
    Send an email with the receipt PDF attached.

    Raises:
        Any email backend exception (SMTP, etc.) if sending fails.
    """
    subject = f"Your JONTECH receipt {order.receipt_number or f'#{order.id}'}"
    body_lines = [
        f"Hi {order.ship_full_name or 'customer'},",
        "",
        "Thanks for your order with JONTECH.",
        f"Order: #{order.id}",
        f"Status: {order.status}",
        "",
        "Your receipt is attached as a PDF.",
        "If the attachment is blocked, you can also download it from your account.",
        "",
        "— JONTECH",
    ]
    from_addr = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER

    msg = EmailMessage(
        subject=subject,
        body="\n".join(body_lines),
        from_email=from_addr,
        to=[to_email],
    )

    # Make sure the PDF exists
    ensure_receipt_pdf(order)

    # Attach the PDF
    if order.receipt_pdf:
        with order.receipt_pdf.open("rb") as f:
            content = f.read()
        filename = order.receipt_pdf.name.split("/")[-1]
        msg.attach(filename, content, "application/pdf")
    else:
        logger.warning("Order %s has no receipt_pdf after ensure_receipt_pdf.", order.id)

    # Send email (will honor EMAIL_BACKEND/SMTP settings)
    msg.send(fail_silently=False)

    # Mark as sent
    order.receipt_sent_at = timezone.now()
    order.save(update_fields=["receipt_sent_at"])
