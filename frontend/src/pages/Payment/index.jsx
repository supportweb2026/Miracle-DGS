import useLanguage from '@/locale/useLanguage';
import PaymentDataTableModule from '@/modules/PaymentModule/PaymentDataTableModule';

import { useMoney, useDate } from '@/settings';
import { ConfigProvider } from 'antd'; // Importer ConfigProvider
import locale from 'antd/locale/fr_FR';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

export default function Payment() {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const { moneyFormatter } = useMoney();
  const searchConfig = {
    entity: 'client',
    displayLabels: ['number'],
    searchFields: 'number',
    outputValue: '_id',
  };

  const deleteModalLabels = ['number'];
  const dataTableColumns = [
    {
      title: translate('Number'),

      dataIndex: 'number',
      sorter: (a, b) => a.number - b.number,

    },
    {
      title: translate('Client'),
      dataIndex: ['client', 'name'],
      sorter: (a, b) => a.client.name.localeCompare(b.client.name),

    },
    {
      title: translate('Amount'),
      dataIndex: 'amount',
      sorter: (a, b) => a.amount - b.amount,

      onCell: () => {
        return {
          style: {
            textAlign: 'right',
            whiteSpace: 'nowrap',
            direction: 'ltr',
          },
        };
      },
      render: (amount, record) =>
        moneyFormatter({ amount: amount, currency_code: record.currency }),
    },
    {
      title: translate('Date'),
      dataIndex: 'date',
     sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      
      render: (date) => {
        return dayjs(date).format(dateFormat);
      },
    },
    {
      title: translate('Number'),
      dataIndex: ['invoice', 'number'],
      sorter: (a, b) => a.number - b.number,

    },
    {
      title: translate('year'),
      dataIndex: ['invoice', 'year'],
      sorter: (a, b) => a.year - b.year,

    },
    {
      title: translate('Payment Mode'),
      dataIndex: ['paymentMode', 'name'],
      sorter: (a, b) => {
        return a.paymentMode.name.localeCompare(b.paymentMode.name);
      },
    },
  ];

  const entity = 'payment';

  const Labels = {
    PANEL_TITLE: translate('payment'),
    DATATABLE_TITLE: translate('payment_list'),
    ADD_NEW_ENTITY: translate('add_new_payment'),
    ENTITY_NAME: translate('payment'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  const config = {
    ...configPage,
    disableAdd: true,
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
  };
  return (
    <ConfigProvider locale={locale}>
      <PaymentDataTableModule config={config} />;
      </ConfigProvider>);
}
