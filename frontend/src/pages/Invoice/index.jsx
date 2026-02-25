import { Tag } from 'antd';
import useLanguage from '@/locale/useLanguage';
import { tagColor } from '@/utils/statusTagColor';

import { useMoney, useDate } from '@/settings';
import InvoiceDataTableModule from '@/modules/InvoiceModule/InvoiceDataTableModule';

import { ConfigProvider } from 'antd'; // Importer ConfigProvider
import locale from 'antd/locale/fr_FR';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');


export default function Invoice() {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const entity = 'invoice';
  const { moneyFormatter } = useMoney();

  const searchConfig = {
    entity: 'client',
    displayLabels: ['name'],
    searchFields: 'name',
  };
  const deleteModalLabels = ['id', 'client.name'];
  const statusOrder = {
    draft: 1,
    pending: 2,
    sent: 3,
    accepted: 4,
    declined: 5,
  };
  const paymentOrder = {
    paid: 1,
    partially: 2,
    unpaid: 3,
  };
  // Fonction pour afficher les couleurs des statuts
  const getStatus = (status) => {
    const statusColors = {
      pending: 'orange',
      draft: 'gray',
      sent: 'green'
    };
    if (!status) {
      console.log("Status is undefined or null");
      status = 'unknown';
    }
    return <Tag color={statusColors[status] || 'blue'}>{translate(status)}</Tag>;
  };

  // Fonction pour afficher les couleurs des paiements
  const getPaymentTag = (paymentStatus) => {
    const paymentColors = {
      paid: 'green',
      unpaid: 'red',
      partially: 'blue'
    };
    if (!paymentStatus) {
      console.log("Status is undefined or null");
      paymentStatus = 'unknown';
    }
    return <Tag color={paymentColors[paymentStatus] || 'blue'}>{translate(paymentStatus)}</Tag>;
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
      render: (total, record) => {
        // Recalculer le total avec la même logique que dans Invoice.pug et ReadService.jsx
        let finalTotal = record.subTotal;
        if (record.taxName === 'TPS et CSS' || Number(record.taxRate) === 10.5) {
          // TPS et CSS : soustraire TPS, ajouter CSS
          finalTotal = record.subTotal - (record.subTotal * 0.095) + (record.subTotal * 0.01);
        } else if (record.taxName === 'TPS' || Number(record.taxRate) === 9.5) {
          // TPS seul : soustraire TPS
          finalTotal = record.subTotal - (record.subTotal * 0.095);
        } else if (record.taxName === 'TPS CSS' || Number(record.taxRate) === 19.5) {
          // TPS CSS : soustraire TPS, ajouter CSS
          finalTotal = record.subTotal - (record.subTotal * 0.185) + (record.subTotal * 0.01);
        } else if (record.taxName === 'TVA et CSS' || Number(record.taxRate) === 19) {
          // TVA et CSS : ajouter TVA et CSS
          finalTotal = record.subTotal + (record.subTotal * 0.18) + (record.subTotal * 0.01);
        } else if (record.taxRate > 0) {
          // Autres taxes : ajouter la taxe
          finalTotal = record.subTotal + record.taxTotal;
        }
        return moneyFormatter({ amount: finalTotal, currency_code: record.currency });
      },
    },
    {
      title: translate('paid'),
      dataIndex: 'credit',
      sorter: (a, b) => a.credit - b.credit,  // Tri numérique sur le montant
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
      render: (status) => getStatus(status),
    },
    {
      title: translate('Payment'),
      dataIndex: 'paymentStatus',
      sorter: (a, b) => paymentOrder[a.paymentStatus] - paymentOrder[b.paymentStatus],
      render: (paymentStatus) => getPaymentTag(paymentStatus),
    },
  ];

  const Labels = {
    PANEL_TITLE: translate('invoice'),
    DATATABLE_TITLE: translate('invoice_list'),
    ADD_NEW_ENTITY: translate('add_new_invoice'),
    ENTITY_NAME: translate('invoice'),

    RECORD_ENTITY: translate('record_payment'),
  };
  /*
  const tableLocale = {
    filterConfirm: translate('filter_confirm'), // Optionnel, si tu veux personnaliser les filtres
    filterReset: translate('filter_reset'),     // Optionnel, si tu veux personnaliser le reset des filtres
    emptyText: translate('no_data_found'),
    sortAscending: translate('coucou'), // Personnalise ici le message de tri croissant
    sortDescending: translate('tz'), // Personnalise ici le message de tri décroissant
  };*/

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
    <ConfigProvider locale={locale}> {/* Appliquer la locale française ici */}
      <InvoiceDataTableModule config={config}  />
    </ConfigProvider>
  );

}
