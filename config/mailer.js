import { createTransport } from 'nodemailer';
import { compileTemplate } from '../utils/templateCompiler.js';
import { compileStatusTemplate } from '../utils/statusCompiler.js';
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
});

export const sendOrderConfirmation = async (order) => {
  try {
    const html = compileTemplate({
      ...order,
      orderId: order.id,
      orderDate: dayjs(order.created_at).format('YYYY-MM-DD'),
      items: order.items // Ensure items are included
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: order.email,
      cc: process.env.CC_EMAIL_ADDRESS,
      replyTo: process.env.REPLY_TO_EMAIL || process.env.EMAIL_FROM_ADDRESS,
      subject: `Your Order #${order.id} Confirmation`,
      html,
      text: generateTextVersion(order),
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

export const sendStatusConfirmation = async (data) => {
  try {
    const html = compileStatusTemplate({
      ...data,
      orderId: data.id, // Ensure orderId is passed correctly
      status: data.status,
      orderUpdate: dayjs(data.created_at).format('YYYY-MM-DD'),
    });

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: data.email, // Ensure the email is sent to the correct user
      cc: process.env.CC_EMAIL_ADDRESS,
      replyTo: process.env.REPLY_TO_EMAIL || process.env.EMAIL_FROM_ADDRESS,
      subject: `Your Order #${data.id} Status Update`,
      html,
      text: generateTextVersion(data),
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
  return `\nORDER CONFIRMATION\n------------------\nOrder #: ${order.id}\nDate: ${dayjs(order.created_at).format('YYYY-MM-DD')}\n\nITEMS:\n${order.items.map(i => `${i.quantity}x ${i.name} - ₦${format(i.price)}`).join('\n')}\n\nTOTAL: ₦${format(order.total_price)}\n\nShipping to:\n${order.address}\n${order.location}\n`;
};

export default { sendOrderConfirmation };