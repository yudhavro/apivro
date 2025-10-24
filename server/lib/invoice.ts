import PDFDocument from 'pdfkit';
import { uploadInvoice } from './s3.js';

interface InvoiceData {
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  plan_name: string;
  amount: number;
  fee: number;
  total_amount: number;
  payment_method: string;
  payment_date: string;
  reference: string;
}

/**
 * Format currency to IDR
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Indonesian format
 */
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate PDF invoice
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      // Collect PDF data
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('INVOICE', 50, 50, { align: 'center' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .text('API VRO - WhatsApp API Service', { align: 'center' })
        .text('support@yudhavro.com', { align: 'center' })
        .moveDown(2);

      // Invoice details
      const startY = 150;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Invoice Number:', 50, startY)
        .font('Helvetica')
        .text(data.invoice_number, 200, startY);

      doc
        .font('Helvetica-Bold')
        .text('Payment Date:', 50, startY + 20)
        .font('Helvetica')
        .text(formatDate(data.payment_date), 200, startY + 20);

      doc
        .font('Helvetica-Bold')
        .text('Reference:', 50, startY + 40)
        .font('Helvetica')
        .text(data.reference, 200, startY + 40);

      // Customer details
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Bill To:', 50, startY + 80);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(data.customer_name, 50, startY + 100)
        .text(data.customer_email, 50, startY + 115);

      // Line separator
      doc
        .moveTo(50, startY + 150)
        .lineTo(550, startY + 150)
        .stroke();

      // Items table header
      const tableTop = startY + 170;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Description', 50, tableTop)
        .text('Amount', 400, tableTop, { width: 90, align: 'right' });

      // Line under header
      doc
        .moveTo(50, tableTop + 20)
        .lineTo(550, tableTop + 20)
        .stroke();

      // Items
      let itemY = tableTop + 35;

      doc
        .font('Helvetica')
        .text(`${data.plan_name} - 1 Month Subscription`, 50, itemY)
        .text(formatCurrency(data.amount), 400, itemY, { width: 90, align: 'right' });

      itemY += 25;
      doc
        .text(`Payment Fee (${data.payment_method})`, 50, itemY)
        .text(formatCurrency(data.fee), 400, itemY, { width: 90, align: 'right' });

      // Line before total
      itemY += 30;
      doc
        .moveTo(50, itemY)
        .lineTo(550, itemY)
        .stroke();

      // Total
      itemY += 15;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Total Amount', 50, itemY)
        .text(formatCurrency(data.total_amount), 400, itemY, { width: 90, align: 'right' });

      // Payment status
      itemY += 40;
      doc
        .fontSize(14)
        .fillColor('#10b981')
        .text('✓ PAID', 50, itemY, { align: 'center' });

      // Footer
      doc
        .fontSize(8)
        .fillColor('#666666')
        .text(
          'Thank you for your business! This is a computer-generated invoice.',
          50,
          700,
          { align: 'center', width: 500 }
        );

      doc
        .text('For any questions, please contact support@yudhavro.com', {
          align: 'center',
          width: 500,
        });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate and upload invoice to S3
 */
export async function createAndUploadInvoice(data: InvoiceData): Promise<{
  success: boolean;
  invoice_url?: string;
  error?: string;
}> {
  try {
    console.log('📄 Generating invoice PDF:', data.invoice_number);

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(data);

    console.log('📤 Uploading invoice to S3...');

    // Upload to S3
    const uploadResult = await uploadInvoice(data.invoice_number, pdfBuffer);

    if (!uploadResult.success) {
      return {
        success: false,
        error: uploadResult.error,
      };
    }

    console.log('✅ Invoice uploaded:', uploadResult.url);

    return {
      success: true,
      invoice_url: uploadResult.url,
    };
  } catch (error: any) {
    console.error('❌ Invoice generation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate invoice',
    };
  }
}

export default {
  generateInvoicePDF,
  createAndUploadInvoice,
};
