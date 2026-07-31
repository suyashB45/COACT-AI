import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger("coact.email")
SMTP_TIMEOUT = 10  # seconds

def send_2fa_code(recipient_email: str, code: str, username: str = "User"):
    """
    Sends a 2FA code to the specified email address.
    If SMTP credentials are not configured, prints the code to the console for development.
    """
    smtp_server = os.environ.get("SMTP_SERVER") or os.environ.get("SMTP_HOST")
    smtp_port = os.environ.get("SMTP_PORT")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD") or os.environ.get("SMTP_PASS")
    
    sender_email = os.environ.get("SMTP_FROM_EMAIL") or os.environ.get("SMTP_ADMIN_EMAIL", "noreply@coact.ai")

    # If SMTP is not configured, fallback to console (useful for dev)
    if not all([smtp_server, smtp_port, smtp_user, smtp_password]):
        print(f"\n{'='*50}")
        print(f"📧 [MOCK EMAIL] To: {recipient_email}")
        print(f"Subject: Your CoAct.AI Verification Code")
        print(f"Code: {code}")
        print(f"{'='*50}\n")
        return True

    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = "Your CoAct.AI Verification Code"

        text_body = f"""
        Hello {username},
        
        Your verification code is: {code}
        
        This code will expire in 15 minutes.
        If you did not request this, please ignore this email.
        
        Best regards,
        The CoAct.AI Team
        """
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background-color: #f4f4f5;
                    margin: 0;
                    padding: 20px;
                }}
                .container {{
                    max-width: 500px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }}
                .header {{
                    background-color: #18181b;
                    padding: 24px;
                    text-align: center;
                }}
                .header h1 {{
                    color: #ffffff;
                    margin: 0;
                    font-size: 24px;
                    font-weight: 700;
                    letter-spacing: -0.025em;
                }}
                .content {{
                    padding: 32px;
                }}
                .content p {{
                    font-size: 16px;
                    line-height: 1.6;
                    color: #3f3f46;
                    margin-top: 0;
                    margin-bottom: 24px;
                }}
                .code-container {{
                    background-color: #f4f4f5;
                    border: 1px solid #e4e4e7;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin-bottom: 24px;
                }}
                .code {{
                    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                    font-size: 32px;
                    font-weight: 700;
                    color: #18181b;
                    letter-spacing: 8px;
                    margin: 0;
                }}
                .footer {{
                    background-color: #fafafa;
                    padding: 20px 32px;
                    text-align: center;
                    border-top: 1px solid #e4e4e7;
                }}
                .footer p {{
                    font-size: 14px;
                    color: #a1a1aa;
                    margin: 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>CoAct.AI</h1>
                </div>
                <div class="content">
                    <p>Hello {username},</p>
                    <p>You requested a verification code to access your CoAct.AI account. Please use the code below to complete the process:</p>
                    <div class="code-container">
                        <p class="code">{code}</p>
                    </div>
                    <p style="font-size: 14px; color: #71717a; margin-bottom: 0;">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 CoAct.AI. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        # Connect and send
        if int(str(smtp_port)) == 465:
            with smtplib.SMTP_SSL(str(smtp_server), int(str(smtp_port)), timeout=SMTP_TIMEOUT) as server:
                server.login(str(smtp_user), str(smtp_password))
                server.send_message(msg)
        else:
            with smtplib.SMTP(str(smtp_server), int(str(smtp_port)), timeout=SMTP_TIMEOUT) as server:
                server.starttls()
                server.login(str(smtp_user), str(smtp_password))
                server.send_message(msg)
            
        logger.info(f"2FA Email sent to {recipient_email}")
        return True
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error sending 2FA email to {recipient_email}: {e}")
        return False
    except Exception as e:
        logger.error(f"Failed to send 2FA email to {recipient_email}: {e}")
        return False

def send_security_alert_email(recipient_email: str, action: str, username: str = "User"):
    """
    Sends a security alert email when password is changed or account is deleted.
    """
    smtp_server = os.environ.get("SMTP_SERVER") or os.environ.get("SMTP_HOST")
    smtp_port = os.environ.get("SMTP_PORT")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD") or os.environ.get("SMTP_PASS")
    sender_email = os.environ.get("SMTP_FROM_EMAIL") or os.environ.get("SMTP_ADMIN_EMAIL", "noreply@coact.ai")

    if not (smtp_server and smtp_port and smtp_user and smtp_password):
        print(f"\n{'='*50}")
        print(f"📧 [MOCK EMAIL] To: {recipient_email}")
        print(f"Subject: Security Alert: {action}")
        print(f"{'='*50}\n")
        return True

    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = sender_email
        msg['To'] = recipient_email
        
        if action == "password_update":
            subject = "Security Alert: Your password was updated"
            action_text = "your password has been successfully updated"
        elif action == "forgot_password":
            subject = "Security Alert: Your password was reset"
            action_text = "your password has been successfully reset using the forgot password flow"
        else:
            subject = "Security Alert: Your account was deleted"
            action_text = "your account has been permanently deleted"
            
        msg['Subject'] = subject

        text_body = f"""
        Hello {username},
        
        This is a security notification to let you know that {action_text}.
        
        If you did not perform this action, please contact support immediately.
        
        Best regards,
        The CoAct.AI Team
        """
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Inter', sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; }}
                .container {{ max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }}
                .header {{ background-color: #18181b; padding: 24px; text-align: center; }}
                .header h1 {{ color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }}
                .content {{ padding: 32px; }}
                .content p {{ font-size: 16px; line-height: 1.6; color: #3f3f46; margin-top: 0; margin-bottom: 24px; }}
                .alert-box {{ background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px; color: #e11d48; font-weight: 600; }}
                .footer {{ background-color: #fafafa; padding: 20px 32px; text-align: center; border-top: 1px solid #e4e4e7; }}
                .footer p {{ font-size: 14px; color: #a1a1aa; margin: 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>CoAct.AI</h1>
                </div>
                <div class="content">
                    <p>Hello {username},</p>
                    <p>This is a security notification regarding your CoAct.AI account.</p>
                    <div class="alert-box">
                        {action_text.capitalize()}
                    </div>
                    <p style="font-size: 14px; color: #71717a; margin-bottom: 0;">If you did not perform this action, please contact our support team immediately.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 CoAct.AI. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        if int(smtp_port) == 465:
            with smtplib.SMTP_SSL(smtp_server, int(smtp_port), timeout=SMTP_TIMEOUT) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_server, int(smtp_port), timeout=SMTP_TIMEOUT) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
            
        logger.info(f"Security Alert Email sent to {recipient_email}")
        return True
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error sending Security Alert email to {recipient_email}: {e}")
        return False
    except Exception as e:
        logger.error(f"Failed to send Security Alert email to {recipient_email}: {e}")
        return False

def send_otp_email(recipient_email: str, code: str, action: str, username: str = "User"):
    """
    Sends an OTP email for a specific sensitive action.
    """
    smtp_server = os.environ.get("SMTP_SERVER") or os.environ.get("SMTP_HOST")
    smtp_port = os.environ.get("SMTP_PORT")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD") or os.environ.get("SMTP_PASS")
    sender_email = os.environ.get("SMTP_FROM_EMAIL") or os.environ.get("SMTP_ADMIN_EMAIL", "noreply@coact.ai")

    if not (smtp_server and smtp_port and smtp_user and smtp_password):
        print(f"\n{'='*50}")
        print(f"📧 [MOCK EMAIL] To: {recipient_email}")
        print(f"Subject: Verification Code for {action}")
        print(f"Code: {code}")
        print(f"{'='*50}\n")
        return True

    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = sender_email
        msg['To'] = recipient_email
        
        if action == "password_update":
            subject = "Verification Code to Update Password"
            action_text = "update your password"
        elif action == "forgot_password":
            subject = "Verification Code to Reset Password"
            action_text = "reset your forgotten password"
        else:
            subject = "Verification Code to Delete Account"
            action_text = "delete your account"
            
        msg['Subject'] = subject

        text_body = f"""
        Hello {username},
        
        You have requested to {action_text}.
        Please use the following verification code to complete this action: {code}
        
        This code will expire in 15 minutes.
        If you did not request this, please ignore this email.
        
        Best regards,
        The CoAct.AI Team
        """
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Inter', sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px; }}
                .container {{ max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }}
                .header {{ background-color: #18181b; padding: 24px; text-align: center; }}
                .header h1 {{ color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; }}
                .content {{ padding: 32px; }}
                .content p {{ font-size: 16px; line-height: 1.6; color: #3f3f46; margin-top: 0; margin-bottom: 24px; }}
                .code-container {{ background-color: #f4f4f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px; }}
                .code {{ font-size: 36px; font-weight: 800; letter-spacing: 4px; color: #18181b; margin: 0; }}
                .footer {{ background-color: #fafafa; padding: 20px 32px; text-align: center; border-top: 1px solid #e4e4e7; }}
                .footer p {{ font-size: 14px; color: #a1a1aa; margin: 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>CoAct.AI</h1>
                </div>
                <div class="content">
                    <p>Hello {username},</p>
                    <p>You have requested to <strong>{action_text}</strong>. Please use the verification code below to complete this action:</p>
                    <div class="code-container">
                        <p class="code">{code}</p>
                    </div>
                    <p style="font-size: 14px; color: #71717a; margin-bottom: 0;">This code will expire in 15 minutes. If you did not request this, please change your password immediately.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 CoAct.AI. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        if int(smtp_port) == 465:
            with smtplib.SMTP_SSL(smtp_server, int(smtp_port), timeout=SMTP_TIMEOUT) as server:
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_server, int(smtp_port), timeout=SMTP_TIMEOUT) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
            
        logger.info(f"OTP Email sent to {recipient_email}")
        return True
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error sending OTP email to {recipient_email}: {e}")
        return False
    except Exception as e:
        logger.error(f"Failed to send OTP email to {recipient_email}: {e}")
        return False
