export function cookieOptionsByEnv(NODE_ENV) {
  const isProd = NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    maxAge: 24 * 60 * 60 * 1000,
  };
}

export function generateOtpEmailHtml(otp, emailTitle, emailDescr) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailTitle}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .container {
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                max-width: 500px;
                width: 100%;
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 28px;
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .header p {
                font-size: 16px;
                opacity: 0.9;
            }
            
            .content {
                padding: 40px 30px;
                text-align: center;
            }
            
            .otp-container {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                border-radius: 15px;
                padding: 30px;
                margin: 30px 0;
                box-shadow: 0 10px 30px rgba(240, 147, 251, 0.3);
            }
            
            .otp-code {
                font-size: 48px;
                font-weight: bold;
                color: white;
                letter-spacing: 8px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                margin: 10px 0;
            }
            
            .description {
                color: #666;
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 30px;
            }
            
            .footer {
                background: #f8f9fa;
                padding: 30px;
                text-align: center;
                color: #666;
                font-size: 14px;
            }
            
            .security-note {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 10px;
                padding: 15px;
                margin-top: 20px;
                color: #856404;
                font-size: 14px;
            }
            
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                }
                
                .header, .content, .footer {
                    padding: 20px;
                }
                
                .otp-code {
                    font-size: 36px;
                    letter-spacing: 6px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${emailTitle}</h1>
                <p>Secure Authentication</p>
            </div>
            
            <div class="content">
                <p class="description">${emailDescr}</p>
                
                <div class="otp-container">
                    <div class="otp-code">${otp}</div>
                </div>
                
                <div class="security-note">
                    <strong>Security Note:</strong> This OTP will expire in 5 minutes. Never share this code with anyone.
                </div>
            </div>
            
            <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; 2024 Triostack Software. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}
