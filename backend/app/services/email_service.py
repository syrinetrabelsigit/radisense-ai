"""Email service using Gmail SMTP with aiosmtplib"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_email(
    to_email: str,
    to_name: str,
    subject: str,
    html_content: str,
) -> bool:
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = formataddr(("RadiSense AI", settings.SMTP_USER))
        msg["To"]      = formataddr((to_name, to_email))
        msg.attach(MIMEText(html_content, "html"))
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_SERVER,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )
        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


# ── PASSWORD RESET ─────────────────────────────────────────────────────────────

async def send_password_reset_email(
    to_email: str,
    name: str,
    reset_url: str,
) -> bool:
    html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0e27;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e27;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#131929;border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0066CC,#00BFA6);padding:40px;text-align:center;">
            <h1 style="margin:0;color:white;font-size:28px;font-weight:900;">RadiSense AI</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Medical Imaging Platform</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 0;text-align:center;">
            <h2 style="margin:0 0 8px;color:white;font-size:22px;font-weight:800;">Password Reset Request</h2>
            <p style="margin:0;color:#64748B;font-size:14px;">This link expires in 1 hour</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 40px 36px;">
            <p style="color:#94A3B8;font-size:15px;line-height:1.7;margin:0 0 12px;">
              Hello <strong style="color:white;">{name}</strong>,
            </p>
            <p style="color:#94A3B8;font-size:15px;line-height:1.7;margin:0 0 28px;">
              We received a request to reset your RadiSense AI password. Click the button below to set a new password.
            </p>
            <div style="text-align:center;margin-bottom:28px;">
              <a href="{reset_url}" style="display:inline-block;padding:15px 36px;background:linear-gradient(135deg,#0066CC,#00BFA6);color:white;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;">
                Reset My Password
              </a>
            </div>
            <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:14px 18px;margin-bottom:20px;">
              <p style="margin:0;color:#F59E0B;font-size:13px;line-height:1.6;">
                If you did not request a password reset, please ignore this email. Your account remains secure.
              </p>
            </div>
            <p style="color:#475569;font-size:12px;line-height:1.6;margin:0;">
              If the button does not work, copy this link:<br/>
              <a href="{reset_url}" style="color:#0066CC;word-break:break-all;">{reset_url}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#0a0e27;padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;color:#475569;font-size:12px;">© 2026 RadiSense AI</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""
    return await send_email(
        to_email=to_email,
        to_name=name,
        subject="RadiSense AI — Password Reset Request",
        html_content=html,
    )


# ── EXISTING FUNCTIONS ────────────────────────────────────────────────────────

async def send_payment_success_email(
    to_email: str,
    user_name: str,
    plan: str,
    amount: float,
    currency: str,
    subscription_id: str,
) -> bool:
    from app.services.email_templates import payment_success_template
    html = payment_success_template(user_name, plan, amount, currency, subscription_id)
    return await send_email(
        to_email=to_email,
        to_name=user_name,
        subject=f"Payment Confirmed - RadiSense AI {plan.capitalize()} Plan",
        html_content=html,
    )


async def send_welcome_email(
    to_email: str,
    user_name: str,
    username: str,
    plan: str,
) -> bool:
    from app.services.email_templates import welcome_email_template
    html = welcome_email_template(user_name, username, plan)
    return await send_email(
        to_email=to_email,
        to_name=user_name,
        subject="Welcome to RadiSense AI",
        html_content=html,
    )


async def send_cancellation_email(
    to_email: str,
    user_name: str,
    plan: str,
    end_date: str,
) -> bool:
    from app.services.email_templates import subscription_cancelled_template
    html = subscription_cancelled_template(user_name, plan, end_date)
    return await send_email(
        to_email=to_email,
        to_name=user_name,
        subject="RadiSense AI - Subscription Cancelled",
        html_content=html,
    )


async def send_access_request_email(
    name: str,
    email: str,
    institution: str,
    role: str,
    message: str,
    plan: str = 'free',
    amount: float = 0,
    payment_status: str = 'unpaid',
    request_id: int = 0,
) -> bool:
    from app.services.email_templates import request_access_template
    html = request_access_template(
        name, email, institution, role, message,
        plan, amount, payment_status, request_id
    )
    return await send_email(
        to_email=settings.SMTP_USER,
        to_name="RadiSense Admin",
        subject=f"New Request: {name} ({role}) — {plan.upper()}",
        html_content=html,
    )


async def send_approval_email(
    to_email: str,
    name: str,
    username: str,
    password: str,
    plan: str,
) -> bool:
    from app.services.email_templates import approval_email_template
    html = approval_email_template(name, username, password, plan)
    return await send_email(
        to_email=to_email,
        to_name=name,
        subject="Your RadiSense AI Account is Ready",
        html_content=html,
    )


async def send_rejection_email(
    to_email: str,
    name: str,
    reason: str,
) -> bool:
    from app.services.email_templates import rejection_email_template
    html = rejection_email_template(name, reason)
    return await send_email(
        to_email=to_email,
        to_name=name,
        subject="RadiSense AI — Update on your access request",
        html_content=html,
    )