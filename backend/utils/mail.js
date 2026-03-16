import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "dharunnagavel1226@gmail.com",
    pass: "prmf umss lntp kolj",
  },
});

export const sendNotificationEmail = async (to, workflowName, status, data) => {
  const mailOptions = {
    from: `"Workflow engine" <dharunnagavel1226@gmail.com>`,
    to: to,
    subject: `Workflow Update: ${workflowName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #2563eb;">Workflow Progress Update</h2>
        <p>The workflow <strong>${workflowName}</strong> has reached a notification step.</p>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #64748b;">Current Status</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #1e293b; text-transform: uppercase;">${status}</p>
        </div>

        <h3>Execution Data:</h3>
        <pre style="background: #f1f5f9; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 13px;">${JSON.stringify(data, null, 2)}</pre>
        
        <p style="margin-top: 30px; font-size: 12px; color: #94a3b8; border-top: 1px solid #eee; pt: 15px;">
            This is an automated notification from your Workflow Engine.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Notification Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending notification email:", error.message);
    return null;
  }
};

export const sendApprovalEmail = async (to, executionId, workflowName, data) => {
  const approvalLink = `${'https://halleyx-cgf3.vercel.app/'}/approve/${executionId}?action=approve`;
  const rejectLink = `${'https://halleyx-cgf3.vercel.app/'}/approve/${executionId}?action=reject`;

  const mailOptions = {
    from: `"Workflow engine" <${'dharunnagavel1226@gmail.com'}>`,
    to: to,
    subject: `Approval Required: ${workflowName}`,
    html: `
      <h2>Approval Required for Workflow: ${workflowName}</h2>
      <p>A workflow execution is waiting for your approval.</p>
      <h3>Details:</h3>
      <pre>${JSON.stringify(data, null, 2)}</pre>
      <div style="margin-top: 20px;">
        <a href="${approvalLink}" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Approve</a>
        <a href="${rejectLink}" style="background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reject</a>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error.message);
    return null;
  }
};
