import React from 'react';
import useLanguage from '@/locale/useLanguage';
import CrudModule from '@/modules/CrudModule/CrudModule';
import { ConfigProvider } from 'antd';  // Importer ConfigProvider
import locale from 'antd/locale/fr_FR';  // Locale française
import PrestationForm from '@/forms/PrestationForm';  // Importer le formulaire de prestation

export default function Prestation() {
  const translate = useLanguage();
  const entity = 'prestation'; // L'entité est maintenant "prestation"

  // Configuration pour la recherche
  const searchConfig = {
    displayLabels: ['name'],
    searchFields: 'name',
    outputValue: '_id',
  };

  // Labels pour la modal de suppression
  const deleteModalLabels = ['name'];  // Affiche le nom de la prestation dans la modal de suppression

  // Fonction de rendu simple pour les montants
  const renderAmount = (value) => {
    if (!value) return '-';
    return value;
  };

  // Colonnes de lecture (détail des prestations)
  const readColumns = [
    {
      title: translate('Nom'),
      dataIndex: 'name',  // Nom de la prestation
    },
    {
      title: translate('Description'),
      dataIndex: 'description',  // Description de la prestation
    },
    {
      title: translate('Durée de base'),
      dataIndex: 'baseDuration',
      render: (value) => value ? `${value} heures` : '-',
    },
    {
      title: translate('Tarif horaire'),
      dataIndex: 'baseHourlyRate',
      render: renderAmount,
    },
    {
      title: translate('Tarif journalier'),
      dataIndex: 'baseDailyRate',
      render: renderAmount,
    },
  ];

  // Colonnes principales pour afficher les prestations
  const dataTableColumns = [
    {
      title: translate('Nom'),
      dataIndex: 'name',
      sorter: (a, b) => (a?.name || '').localeCompare(b?.name || ''),
    },
   
    {
      title: translate('Durée de base'),
      dataIndex: 'baseDuration',
      sorter: (a, b) => (a?.baseDuration || 0) - (b?.baseDuration || 0),
      render: (value) => value ? `${value} heures` : '-',
    },
    {
      title: translate('Tarif horaire'),
      dataIndex: 'baseHourlyRate',
      sorter: (a, b) => (a?.baseHourlyRate || 0) - (b?.baseHourlyRate || 0),
      render: renderAmount,
    },
    {
      title: translate('Tarif journalier'),
      dataIndex: 'baseDailyRate',
      sorter: (a, b) => (a?.baseDailyRate || 0) - (b?.baseDailyRate || 0),
      render: renderAmount,
    },
  ];

  // Labels pour l'interface utilisateur
  const Labels = {
    PANEL_TITLE: translate('prestations'),  // Titre du panneau pour "Prestations"
    DATATABLE_TITLE: 'Liste des prestations',  // Liste des prestations
    ADD_NEW_ENTITY: 'Ajouter une prestation',  // Libellé pour ajouter une prestation
    ENTITY_NAME: translate('Prestation'),  // Nom de l'entité "Prestation"
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
        createForm={<PrestationForm />}  // Formulaire pour créer une prestation
        updateForm={<PrestationForm isUpdateForm={true} />}  // Formulaire pour mettre à jour une prestation
        config={config}
      />
    </ConfigProvider>
  );
}
