import React from 'react';
import useLanguage from '@/locale/useLanguage';
import CrudModule from '@/modules/CrudModule/CrudModule';
import { ConfigProvider } from 'antd';
import locale from 'antd/locale/fr_FR';
import SiteTariffForm from '@/forms/SiteTariffForm';

export default function SiteTariff() {
  const translate = useLanguage();
  const entity = 'siteTariff';

  // Configuration pour la recherche
  const searchConfig = {
    displayLabels: ['site.name', 'prestation.name'],
    searchFields: 'site.name,prestation.name',
    outputValue: '_id',
  };

  // Labels pour la modal de suppression
  const deleteModalLabels = ['site.name', 'prestation.name'];

  // Fonction de rendu simple pour afficher les informations
  const renderInfo = (value) => {
    if (!value) return '-';
    return value;
  };

  const renderDuration = (record) => {
    if (!record) return '-';
    if (record.useCustomValues) {
      return `${record.customDuration} ${translate('heures')}`;
    }
    return `${record.prestation?.baseDuration || '-'} ${translate('heures')}`;
  };

  const renderHourlyRate = (record) => {
    if (!record) return '-';
    if (record.useCustomValues) {
      return `${record.customHourlyRate} ${translate('FCFA')}`;
    }
    return `${record.prestation?.baseHourlyRate || '-'} ${translate('FCFA')}`;
  };

  const renderDailyRate = (record) => {
    if (!record) return '-';
    if (record.useCustomValues) {
      return `${record.customDailyRate} ${translate('FCFA')}`;
    }
    return `${record.prestation?.baseDailyRate || '-'} ${translate('FCFA')}`;
  };

  // Colonnes de lecture (détail des tarifs)
  const readColumns = [
    {
      title: translate('Site'),
      dataIndex: 'site',
      render: (site) => {
        console.log('Site data:', site);
        return site && typeof site === 'object' ? site.name : '-';
      },
    },
    {
      title: translate('Prestation'),
      dataIndex: 'prestation',
      render: (prestation) => {
        console.log('Prestation data:', prestation);
        return prestation && typeof prestation === 'object' ? prestation.name : '-';
      },
    },
    {
      title: translate('Valeurs personnalisées'),
      dataIndex: 'useCustomValues',
      render: (value) => (value ? translate('Oui') : translate('Non')),
    },
    {
      title: translate('Durée'),
      dataIndex: 'customDuration',
      render: (_, record) => renderDuration(record),
    },
    {
      title: translate('Tarif horaire'),
      dataIndex: 'customHourlyRate',
      render: (_, record) => renderHourlyRate(record),
    },
    {
      title: translate('Tarif journalier'),
      dataIndex: 'customDailyRate',
      render: (_, record) => renderDailyRate(record),
    },
  ];

  // Colonnes principales pour afficher les tarifs
  const dataTableColumns = [
    {
      title: translate('Site'),
      dataIndex: 'site',
      sorter: (a, b) => {
        const nameA = a.site && typeof a.site === 'object' ? a.site.name : '';
        const nameB = b.site && typeof b.site === 'object' ? b.site.name : '';
        return nameA.localeCompare(nameB);
      },
      render: (site) => site && typeof site === 'object' ? site.name : '-',
    },
    {
      title: translate('Prestation'),
      dataIndex: 'prestation',
      sorter: (a, b) => {
        const nameA = a.prestation && typeof a.prestation === 'object' ? a.prestation.name : '';
        const nameB = b.prestation && typeof b.prestation === 'object' ? b.prestation.name : '';
        return nameA.localeCompare(nameB);
      },
      render: (prestation) => prestation && typeof prestation === 'object' ? prestation.name : '-',
    },
    {
      title: translate('Valeurs personnalisées'),
      dataIndex: 'useCustomValues',
      sorter: (a, b) => (a?.useCustomValues || false) - (b?.useCustomValues || false),
      render: (value) => (value ? translate('Oui') : translate('Non')),
    },
    {
      title: translate('Durée'),
      dataIndex: 'customDuration',
      sorter: (a, b) => {
        const aDuration = a.useCustomValues ? a.customDuration : (a.prestation?.baseDuration || 0);
        const bDuration = b.useCustomValues ? b.customDuration : (b.prestation?.baseDuration || 0);
        return aDuration - bDuration;
      },
      render: (_, record) => renderDuration(record),
    },
    {
      title: translate('Tarif horaire'),
      dataIndex: 'customHourlyRate',
      sorter: (a, b) => {
        const aRate = a.useCustomValues ? a.customHourlyRate : (a.prestation?.baseHourlyRate || 0);
        const bRate = b.useCustomValues ? b.customHourlyRate : (b.prestation?.baseHourlyRate || 0);
        return aRate - bRate;
      },
      render: (_, record) => renderHourlyRate(record),
    },
    {
      title: translate('Tarif journalier'),
      dataIndex: 'customDailyRate',
      sorter: (a, b) => {
        const aRate = a.useCustomValues ? a.customDailyRate : (a.prestation?.baseDailyRate || 0);
        const bRate = b.useCustomValues ? b.customDailyRate : (b.prestation?.baseDailyRate || 0);
        return aRate - bRate;
      },
      render: (_, record) => renderDailyRate(record),
    },
  ];

  // Labels pour l'interface utilisateur
  const Labels = {
    PANEL_TITLE: translate('tarifs par site'),
    DATATABLE_TITLE: translate('Liste des tarifs par site'),
    ADD_NEW_ENTITY: translate('Ajouter un tarif par site'),
    ENTITY_NAME: translate('Tarif par site'),
  };

  // Configuration de la page avec les labels
  const configPage = {
    entity,
    ...Labels,
  };

  // Configuration finale pour le CRUD
  const config = {
    ...configPage,
    readColumns,
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
  };

  return (
    <ConfigProvider locale={locale}>
      <CrudModule
        createForm={<SiteTariffForm />}
        updateForm={<SiteTariffForm isUpdateForm={true} />}
        config={config}
      />
    </ConfigProvider>
  );
} 