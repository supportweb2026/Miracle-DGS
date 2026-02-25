import React from 'react';
import { ConfigProvider } from 'antd';
import locale from 'antd/locale/fr_FR';
import ReportForm from '@/forms/ReportForm'; // chemin à adapter si besoin
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

export default function RapportPage() {
  return (
    <ConfigProvider locale={locale}>
      <ReportForm />
    </ConfigProvider>
  );
}
