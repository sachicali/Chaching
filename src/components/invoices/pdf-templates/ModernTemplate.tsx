import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image, DocumentProps } from '@react-pdf/renderer';
import { Invoice } from '@/types/database.types';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf' },
    { src: 'https://fonts.gstatic.com/s/roboto/v20/KFOlCnqEu92Fr1MmEU9fBBc9.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    backgroundColor: '#fff',
    padding: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#4A90E2',
    color: 'white',
    padding: 20,
    borderRadius: 5,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  invoiceTitle: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  invoiceInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  clientInfo: {
    width: '50%',
  },
  invoiceDetails: {
    width: '40%',
    textAlign: 'right',
  },
  table: {
    display: "flex",
    width: "auto",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
    height: 30,
  },
  tableColHeader: {
    width: "25%",
    fontWeight: 'bold',
    color: '#333',
  },
  tableCol: {
    width: "25%",
  },
  tableCell: {
    fontSize: 10,
  },
  totals: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsTable: {
    width: '45%',
    backgroundColor: '#F7F7F7',
    padding: 15,
    borderRadius: 5,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  notes: {
    marginTop: 30,
    fontSize: 9,
    color: '#555',
  }
});

interface ModernTemplateProps extends DocumentProps {
  invoice: Invoice;
}

const ModernTemplate: React.FC<ModernTemplateProps> = ({ invoice, ...props }) => (
  <Document {...props}>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {invoice.businessInfo.logoUrl && <Image src={invoice.businessInfo.logoUrl} style={{ width: 80, height: 80, marginBottom: 10 }} />}
          <Text style={styles.businessName}>{invoice.businessInfo.businessName}</Text>
        </View>
        <Text style={styles.invoiceTitle}>INVOICE</Text>
      </View>
      
      <View style={styles.invoiceInfoContainer}>
        <View style={styles.clientInfo}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Bill To:</Text>
          <Text>{invoice.clientName}</Text>
          <Text>{invoice.clientAddress?.street}</Text>
          <Text>{invoice.clientAddress?.city}, {invoice.clientAddress?.state} {invoice.clientAddress?.postalCode}</Text>
          <Text>{invoice.clientAddress?.country}</Text>
        </View>
        <View style={styles.invoiceDetails}>
          <Text><Text style={{ fontWeight: 'bold' }}>Invoice #:</Text> {invoice.invoiceNumber}</Text>
          <Text><Text style={{ fontWeight: 'bold' }}>Issue Date:</Text> {new Date(invoice.issueDate.seconds * 1000).toLocaleDateString()}</Text>
          <Text><Text style={{ fontWeight: 'bold' }}>Due Date:</Text> {new Date(invoice.dueDate.seconds * 1000).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={{...styles.tableRow, borderBottomWidth: 2, borderBottomColor: '#4A90E2'}}>
          <View style={styles.tableColHeader}><Text>Description</Text></View>
          <View style={{...styles.tableColHeader, textAlign: 'center'}}><Text>Quantity</Text></View>
          <View style={{...styles.tableColHeader, textAlign: 'right'}}><Text>Rate</Text></View>
          <View style={{...styles.tableColHeader, textAlign: 'right'}}><Text>Amount</Text></View>
        </View>
        {invoice.lineItems.map(item => (
          <View style={styles.tableRow} key={item.id}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{item.description}</Text></View>
            <View style={{...styles.tableCol, textAlign: 'center'}}><Text style={styles.tableCell}>{item.quantity}</Text></View>
            <View style={{...styles.tableCol, textAlign: 'right'}}><Text style={styles.tableCell}>{item.rate.toFixed(2)}</Text></View>
            <View style={{...styles.tableCol, textAlign: 'right'}}><Text style={styles.tableCell}>{item.amount.toFixed(2)}</Text></View>
          </View>
        ))}
      </View>
      
      <View style={styles.totals}>
        <View style={styles.totalsTable}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{invoice.subtotal.toFixed(2)} {invoice.currency}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Tax ({invoice.taxRate}%)</Text>
            <Text>{invoice.taxAmount.toFixed(2)} {invoice.currency}</Text>
          </View>
          {invoice.discount && (
            <View style={styles.totalsRow}>
              <Text>Discount</Text>
              <Text>-{invoice.discount.amount.toFixed(2)} {invoice.currency}</Text>
            </View>
          )}
          <View style={{...styles.totalsRow, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#ccc' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 14 }}>Total</Text>
            <Text style={styles.totalAmount}>{invoice.total.toFixed(2)} {invoice.currency}</Text>
          </View>
        </View>
      </View>
      
      {invoice.notes && (
        <View style={styles.notes}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Notes:</Text>
          <Text>{invoice.notes}</Text>
        </View>
      )}
    </Page>
  </Document>
);

export default ModernTemplate;