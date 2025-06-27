import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, DocumentProps } from '@react-pdf/renderer';
import { Invoice } from '@/types/database.types';

// Register fonts
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/helvetica/v11/KFOmCnqEu92Fr1Mu4mxP.ttf' },
    { src: 'https://fonts.gstatic.com/s/helvetica/v11/KFOmCnqEu92Fr1Mu4WxP.ttf', fontWeight: 'bold' },
  ],
});


const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 50,
    color: '#333',
  },
  header: {
    marginBottom: 20,
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  invoiceInfo: {
    fontSize: 12,
  },
  section: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  clientInfo: {
    flexDirection: 'column',
  },
  businessInfo: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  table: {
    display: "flex",
    width: "auto",
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 8,
  },
  tableColHeader: {
    width: "25%",
    fontWeight: 'bold',
  },
  tableCol: {
    width: "25%",
  },
  totals: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsTable: {
    width: '35%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 9,
    color: '#888',
  },
});

interface MinimalTemplateProps extends DocumentProps {
  invoice: Invoice;
}

const MinimalTemplate: React.FC<MinimalTemplateProps> = ({ invoice, ...props }) => (
  <Document {...props}>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.invoiceTitle}>INVOICE</Text>
        <Text style={styles.invoiceInfo}>#{invoice.invoiceNumber}</Text>
      </View>
      
      <View style={styles.section}>
        <View style={styles.clientInfo}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Billed To</Text>
          <Text>{invoice.clientName}</Text>
          <Text>{invoice.clientEmail}</Text>
        </View>
        <View style={styles.businessInfo}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>From</Text>
          <Text>{invoice.businessInfo.businessName}</Text>
          <Text>{invoice.businessInfo.email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View>
          <Text style={{ fontWeight: 'bold' }}>Issue Date</Text>
          <Text>{new Date(invoice.issueDate.seconds * 1000).toLocaleDateString()}</Text>
        </View>
        <View style={{alignItems: 'flex-end'}}>
          <Text style={{ fontWeight: 'bold' }}>Due Date</Text>
          <Text>{new Date(invoice.dueDate.seconds * 1000).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={{...styles.tableRow, borderBottomColor: '#333', borderBottomWidth: 2}}>
          <View style={styles.tableColHeader}><Text>Description</Text></View>
          <View style={{...styles.tableColHeader, textAlign: 'center'}}><Text>Qty</Text></View>
          <View style={{...styles.tableColHeader, textAlign: 'right'}}><Text>Rate</Text></View>
          <View style={{...styles.tableColHeader, textAlign: 'right'}}><Text>Amount</Text></View>
        </View>
        {invoice.lineItems.map(item => (
          <View style={styles.tableRow} key={item.id}>
            <View style={styles.tableCol}><Text>{item.description}</Text></View>
            <View style={{...styles.tableCol, textAlign: 'center'}}><Text>{item.quantity}</Text></View>
            <View style={{...styles.tableCol, textAlign: 'right'}}><Text>{item.rate.toFixed(2)}</Text></View>
            <View style={{...styles.tableCol, textAlign: 'right'}}><Text>{item.amount.toFixed(2)}</Text></View>
          </View>
        ))}
      </View>
      
      <View style={styles.totals}>
        <View style={styles.totalsTable}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{invoice.subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Tax ({invoice.taxRate}%)</Text>
            <Text>{invoice.taxAmount.toFixed(2)}</Text>
          </View>
          {invoice.discount && (
            <View style={styles.totalsRow}>
              <Text>Discount</Text>
              <Text>-{invoice.discount.amount.toFixed(2)}</Text>
            </View>
          )}
          <View style={{...styles.totalsRow, borderTopWidth: 2, borderTopColor: '#333', marginTop: 5, paddingTop: 5}}>
            <Text style={{ fontWeight: 'bold' }}>Total</Text>
            <Text style={{ fontWeight: 'bold' }}>{invoice.total.toFixed(2)} {invoice.currency}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.footer}>
        Thank you for your business.
      </Text>
    </Page>
  </Document>
);

export default MinimalTemplate;