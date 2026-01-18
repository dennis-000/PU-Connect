# Supabase Email Templates for Campus Connect

Go to your **Supabase Dashboard** -> **Authentication** -> **Email Templates**.
Select **"Confirm Email Change"** (and others if you wish) and paste the corresponding HTML below.

---

## 1. Confirm Email Change

**Subject:** Confirm your email change for Campus Connect

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 0; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 40px; color: #334155; line-height: 1.6; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 12px; margin-top: 24px; text-transform: uppercase; letter-spacing: 0.5px; font-size: 14px; }
    .btn:hover { background-color: #1d4ed8; }
    .footer { background-color: #f1f5f9; padding: 24px; text-align: center; color: #64748b; font-size: 12px; }
    .detail-box { background: #feffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 14px; color: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Campus Connect</h1>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #0f172a;">Confirm Email Update</h2>
      <p>Hello,</p>
      <p>You requested to update your email address for your Campus Connect account.</p>
      
      <div class="detail-box">
        <strong>From:</strong> {{ .Email }}<br>
        <strong>To:</strong> {{ .NewEmail }}
      </div>

      <p>Please click the button below to confirm this change. The link is valid for 24 hours.</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="btn">Confirm Change</a>
      </div>
      
      <p style="margin-top: 30px; font-size: 13px; color: #94a3b8;">If you didn't request this change, please ignore this email or contact support immediately.</p>
    </div>
    <div class="footer">
      &copy; Campus Connect. All rights reserved.<br>
      Connecting Students, Empowering Campus Life.
    </div>
  </div>
</body>
</html>
```

---

## 2. Confirm Signup (Optional)

**Subject:** Welcome to Campus Connect! Please verify your email

**Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 0; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 40px; color: #334155; line-height: 1.6; }
    .btn { display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 12px; margin-top: 24px; text-transform: uppercase; letter-spacing: 0.5px; font-size: 14px; }
    .footer { background-color: #f1f5f9; padding: 24px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Campus Connect</h1>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #0f172a;">Welcome Aboard! 🚀</h2>
      <p>Thanks for joining Campus Connect. We're excited to have you.</p>
      <p>Please confirm your email address to get started and access all features.</p>
      
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="btn">Verify Email</a>
      </div>
    </div>
    <div class="footer">
      &copy; Campus Connect. All rights reserved.
    </div>
  </div>
</body>
</html>
```
