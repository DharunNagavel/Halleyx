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

const renderDataToHtml = (data) => {
  if (!data || typeof data !== "object") return "";
  const entries = Object.entries(data).filter(([key]) => !['id', 'workflow_id', 'execution_id', 'approval_status'].includes(key));
  
  if (entries.length === 0) return '<div style="color: #52525b; font-style: italic; font-size: 12px; text-align: center; padding: 20px;">No contextual data available</div>';

  return entries.map(([key, value]) => {
    const label = key.replace(/_/g, ' ').toUpperCase();
    let displayValue = value;
    
    if (typeof value === 'object' && value !== null) {
      displayValue = `<pre style="margin: 0; font-size: 11px; color: #a1a1aa; background: #000; padding: 12px; border-radius: 8px; border: 1px solid #18181b; overflow-x: auto;">${JSON.stringify(value, null, 2)}</pre>`;
    } else if (typeof value === 'boolean') {
      displayValue = value 
        ? '<span style="color: #10b981; font-weight: 900;">TRUE</span>' 
        : '<span style="color: #ef4444; font-weight: 900;">FALSE</span>';
    } else if (value === null || value === undefined) {
      displayValue = '<span style="color: #52525b; font-style: italic;">NULL</span>';
    } else {
      displayValue = `<span style="color: #ffffff; font-weight: 600;">${value}</span>`;
    }

    return `
      <div style="margin-bottom: 12px; background: #09090b; border: 1px solid #18181b; border-radius: 12px; padding: 16px;">
        <div style="font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #52525b; margin-bottom: 6px;">${label}</div>
        <div style="font-size: 13px; line-height: 1.4;">${displayValue}</div>
      </div>
    `;
  }).join('');
};

export const sendNotificationEmail = async (to, workflowName, status, data) => {
  const mailOptions = {
    from: `"Halleyx Engine" <dharunnagavel1226@gmail.com>`,
    to: to,
    subject: `Workflow Update: ${workflowName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body {
                  margin: 0;
                  padding: 0;
                  background-color: #000000;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  color: #ffffff;
              }
              .container {
                  max-width: 600px;
                  margin: 40px auto;
                  padding: 40px;
                  background-color: #000000;
                  border: 1px solid #27272a;
                  border-radius: 32px;
              }
              .status-badge {
                  display: inline-block;
                  padding: 6px 14px;
                  background-color: #10b981;
                  color: #000000;
                  border-radius: 100px;
                  font-size: 10px;
                  font-weight: 900;
                  text-transform: uppercase;
                  letter-spacing: 0.1em;
                  margin-bottom: 24px;
              }
              .title {
                  font-size: 28px;
                  font-weight: 900;
                  letter-spacing: -0.04em;
                  text-transform: uppercase;
                  margin: 0 0 8px 0;
                  color: #ffffff;
              }
              .subtitle {
                  font-size: 10px;
                  font-weight: 900;
                  text-transform: uppercase;
                  letter-spacing: 0.2em;
                  color: #71717a;
                  margin-bottom: 32px;
              }
              .footer {
                  margin-top: 40px;
                  padding-top: 24px;
                  border-top: 1px solid #18181b;
                  font-size: 11px;
                  color: #52525b;
                  text-align: center;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="status-badge">${status}</div>
              <h1 class="title">Workflow <span style="color: #10b981;">Progress</span></h1>
              <p class="subtitle">${workflowName}</p>
              
              <div style="margin-top: 32px;">
                  <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #52525b; margin-bottom: 16px;">Execution Details</div>
                  ${renderDataToHtml(data)}
              </div>
              
              <div class="footer">
                  Automated notification from Halleyx Engine.
              </div>
          </div>
      </body>
      </html>
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
  const approvalLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/approve/${executionId}?action=approve`;
  const rejectLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/approve/${executionId}?action=reject`;

  const mailOptions = {
    from: `"Halleyx Engine" <dharunnagavel1226@gmail.com>`,
    to: to,
    subject: `Approval Required: ${workflowName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              body {
                  margin: 0;
                  padding: 0;
                  background-color: #000000;
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  color: #ffffff;
              }
              .container {
                  max-width: 600px;
                  margin: 40px auto;
                  padding: 40px;
                  background-color: #000000;
                  border: 1px solid #27272a;
                  border-radius: 32px;
              }
              .logo {
                  width: 32px;
                  height: 32px;
                  background-color: #10b981;
                  border-radius: 8px;
                  margin-bottom: 24px;
              }
              .title {
                  font-size: 28px;
                  font-weight: 900;
                  letter-spacing: -0.04em;
                  text-transform: uppercase;
                  margin: 0 0 8px 0;
                  color: #ffffff;
              }
              .subtitle {
                  font-size: 10px;
                  font-weight: 900;
                  text-transform: uppercase;
                  letter-spacing: 0.2em;
                  color: #10b981;
                  margin-bottom: 24px;
              }
              .description {
                  font-size: 14px;
                  color: #71717a;
                  margin-bottom: 32px;
                  line-height: 1.6;
              }
              .actions {
                  display: table;
                  width: 100%;
                  border-spacing: 12px 0;
                  margin: 32px -12px 0 -12px;
              }
              .btn-cell {
                  display: table-cell;
                  width: 50%;
              }
              .btn {
                  display: block;
                  height: 56px;
                  line-height: 56px;
                  text-align: center;
                  text-decoration: none;
                  font-size: 10px;
                  font-weight: 900;
                  text-transform: uppercase;
                  letter-spacing: 0.2em;
                  border-radius: 16px;
              }
              .btn-approve {
                  background-color: #10b981;
                  color: #000000;
              }
              .btn-reject {
                  background-color: #09090b;
                  color: #ffffff;
                  border: 1px solid #18181b;
              }
              .footer {
                  margin-top: 40px;
                  padding-top: 24px;
                  border-top: 1px solid #18181b;
                  font-size: 11px;
                  color: #52525b;
                  text-align: center;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="logo"></div>
              
              <h1 class="title">Approval <span style="color: #10b981;">Required</span></h1>
              <p class="subtitle">${workflowName}</p>
              
              <p class="description">
                  A workflow execution is waiting for your decision. Please review the context below and proceed with the appropriate action.
              </p>
              
              <div style="margin-top: 32px;">
                  <div style="font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #52525b; margin-bottom: 16px;">Execution Context</div>
                  ${renderDataToHtml(data)}
              </div>
              
              <div class="actions">
                  <div class="btn-cell">
                      <a href="${approvalLink}" class="btn btn-approve">Approve</a>
                  </div>
                  <div class="btn-cell">
                      <a href="${rejectLink}" class="btn btn-reject">Reject</a>
                  </div>
              </div>
              
              <div class="footer">
                  This is an automated request from the Halleyx Engine.
              </div>
          </div>
      </body>
      </html>
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
