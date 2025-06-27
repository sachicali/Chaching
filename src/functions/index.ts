import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { PdfService } from '../services/pdf.service';
import { Invoice } from '../types/database.types';
import { CallableRequest } from 'firebase-functions/v2/https';

initializeApp();

exports.generatePdf = onCall(async (request: CallableRequest<{ invoiceId: string }>) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  const { invoiceId } = request.data;
  const uid = request.auth.uid;

  try {
    const invoiceDoc = await getFirestore().collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      throw new HttpsError('not-found', 'Invoice not found');
    }

    const invoice = invoiceDoc.data() as Invoice;
    if (invoice.userId !== uid) {
      throw new HttpsError('permission-denied', 'You do not have permission to access this invoice.');
    }

    const pdfService = new PdfService(uid);
    const pdfUrl = await pdfService.generateInvoicePdf(invoice);

    return { pdfUrl };
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new HttpsError('internal', 'Failed to generate PDF', error);
  }
});