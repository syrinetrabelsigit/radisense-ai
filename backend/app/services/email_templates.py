"""Beautiful HTML email templates for RadiSense AI"""


def get_base_template(content: str, title: str) -> str:
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{title}</title>
  <style>
    * {{ margin:0; padding:0; box-sizing:border-box; }}
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background:#0a0e1a; color:#e2e8f0; }}
    .wrapper {{ max-width:600px; margin:0 auto; padding:40px 20px; }}
    .card {{ background:linear-gradient(135deg,#1a1f3a,#0f1628);
             border:1px solid rgba(0,102,204,0.2);
             border-radius:20px; overflow:hidden; }}
    .header {{ background:linear-gradient(135deg,#0066CC,#00BFA6);
               padding:40px 40px 30px; text-align:center; }}
    .logo {{ display:flex; align-items:center; justify-content:center;
             gap:12px; margin-bottom:16px; }}
    .logo-text {{ font-size:24px; font-weight:900; color:white; letter-spacing:-0.5px; }}
    .logo-ai {{ color:rgba(255,255,255,0.7); }}
    .header-title {{ font-size:28px; font-weight:800; color:white;
                     letter-spacing:-0.5px; margin-bottom:8px; }}
    .header-sub {{ color:rgba(255,255,255,0.8); font-size:15px; }}
    .body {{ padding:40px; }}
    .greeting {{ font-size:18px; font-weight:700; color:#e2e8f0;
                 margin-bottom:16px; }}
    .text {{ font-size:15px; color:#94a3b8; line-height:1.7;
             margin-bottom:20px; }}
    .plan-card {{ background:rgba(0,102,204,0.08);
                  border:1px solid rgba(0,102,204,0.2);
                  border-radius:14px; padding:24px; margin:24px 0; }}
    .plan-name {{ font-size:22px; font-weight:900; color:#0066CC;
                  margin-bottom:4px; }}
    .plan-price {{ font-size:36px; font-weight:900;
                   background:linear-gradient(135deg,#0066CC,#00BFA6);
                   -webkit-background-clip:text; -webkit-text-fill-color:transparent;
                   margin-bottom:12px; }}
    .plan-feature {{ display:flex; align-items:center; gap:8px;
                     color:#94a3b8; font-size:14px; margin-bottom:8px; }}
    .check {{ color:#00BFA6; font-weight:700; }}
    .btn {{ display:block; width:fit-content; margin:0 auto;
            background:linear-gradient(135deg,#0066CC,#00BFA6);
            color:white; text-decoration:none; padding:16px 40px;
            border-radius:12px; font-weight:700; font-size:16px;
            text-align:center; margin-top:28px; }}
    .divider {{ border:none; border-top:1px solid rgba(255,255,255,0.07);
                margin:28px 0; }}
    .info-grid {{ display:grid; grid-template-columns:1fr 1fr;
                  gap:16px; margin:20px 0; }}
    .info-item {{ background:rgba(255,255,255,0.04);
                  border-radius:10px; padding:16px; }}
    .info-label {{ font-size:11px; font-weight:700; color:#64748B;
                   text-transform:uppercase; letter-spacing:0.06em;
                   margin-bottom:4px; }}
    .info-value {{ font-size:15px; font-weight:700; color:#e2e8f0; }}
    .footer {{ padding:24px 40px; text-align:center;
               border-top:1px solid rgba(255,255,255,0.06); }}
    .footer-text {{ font-size:13px; color:#475569; line-height:1.6; }}
    .footer-link {{ color:#0066CC; text-decoration:none; }}
    .badge {{ display:inline-block; padding:4px 12px;
              background:rgba(0,191,166,0.12);
              border:1px solid rgba(0,191,166,0.3);
              border-radius:100px; color:#00BFA6;
              font-size:12px; font-weight:600; margin-bottom:16px; }}
    .alert {{ background:rgba(16,185,129,0.08);
              border:1px solid rgba(16,185,129,0.2);
              border-radius:12px; padding:16px 20px;
              color:#10B981; font-size:14px; margin:20px 0; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo">
          <div class="logo-text">RadiSense <span class="logo-ai">AI</span></div>
        </div>
        {content.get('header_content', '')}
      </div>
      <div class="body">
        {content.get('body_content', '')}
      </div>
      <div class="footer">
        <p class="footer-text">
          © 2026 RadiSense AI · AI-Powered Medical Imaging<br/>
          <a href="mailto:support@radisense.ai" class="footer-link">support@radisense.ai</a>
          &nbsp;·&nbsp;
          <a href="http://localhost:5173" class="footer-link">radisense.ai</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
"""


def payment_success_template(user_name: str, plan: str, amount: float,
                               currency: str, subscription_id: str) -> str:
    plan_features = {
        "starter": [
            "Up to 5 radiologists",
            "500 analyses/month",
            "All 14 pathologies",
            "Grad-CAM heatmaps",
            "Email support",
        ],
        "pro": [
            "Up to 20 radiologists",
            "2,000 analyses/month",
            "All 14 pathologies",
            "Advanced analytics",
            "Priority support",
            "API access",
        ],
        "enterprise": [
            "Unlimited radiologists",
            "Unlimited analyses",
            "Custom model training",
            "On-premise deployment",
            "Dedicated support",
            "SLA guarantee",
        ],
    }
    features = plan_features.get(plan.lower(), [])
    features_html = "".join(
        f'<div class="plan-feature"><span class="check">✓</span> {f}</div>'
        for f in features
    )
    currency_symbol = {"usd": "$", "eur": "€", "gbp": "£", "tnd": "TND "}.get(
        currency.lower(), "$"
    )

    content = {
        "header_content": f"""
            <div class="badge">Payment Confirmed</div>
            <div class="header-title">🎉 Welcome to RadiSense AI!</div>
            <div class="header-sub">Your subscription is now active</div>
        """,
        "body_content": f"""
            <div class="greeting">Hello {user_name},</div>
            <p class="text">
                Thank you for subscribing to RadiSense AI! Your payment has been
                processed successfully and your account is now fully activated.
            </p>

            <div class="plan-card">
                <div class="plan-name">{plan.capitalize()} Plan</div>                <div class="plan-price">{currency_symbol}{amount:.0f}<span style="font-size:16px;color:#64748B">/month</span></div>
                {features_html}
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Subscription ID</div>
                    <div class="info-value" style="font-size:12px">{subscription_id[:20]}...</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Amount Charged</div>
                    <div class="info-value">{currency_symbol}{amount:.2f}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Billing</div>
                    <div class="info-value">Monthly</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Status</div>
                    <div class="info-value" style="color:#00BFA6">Active ✓</div>
                </div>
            </div>

            <div class="alert">
                ✓ Your account is now active. You can start using RadiSense AI immediately.
            </div>

            <a href="http://localhost:5173/login" class="btn">
                Access Your Dashboard →
            </a>

            <hr class="divider"/>
            <p class="text" style="font-size:13px">
                A receipt has been sent to your email. If you have any questions,
                contact us at <a href="mailto:support@radisense.ai" style="color:#0066CC">support@radisense.ai</a>
            </p>
        """,
    }
    return get_base_template(content, "Payment Confirmed - RadiSense AI")


def welcome_email_template(user_name: str, username: str, plan: str) -> str:
    content = {
        "header_content": f"""
            <div class="badge">Account Activated</div>
            <div class="header-title">Welcome to RadiSense AI</div>
            <div class="header-sub">Your {plan.capitalize()} plan is ready</div>
        """,
        "body_content": f"""
            <div class="greeting">Hello Dr. {user_name},</div>
            <p class="text">
                Your RadiSense AI account has been successfully created and activated.
                You now have full access to our AI-powered medical imaging platform.
            </p>

            <div class="plan-card">
                <div class="plan-name">Getting Started</div>
                <div style="margin-top:12px">
                    <div class="plan-feature"><span class="check">1.</span> Log in with your username: <strong style="color:#e2e8f0">{username}</strong></div>
                    <div class="plan-feature"><span class="check">2.</span> Upload your first chest X-ray for analysis</div>
                    <div class="plan-feature"><span class="check">3.</span> Get AI-powered diagnosis in under 3 seconds</div>
                    <div class="plan-feature"><span class="check">4.</span> View detailed pathology reports</div>
                </div>
            </div>

            <a href="http://localhost:5173/login" class="btn">
                Start Using RadiSense AI →
            </a>

            <hr class="divider"/>
            <p class="text" style="font-size:13px">
                Need help? Visit our documentation or contact
                <a href="mailto:support@radisense.ai" style="color:#0066CC">support@radisense.ai</a>
            </p>
        """,
    }
    return get_base_template(content, "Welcome to RadiSense AI")


def subscription_cancelled_template(user_name: str, plan: str, end_date: str) -> str:
    content = {
        "header_content": f"""
            <div class="header-title">Subscription Cancelled</div>
            <div class="header-sub">Your {plan.capitalize()} plan has been cancelled</div>
        """,
        "body_content": f"""
            <div class="greeting">Hello {user_name},</div>
            <p class="text">
                We're sorry to see you go. Your <strong>{plan.capitalize()}</strong> subscription
                has been cancelled. You will continue to have access until <strong>{end_date}</strong>.
            </p>
            <div class="plan-card">
                <div class="plan-name" style="color:#EF4444">Access Until</div>
                <div style="font-size:24px;font-weight:900;color:#e2e8f0;margin:8px 0">{end_date}</div>
                <p style="color:#94a3b8;font-size:14px">
                    After this date, your account will be downgraded to the free tier.
                </p>
            </div>
            <a href="http://localhost:5173/pricing" class="btn"
               style="background:linear-gradient(135deg,#EF4444,#F59E0B)">
                Reactivate Subscription →
            </a>
        """,
    }
    return get_base_template(content, "Subscription Cancelled - RadiSense AI")

def request_access_template(
    name: str, email: str, institution: str, role: str, message: str,
    plan: str = 'free', amount: float = 0,
    payment_status: str = 'unpaid', request_id: int = 0
) -> str:
    """Updated request_access_template — remplace l'ancienne version"""

    plan_color = {
        'free': '#10B981',
        'pro': '#0066CC',
        'enterprise': '#8B5CF6',
    }.get(plan.lower(), '#64748B')

    payment_badge = ''
    if payment_status == 'paid':
        payment_badge = f'''
            <div style="display:inline-flex;align-items:center;gap:8px;
                padding:8px 16px;background:rgba(16,185,129,0.1);
                border:1px solid rgba(16,185,129,0.3);border-radius:100px;
                color:#10B981;font-size:13px;font-weight:700;margin:16px 0">
                💳 Payment Confirmed — ${amount:.0f} USD
            </div>
        '''
    else:
        payment_badge = f'''
            <div style="display:inline-flex;align-items:center;gap:8px;
                padding:8px 16px;background:rgba(245,158,11,0.1);
                border:1px solid rgba(245,158,11,0.3);border-radius:100px;
                color:#F59E0B;font-size:13px;font-weight:700;margin:16px 0">
                📋 Free Plan Request
            </div>
        '''

    content = {
        "header_content": f"""
            <div class="badge">{'💳 Paid Request' if payment_status == 'paid' else '📋 New Request'}</div>
            <div class="header-title">New Access Request #{request_id}</div>
            <div class="header-sub">{plan.upper()} Plan · Requires admin review</div>
        """,
        "body_content": f"""
            <div class="greeting">New registration request received</div>
            <p class="text">
                A new user has requested access to RadiSense AI.
                {'<strong style="color:#10B981">Payment has been verified.</strong>' if payment_status == 'paid' else ''}
            </p>

            {payment_badge}

            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Full Name</div>
                    <div class="info-value">{name}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Email</div>
                    <div class="info-value" style="font-size:13px">{email}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Institution</div>
                    <div class="info-value">{institution or '—'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Role Requested</div>
                    <div class="info-value" style="color:#0066CC;text-transform:capitalize">{role}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Plan</div>
                    <div class="info-value" style="color:{plan_color};text-transform:uppercase;font-weight:900">{plan}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Payment</div>
                    <div class="info-value" style="color:{'#10B981' if payment_status == 'paid' else '#F59E0B'}">
                        {'✓ Paid — $' + str(int(amount)) if payment_status == 'paid' else 'Free plan'}
                    </div>
                </div>
            </div>

            {f'<div class="plan-card"><div class="info-label" style="margin-bottom:8px">MESSAGE FROM APPLICANT</div><p style="color:#e2e8f0;font-size:15px;line-height:1.7">{message}</p></div>' if message else ''}

            <div class="alert" style="{'background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.2);color:#10B981' if payment_status == 'paid' else 'background:rgba(245,158,11,0.08);border-color:rgba(245,158,11,0.2);color:#F59E0B'}">
                {'✓ Payment verified via Stripe. Safe to approve.' if payment_status == 'paid' else '⚠ Free plan request — no payment required.'}
            </div>

            <a href="http://localhost:5173/login?redirect=/admin/requests" class="btn">
                Review in Admin Dashboard →
            </a>
        """,
    }
    return get_base_template(content, f"New Access Request #{request_id} - RadiSense AI")


def approval_email_template(
    name: str, username: str, password: str, plan: str
) -> str:
    """Sent to user when admin approves their request"""

    plan_features = {
    'free': [
        '10 analyses/month',
        'Basic pathology detection (5 pathologies)',
        'Standard Grad-CAM heatmaps',
        'Email support',
        'Patient management'
    ],
    'pro': [
        '500 analyses/month',
        'All 14 pathologies',
        'Advanced Grad-CAM heatmaps',
        'Priority support',
        'API access',
        'PDF exports',
        'Analytics dashboard',
        'Unlimited patients'
    ],
    'enterprise': [
        'Unlimited analyses',
        'All 14 pathologies',
        'Custom model training',
        'Dedicated support',
        'On-premise deployment',
        'SLA guarantee',
        'Full API access',
        'Custom integrations'
    ],
    'researcher_free': [
        'Access to 5 oldest analyses (read-only)',
        'Basic model comparison',
        'Community support',
        'Standard visualizations',
        'Public datasets only'
    ],
    'researcher_pro': [
        'Access to 100 most recent analyses',
        'Advanced model comparison',
        'Priority support',
        'API access',
        'Export results (CSV, JSON)',
        'Private dataset upload',
        'Experiment tracking'
    ],
    'researcher_enterprise': [
        'Unlimited access to all analyses',
        'Custom model training',
        'Dedicated support',
        'Raw data export',
        'On-premise option',
        'Multi-user workspace',
        'Priority compute'
    ],
}
    features = plan_features.get(plan.lower(), plan_features['free'])
    features_html = "".join(
        f'<div class="plan-feature"><span class="check">✓</span> {f}</div>'
        for f in features
    )

    plan_color = {
    'free': '#10B981',
    'pro': '#0066CC',
    'enterprise': '#8B5CF6',
    'researcher_free': '#10B981',
    'researcher_pro': '#0066CC',
    'researcher_enterprise': '#8B5CF6',
    }.get(plan.lower(), '#0066CC')

    plan_display = {
        'free': 'Free Plan',
        'pro': 'Pro Plan',
        'enterprise': 'Enterprise Plan',
        'researcher_free': 'Researcher Free Plan',
        'researcher_pro': 'Researcher Pro Plan',
        'researcher_enterprise': 'Researcher Enterprise Plan',
    }.get(plan.lower(), f'{plan.capitalize()} Plan')

    content = {
        "header_content": f"""
            <div class="badge">✅ Request Approved</div>
            <div class="header-title">Your Account is Ready!</div>
            <div class="header-sub">Welcome to RadiSense AI — {plan_display}</div>
        """,
        "body_content": f"""
            <div class="greeting">Hello {name},</div>
            <p class="text">
                Great news! Your access request has been reviewed and approved by our team.
                Your RadiSense AI account is now active and ready to use.
            </p>

            <div class="plan-card" style="border-color:rgba({'0,102,204' if plan == 'pro' else '139,92,246' if plan == 'enterprise' else '16,185,129'},0.3)">
                <div class="plan-name" style="color:{plan_color}">{plan_display} Activated</div>
                <div style="margin-top:12px">{features_html}</div>
            </div>

            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);
                border-radius:14px;padding:24px;margin:24px 0">
                <div style="font-size:13px;font-weight:700;color:#64748B;
                    text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px">
                    🔑 Your Login Credentials
                </div>
                <div style="display:flex;flex-direction:column;gap:12px">
                    <div style="display:flex;align-items:center;justify-content:space-between;
                        background:rgba(0,102,204,0.08);border-radius:10px;padding:12px 16px">
                        <span style="color:#64748B;font-size:13px;font-weight:600">Username</span>
                        <span style="color:#60A5FA;font-weight:900;font-size:16px;
                            font-family:monospace;letter-spacing:0.5px">{username}</span>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;
                        background:rgba(0,191,166,0.08);border-radius:10px;padding:12px 16px">
                        <span style="color:#64748B;font-size:13px;font-weight:600">Password</span>
                        <span style="color:#00BFA6;font-weight:900;font-size:16px;
                            font-family:monospace;letter-spacing:0.5px">{password}</span>
                    </div>
                </div>
                <p style="color:#F59E0B;font-size:12px;margin-top:14px;
                    display:flex;align-items:center;gap:6px">
                    ⚠ Please change your password after your first login.
                </p>
            </div>

            <div class="alert">
                ✓ Use the credentials above to log in. Your {plan_display} is immediately active.
            </div>

            <a href="http://localhost:5173/login" class="btn">
                Login to RadiSense AI →
            </a>

            <hr class="divider"/>
            <p class="text" style="font-size:13px">
                Need help getting started? Contact us at
                <a href="mailto:support@radisense.ai" style="color:#0066CC">support@radisense.ai</a>
            </p>
        """,
    }
    return get_base_template(content, "Your RadiSense AI Account is Ready!")


def rejection_email_template(name: str, reason: str) -> str:
    """Sent to user when admin rejects their request"""
    content = {
        "header_content": f"""
            <div class="header-title" style="color:white">Update on Your Request</div>
            <div class="header-sub">RadiSense AI Access Request</div>
        """,
        "body_content": f"""
            <div class="greeting">Hello {name},</div>
            <p class="text">
                Thank you for your interest in RadiSense AI. After reviewing your access request,
                we are unable to approve it at this time.
            </p>

            <div class="plan-card" style="border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.04)">
                <div class="plan-name" style="color:#EF4444;font-size:14px;margin-bottom:8px">
                    Reason for Decision
                </div>
                <p style="color:#e2e8f0;font-size:15px;line-height:1.7">{reason}</p>
            </div>

            <p class="text">
                If you believe this decision was made in error or would like to provide
                additional information, please contact our team.
            </p>

            <div class="info-grid" style="grid-template-columns:1fr">
                <div class="info-item" style="text-align:center">
                    <div class="info-label">Contact Support</div>
                    <div class="info-value" style="font-size:14px">
                        <a href="mailto:support@radisense.ai" style="color:#0066CC;text-decoration:none">
                            support@radisense.ai
                        </a>
                    </div>
                </div>
            </div>

            <a href="mailto:support@radisense.ai" class="btn"
               style="background:linear-gradient(135deg,#1a1f3a,#2d3561)">
                Contact Support →
            </a>

            <hr class="divider"/>
            <p class="text" style="font-size:13px;text-align:center">
                You may reapply in the future if your circumstances change.
            </p>
        """,
    }
    return get_base_template(content, "Update on Your RadiSense AI Request")
def patient_account_created_template(name: str, username: str, password: str) -> str:
    """Sent to patient when admin creates their account — no plan section"""
    content = {
        "header_content": """
            <div class="badge">✅ Account Created</div>
            <div class="header-title">Your Account is Ready!</div>
            <div class="header-sub">Welcome to RadiSense AI</div>
        """,
        "body_content": f"""
            <div class="greeting">Hello {name},</div>
            <p class="text">
                Your RadiSense AI patient account has been created by your radiologist.
                You can now access your medical records and analysis results online.
            </p>
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);
                border-radius:14px;padding:24px;margin:24px 0">
                <div style="font-size:13px;font-weight:700;color:#64748B;
                    text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px">
                    🔑 Your Login Credentials
                </div>
                <div style="display:flex;flex-direction:column;gap:12px">
                    <div style="display:flex;align-items:center;justify-content:space-between;
                        background:rgba(0,102,204,0.08);border-radius:10px;padding:12px 16px">
                        <span style="color:#64748B;font-size:13px;font-weight:600">Username</span>
                        <span style="color:#60A5FA;font-weight:900;font-size:16px;
                            font-family:monospace">{username}</span>
                    </div>
                    <div style="display:flex;align-items:center;justify-content:space-between;
                        background:rgba(0,191,166,0.08);border-radius:10px;padding:12px 16px">
                        <span style="color:#64748B;font-size:13px;font-weight:600">Password</span>
                        <span style="color:#00BFA6;font-weight:900;font-size:16px;
                            font-family:monospace">{password}</span>
                    </div>
                </div>
                <p style="color:#F59E0B;font-size:12px;margin-top:14px;">
                    ⚠ Please change your password after your first login.
                </p>
            </div>
            <div class="alert">
                ✓ You can now view your X-ray analyses and medical records online.
            </div>
            <a href="http://localhost:5173/login" class="btn">
                Login to RadiSense AI →
            </a>
            <hr class="divider"/>
            <p class="text" style="font-size:13px">
                Need help? Contact us at
                <a href="mailto:support@radisense.ai" style="color:#0066CC">support@radisense.ai</a>
            </p>
        """,
    }
    return get_base_template(content, "Your RadiSense AI Account is Ready!")