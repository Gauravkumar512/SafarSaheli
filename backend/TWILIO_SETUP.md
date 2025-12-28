# Twilio SMS Setup Guide

This guide will help you set up Twilio SMS integration for the SafarSaheli SOS feature.

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com)
2. A Twilio phone number (get one from Twilio Console)

## Step 1: Get Your Twilio Credentials

1. Log in to your Twilio Console: https://console.twilio.com
2. Go to **Account** → **API Keys & Tokens**
3. You'll find:
   - **Account SID**: Your account identifier
   - **Auth Token**: Your authentication token (click to reveal)

## Step 2: Get Your Twilio Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Copy your Twilio phone number (format: +1234567890)

## Step 3: Set Environment Variables

### Option A: Using .env file (Recommended)

Create a `.env` file in the `backend/` directory:

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Important:** Never commit the `.env` file to git! Add it to `.gitignore`.

### Option B: Using System Environment Variables

#### Windows (PowerShell):
```powershell
$env:TWILIO_ACCOUNT_SID="your_account_sid_here"
$env:TWILIO_AUTH_TOKEN="your_auth_token_here"
$env:TWILIO_PHONE_NUMBER="+1234567890"
```

#### Windows (Command Prompt):
```cmd
set TWILIO_ACCOUNT_SID=your_account_sid_here
set TWILIO_AUTH_TOKEN=your_auth_token_here
set TWILIO_PHONE_NUMBER=+1234567890
```

#### Linux/Mac:
```bash
export TWILIO_ACCOUNT_SID="your_account_sid_here"
export TWILIO_AUTH_TOKEN="your_auth_token_here"
export TWILIO_PHONE_NUMBER="+1234567890"
```

## Step 4: Install Dependencies

Make sure you've installed the Twilio package:

```bash
cd backend
pip install -r requirements.txt
```

## Step 5: Test the Integration

1. Start your backend server:
   ```bash
   uvicorn main:app --reload
   ```

2. Test the SMS endpoint using curl:
   ```bash
   curl -X POST http://localhost:8000/send-sms \
     -H "Content-Type: application/json" \
     -d '{
       "to_numbers": ["+919876543210"],
       "message": "Test SMS from SafarSaheli",
       "location": [28.6139, 77.2090],
       "vehicle_number": "DL-01-AB-1234"
     }'
   ```

## Troubleshooting

### Error: "Twilio credentials not configured"
- Make sure you've set all three environment variables
- Restart your backend server after setting environment variables
- Check that variable names are exactly: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### Error: "Failed to send SMS"
- Verify your Twilio Account SID and Auth Token are correct
- Check that your Twilio phone number is in E.164 format (e.g., +1234567890)
- Ensure your Twilio account has sufficient balance
- Verify the recipient phone numbers are in correct format

### SMS Not Received
- Check Twilio Console → **Monitor** → **Logs** → **Messaging** for delivery status
- Verify recipient phone numbers are valid and can receive SMS
- Check if your Twilio account is in trial mode (trial accounts can only send to verified numbers)

## Phone Number Format

The backend automatically formats phone numbers to E.164 format:
- 10-digit numbers → +91XXXXXXXXXX (India)
- Numbers starting with 0 → +91XXXXXXXXXX
- Numbers starting with 91 → +91XXXXXXXXXX
- Already in + format → Used as-is

## Security Notes

- **Never commit** your `.env` file or credentials to version control
- Keep your Auth Token secret and secure
- Rotate your Auth Token periodically
- Use environment variables instead of hardcoding credentials

## Support

For Twilio-specific issues, check:
- Twilio Documentation: https://www.twilio.com/docs
- Twilio Support: https://support.twilio.com

