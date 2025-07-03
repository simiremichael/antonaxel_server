import { createTransport } from 'nodemailer';
import { compileTemplate } from '../utils/templateCompiler.js';
import dayjs from 'dayjs';
import dotenv from 'dotenv';
dotenv.config();


// Zoho-specific transporter config
const transporter = createTransport({
  host: "smtp.zoho.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  // tls: {
  //   // Required for Zoho
  //   rejectUnauthorized: true,
  //   minVersion: "TLSv1.2"
  // },
  // logger: true, // Enable for debugging
  // debug: true   // Show debug output
});

export const sendOrderConfirmation = async (order) => {
  // console.log(order)
  try {
    const html = compileTemplate({
      ...order,
      orderId: order.id,
      orderDate: dayjs(order.created_at).format('YYYY-MM-DD'),

    });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: order.email,
      replyTo: process.env.REPLY_TO_EMAIL || process.env.EMAIL_FROM_ADDRESS,
      subject: `Your Order #${order.id} Confirmation`,
      html,
      text: generateTextVersion(order),
      // headers: {
      //   'X-Mailer': 'Your Store',
      //   'X-Priority': '1' // High priority
      // }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Zoho Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('Zoho Send Error:', error);
    return { 
      success: false, 
      error: error.message,
      stack: error.stack 
    };
  }
};

// Helper for text version
const generateTextVersion = (order) => {
const format = (price) => (typeof price === 'number' ? price.toFixed(2) : '0.00');
return `
ORDER CONFIRMATION
------------------
Order #: ${order.id}
Date: ${dayjs(order.created_at).format('YYYY-MM-DD')}
}

ITEMS:
${order.items.map(i => `${i.quantity}x ${i.name} - ₦${format(i.price)}`).join('\n')}


TOTAL: ₦${format(order.total_price)}

Shipping to:
${order.address}
${order.address}, ${order.location}
`;
};
export default { sendOrderConfirmation };