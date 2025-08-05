import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Associate Incidents <noreply@yourdomain.com>',
      to: [userEmail],
      subject: 'Welcome to Associate Incidents!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Welcome to Associate Incidents!</h1>
          
          <p>Hello ${userName},</p>
          
          <p>Thank you for registering with Associate Incidents. Your account has been created successfully!</p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">What's Next?</h3>
            <ul style="color: #6c757d;">
              <li>Your account is currently pending approval</li>
              <li>An administrator will review and activate your account</li>
              <li>You'll receive an email notification once your account is approved</li>
            </ul>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>The Associate Incidents Team</p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          <p style="font-size: 12px; color: #6c757d; text-align: center;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Welcome email error:', error);
      return { success: false, error };
    }

    console.log('Welcome email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Welcome email error:', error);
    return { success: false, error };
  }
};

export const sendPasswordResetEmail = async (userEmail, resetToken) => {
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Associate Incidents <noreply@yourdomain.com>',
      to: [userEmail],
      subject: 'Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Password Reset Request</h1>
          
          <p>You recently requested to reset your password for your Associate Incidents account.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.
            </p>
          </div>
          
          <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
          
          <p>Best regards,<br>The Associate Incidents Team</p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          <p style="font-size: 12px; color: #6c757d; text-align: center;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Password reset email error:', error);
      return { success: false, error };
    }

    console.log('Password reset email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Password reset email error:', error);
    return { success: false, error };
  }
};

export const sendPasswordResetSuccessEmail = async (userEmail, userName) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Associate Incidents <noreply@yourdomain.com>',
      to: [userEmail],
      subject: 'Password Successfully Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Password Successfully Reset</h1>
          
          <p>Hello ${userName},</p>
          
          <p>Your password has been successfully reset for your Associate Incidents account.</p>
          
          <div style="background-color: #d4edda; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; color: #155724;">
              <strong>Success!</strong> You can now log in with your new password.
            </p>
          </div>
          
          <p>If you didn't perform this action, please contact our support team immediately as your account may have been compromised.</p>
          
          <p>Best regards,<br>The Associate Incidents Team</p>
          
          <hr style="border: none; border-top: 1px solid #dee2e6; margin: 30px 0;">
          <p style="font-size: 12px; color: #6c757d; text-align: center;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Password reset success email error:', error);
      return { success: false, error };
    }

    console.log('Password reset success email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Password reset success email error:', error);
    return { success: false, error };
  }
}; 