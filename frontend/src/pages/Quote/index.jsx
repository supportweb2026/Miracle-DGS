import { Tag } from 'antd';
import { tagColor } from '@/utils/statusTagColor';
import QuoteDataTableModule from '@/modules/QuoteModule/QuoteDataTableModule';
import { useMoney, useDate } from '@/settings';
import useLanguage from '@/locale/useLanguage';
import { ConfigProvider } from 'antd'; // Importer ConfigProvider
import locale from 'antd/locale/fr_FR';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');


export default function Quote() {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const entity = 'quote';
  const { moneyFormatter } = useMoney();

  const searchConfig = {
    entity: 'client',
    displayLabels: ['name'],
    searchFields: 'name',
  };
  const statusOrder = {
    draft: 1,
    pending: 2,
    sent: 3,
    accepted: 4,
    declined: 5,
  };
  const deleteModalLabels = ['number', 'client.name'];
    // Fonction pour définir une couleur en fonction du statut
    const getStatusTag = (status) => {
      const statusColors = {
        pending: 'purple',
        accepted: 'green',
        declined: 'red',
        draft: 'gray',
        sent: 'yellow',
       undefined: 'black',
      };
      if (!status) {
        console.log("Status is undefined or null");
        status = 'unknown';
      }
      console.log(status);
      return <Tag color={statusColors[status] || 'blue'}>{translate(status) || Unknown}</Tag>;
    };
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
      title: translate('Date'),
      dataIndex: 'date',
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
      render: (date) => {
        return dayjs(date).format(dateFormat);
      },
    },
    {
      title: translate('expired Date'),
      dataIndex: 'expiredDate',
      sorter: (a, b) => dayjs(a.expiredDate).unix() - dayjs(b.expiredDate).unix(),
      render: (date) => {
        return dayjs(date).format(dateFormat);
      },
    },
    {
      title: translate('Sub Total'),
      dataIndex: 'subTotal',
      sorter: (a, b) => a.subTotal - b.subTotal,
      onCell: () => {
        return {
          style: {
            textAlign: 'right',
            whiteSpace: 'nowrap',
            direction: 'ltr',
          },
        };
      },
      render: (total, record) => moneyFormatter({ amount: total, currency_code: record.currency }),
    },
    {
      title: translate('Total'),
      dataIndex: 'total',
      sorter: (a, b) => a.total - b.total,
      onCell: () => {
        return {
          style: {
            textAlign: 'right',
            whiteSpace: 'nowrap',
            direction: 'ltr',
          },
        };
      },
      render: (total, record) => moneyFormatter({ amount: total, currency_code: record.currency }),
    },

    {
      title: translate('Status'),
      dataIndex: 'status',
      sorter: (a, b) => statusOrder[a.status] - statusOrder[b.status],
      render: (status) => getStatusTag(status),
    },
  ];

  const Labels = {
    PANEL_TITLE: translate('proforma invoice'),
    DATATABLE_TITLE: translate('proforma_invoice_list'),
    ADD_NEW_ENTITY: translate('add_new_proforma'),
    ENTITY_NAME: translate('proforma invoice'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  const config = {
    ...configPage,
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
  };
  return (
    <ConfigProvider locale={locale}>
      <QuoteDataTableModule config={config} />
      </ConfigProvider>);
  
}
