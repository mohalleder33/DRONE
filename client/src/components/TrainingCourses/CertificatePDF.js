import React from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// ✅ تسجيل خط عربي (Tajawal)
Font.register({
  family: 'Tajawal',
  src: 'https://fonts.gstatic.com/ea/tajawal/v5/Tajawal-Regular.ttf'
});

// ✅ تسجيل خط عربي بديل (Noto Sans Arabic)
Font.register({
  family: 'Noto Sans Arabic',
  src: 'https://fonts.gstatic.com/ea/notosansarabic/v1/NotoSansArabic-Regular.ttf'
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: 'Tajawal',
    direction: 'rtl'
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Tajawal'
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Tajawal'
  },
  content: {
    marginTop: 20,
    lineHeight: 1.5,
    fontFamily: 'Tajawal'
  },
  line: {
    marginTop: 40,
    borderTopWidth: 1,
    paddingTop: 10,
    textAlign: 'center',
    fontFamily: 'Tajawal'
  },
  text: {
    fontFamily: 'Tajawal'
  }
});

const CertificatePDF = ({ course, trainee }) => {
  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>شهادة إتمام دورة تدريبية</Text>
        <Text style={styles.subtitle}>الجمهورية العربية السورية - وزارة الدفاع</Text>
        
        <View style={styles.content}>
          <Text style={styles.text}>يشهد بذلك أن:</Text>
          <Text style={styles.text}>الاسم: {trainee.name}</Text>
          <Text style={styles.text}>الرتبة: {trainee.rank}</Text>
          <Text style={styles.text}>الرقم العسكري: {trainee.militaryId || '—'}</Text>
          <Text style={styles.text}>قد أكمل بنجاح دورة "{course.courseName}"</Text>
          <Text style={styles.text}>رقم الدورة: {course.courseNumber}</Text>
          <Text style={styles.text}>بتاريخ: {new Date(course.endDate).toLocaleDateString('ar-EG')}</Text>
          <Text style={styles.text}>الدرجة التي حصل عليها: {trainee.grade}</Text>
        </View>
        
        <View style={styles.line}>
          <Text style={styles.text}>التوقيع: ___________________</Text>
          <Text style={styles.text}>ختم الجهة</Text>
        </View>
      </Page>
    </Document>
  );

  return (
    <PDFDownloadLink document={<MyDocument />} fileName={`certificate_${trainee.id}.pdf`}>
      {({ loading }) => (loading ? 'جاري تحضير الشهادة...' : '📜 تحميل الشهادة')}
    </PDFDownloadLink>
  );
};

export default CertificatePDF;