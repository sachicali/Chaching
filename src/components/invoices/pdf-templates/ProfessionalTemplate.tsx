import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, DocumentProps } from '@react-pdf/renderer';
import { Invoice } from '@/types/database.types';

// Register fonts
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/opensans/v17/mem8YaGs126MiZpBA-UFVZ0e.ttf' },
    { src: 'https://fonts.gstatic.com/s/opensans/v17/mem5YaGs126MiZpBA-UN_s8-.ttf', fontWeight: 600 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Open Sans',
    fontSize: 11,
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    lineHeight: 1.5,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 600,
    color: '#333',
  },
  invoiceInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  clientInfo: {
    flexDirection: 'column',
  },
  invoiceDetails: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row"
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#f2f2f2'
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 12,
    fontWeight: 600
  },
  tableCell: {
    margin: 5,
    fontSize: 10
  },
  totals: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsTable: {
    width: '40%',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
});

interface ProfessionalTemplateProps extends DocumentProps {
  invoice: Invoice;
}

const ProfessionalTemplate: React.FC<ProfessionalTemplateProps> = ({ invoice, ...props }) => (
  <Document {...props}>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{invoice.businessInfo.businessName}</Text>
        <Text>Invoice</Text>
      </View>
      
      <View style={styles.invoiceInfoContainer}>
        <View style={styles.clientInfo}>
          <Text>Billed To:</Text>
          <Text>{invoice.clientName}</Text>
          <Text>{invoice.clientAddress?.street}</Text>
          <Text>{invoice.clientAddress?.city}, {invoice.clientAddress?.state} {invoice.clientAddress?.postalCode}</Text>
          <Text>{invoice.clientAddress?.country}</Text>
        </View>
        <View style={styles.invoiceDetails}>
          <Text>Invoice Number: {invoice.invoiceNumber}</Text>
          <Text>Issue Date: {new Date(invoice.issueDate.seconds * 1000).toLocaleDateString()}</Text>
          <Text>Due Date: {new Date(invoice.dueDate.seconds * 1000).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Description</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Quantity</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Rate</Text></View>
          <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Amount</Text></View>
        </View>
        {invoice.lineItems.map(item => (
          <View style={styles.tableRow} key={item.id}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{item.description}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{item.quantity}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{item.rate.toFixed(2)}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{item.amount.toFixed(2)}</Text></View>
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
          <View style={{...styles.totalsRow, fontWeight: 600}}>
            <Text>Total</Text>
            <Text>{invoice.total.toFixed(2)} {invoice.currency}</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

export default ProfessionalTemplate;