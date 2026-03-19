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
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
              body {
                  margin: 0;
                  padding: 0;
                  background-color: #000000;
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  color: #ffffff;
              }
              .container {
                  max-width: 600px;
                  margin: 40px auto;
                  padding: 48px;
                  background-color: #000000;
                  border: 1px solid #27272a;
                  border-radius: 40px;
              }
              .status-badge {
                  display: inline-block;
                  padding: 6px 16px;
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
                  font-size: 24px;
                  font-weight: 900;
                  letter-spacing: -0.05em;
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
              .data-card {
                  background-color: #09090b;
                  border: 1px solid #18181b;
                  border-radius: 16px;
                  padding: 20px;
                  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              }
              .data-content {
                  font-size: 12px;
                  color: #a1a1aa;
                  margin: 0;
                  white-space: pre-wrap;
              }
              .footer {
                  margin-top: 40px;
                  padding-top: 24px;
                  border-top: 1px solid #18181b;
                  font-size: 12px;
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
              
              <div class="data-card">
                  <pre class="data-content">${JSON.stringify(data, null, 2)}</pre>
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
    from: `"Workflow engine" <${'dharunnagavel1226@gmail.com'}>`,
    to: to,
    subject: `Approval Required: ${workflowName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
              body {
                  margin: 0;
                  padding: 0;
                  background-color: #000000;
                  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  color: #ffffff;
              }
              .container {
                  max-width: 600px;
                  margin: 40px auto;
                  padding: 48px;
                  background-color: #000000;
                  border: 1px solid #27272a;
                  border-radius: 40px;
                  box-shadow: 0 25px 50px -12px rgba(16, 185, 129, 0.05);
              }
              .logo-box {
                  width: 64px;
                  height: 64px;
                  background-color: #000000;
                  border: 1px solid #27272a;
                  border-radius: 20px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  margin-bottom: 32px;
              }
              .logo {
                  width: 32px;
                  height: 32px;
                  background-color: #10b981;
                  border-radius: 8px;
              }
              .title {
                  font-size: 24px;
                  font-weight: 900;
                  letter-spacing: -0.05em;
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
              .data-card {
                  background-color: #09090b;
                  border: 1px solid #18181b;
                  border-radius: 16px;
                  padding: 20px;
                  margin-bottom: 32px;
                  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              }
              .data-title {
                  font-size: 10px;
                  font-weight: 900;
                  text-transform: uppercase;
                  letter-spacing: 0.1em;
                  color: #52525b;
                  margin-bottom: 12px;
              }
              .data-content {
                  font-size: 12px;
                  color: #a1a1aa;
                  margin: 0;
                  white-space: pre-wrap;
              }
              .actions {
                  display: table;
                  width: 100%;
                  border-spacing: 12px 0;
                  margin: 0 -12px;
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
                  transition: all 0.2s;
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
                  font-size: 12px;
                  color: #52525b;
                  text-align: center;
              }
          </style>
          
          <!-- Gmail Action Schema -->
          <script type="application/ld+json">
          {
            "@context": "http://schema.org",
            "@type": "WorkflowAction",
            "name": "Approve Workflow",
            "actionStatus": "PotentialActionStatus",
            "object": {
              "@type": "Action",
              "name": "Decision requested for ${workflowName}"
            },
            "target": {
              "@type": "HttpActionHandler",
              "url": "${approvalLink}",
              "method": "GET"
            }
          }
          </script>
      </head>
      <body>
          <div class="container">
              <div class="logo-box">
                  <div class="logo"></div>
              </div>
              
              <h1 class="title">Approval <span style="color: #10b981;">Required</span></h1>
              <p class="subtitle">${workflowName}</p>
              
              <p class="description">
                  A workflow execution is waiting for your decision. Please review the details below and proceed with the appropriate action.
              </p>
              
              <div class="data-card">
                  <div class="data-title">Execution Context</div>
                  <pre class="data-content">${JSON.stringify(data, null, 2)}</pre>
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
