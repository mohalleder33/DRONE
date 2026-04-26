import React from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
const styles = StyleSheet.create({ page: { padding: 30 }, title: { fontSize: 18, marginBottom: 10 }, row: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 5 }, cell: { flex: 1, fontSize: 10 } });
const PDFDoc = ({ data, title }) => (<Document><Page size="A4" style={styles.page}><Text style={styles.title}>{title}</Text>{data.map((row,idx)=><View key={idx} style={styles.row}>{Object.values(row).map((val,i)=><Text key={i} style={styles.cell}>{val}</Text>)}</View>)}</Page></Document>);
const ExportPDFButton = ({ data, title }) => (<PDFDownloadLink document={<PDFDoc data={data} title={title} />} fileName={`${title}.pdf`}>{({loading})=>(loading?'جاري...':'PDF')}</PDFDownloadLink>);
export default ExportPDFButton;