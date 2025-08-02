import fs from 'fs';
import path from 'path';
import mjml2html from 'mjml';
import Handlebars from 'handlebars';
import { fileURLToPath } from 'url';
import dayjs from 'dayjs';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register status-specific helpers
Handlebars.registerHelper('isSuccessful', (status) => {
  return status === 'successful' || status === 'completed' || status === 'delivered';
});

Handlebars.registerHelper('isFailed', (status) => {
  return status === 'failed' || status === 'cancelled' || status === 'rejected';
});

Handlebars.registerHelper('getStatusColor', (status) => {
  const successStatuses = ['successful', 'completed', 'delivered'];
  const failedStatuses = ['failed', 'cancelled', 'rejected'];
  
  if (successStatuses.includes(status)) return '#28a745'; // Green
  if (failedStatuses.includes(status)) return '#dc3545'; // Red
  return '#ffc107'; // Yellow for pending/processing
});

Handlebars.registerHelper('getStatusMessage', (status) => {
  const messages = {
    'successful': 'Your order has been successfully processed!',
    'completed': 'Your order has been completed!',
    'delivered': 'Your order has been delivered!',
    'failed': 'Unfortunately, there was an issue with your order.',
    'cancelled': 'Your order has been cancelled.',
    'rejected': 'Your order could not be processed.',
    'processing': 'Your order is currently being processed.',
    'pending': 'Your order is pending confirmation.'
  };
  return messages[status] || 'Order status updated.';
});

// Use existing footer partial
Handlebars.registerPartial('footer', 
  fs.readFileSync(path.join(__dirname, '../templates/partials/footer.mjml'), 'utf8')
);

export const compileStatusTemplate = (data) => {
  const templatePath = path.join(__dirname, '../templates/status-confirmation.mjml');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  
  // Determine status classification
  const statusInfo = determineStatus(data.status);
  
  // Compile with Handlebars first
  const template = Handlebars.compile(templateContent);
  const mjml = template({
    year: new Date().getFullYear(),
    contactUrl: process.env.CONTACT_URL,
    privacyUrl: process.env.PRIVACY_URL,
    logoUrl: process.env.LOGO_URL,
    updateDate: dayjs().format('YYYY-MM-DD'),
    ...data,
    ...statusInfo,
    address: `${data.address}, ${data.location}`,
  });

  // Convert MJML to HTML
  const { html, errors } = mjml2html(mjml);
  if (errors.length > 0) {
    console.error('MJML Errors:', errors);
    throw new Error('Failed to compile status email template');
  }

  return html;
};

// Helper function to determine status classification and messaging
const determineStatus = (status) => {
  const successStatuses = ['successful', 'completed', 'delivered'];
  const failedStatuses = ['failed', 'cancelled', 'rejected'];
  
  let classification = 'pending';
  let icon = '⏳';
  let color = '#ffc107';
  
  if (successStatuses.includes(status)) {
    classification = 'successful';
    icon = '✅';
    color = '#28a745';
  } else if (failedStatuses.includes(status)) {
    classification = 'failed';
    icon = '❌';
    color = '#dc3545';
  }
  
  return {
    statusClassification: classification,
    statusIcon: icon,
    statusColor: color,
    isSuccess: classification === 'successful',
    isFailed: classification === 'failed'
  };
};

// export default { compileStatusTemplate };