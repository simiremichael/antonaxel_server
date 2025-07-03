
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


// Register Helpers
// Handlebars.registerHelper('multiply', (a, b) => (a * b).toFixed(2));
// Handlebars.registerHelper('formatPrice', (price) => price.toFixed(2));

Handlebars.registerHelper('multiply', (a, b) => {
  const numA = Number(a);
  const numB = Number(b);
  if (!isNaN(numA) && !isNaN(numB)) {
    return (numA * numB).toFixed(2);
  }
  return '0.00'; // Default for safety
});
Handlebars.registerHelper('formatPrice', (price) => {
  if (typeof price === 'number') {
    return price.toLocaleString();
  }
  return '0.00'; // Default to 0.00 if price is not a number
});

// Partials Support
Handlebars.registerPartial('footer', 
  fs.readFileSync(path.join(__dirname, '../templates/partials/footer.mjml'), 'utf8')
);

export const compileTemplate = (data) => {
  // console.log(data)
  const templatePath = path.join(__dirname, '../templates/order-confirmation.mjml');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  
  // Compile with Handlebars first
  const template = Handlebars.compile(templateContent);
  const mjml = template({
    year: new Date().getFullYear(),
    contactUrl: process.env.CONTACT_URL,
    privacyUrl: process.env.PRIVACY_URL,
    logoUrl: process.env.LOGO_URL,
    total: data.total_price,
    items: data.items,
    address: `${data.address, data.location}`,
    shippingNotes: "Our agent will contact you shortly to complete your order."
  });

  // Convert MJML to HTML
  const { html, errors } = mjml2html(mjml);
  if (errors.length > 0) {
    console.error('MJML Errors:', errors);
    throw new Error('Failed to compile email template');
  }

  return html;
};
