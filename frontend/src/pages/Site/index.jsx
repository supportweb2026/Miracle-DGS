import React from 'react';
import useLanguage from '@/locale/useLanguage';  // Importer la fonction de traduction
import CrudModule from '@/modules/CrudModule/CrudModule';  // Importer le module CRUD
import { ConfigProvider } from 'antd';  // Importer ConfigProvider d'Ant Design
import locale from 'antd/locale/fr_FR';  // Locale française
import SiteForm from '@/forms/SiteForm';  // Formulaire pour ajouter/modifier un site

export default function Site() {
  const translate = useLanguage();
  const entity = 'site';  // Entité "site"

  // Configuration pour la recherche
  const searchConfig = {
    displayLabels: ['name', 'client.name'],
    searchFields: 'name,client.name',
    outputValue: '_id',
  };

  // Labels pour la modal de suppression
  const deleteModalLabels = ['name'];  // Affiche le nom du site dans la modal de suppression

  // Fonction de rendu simple pour afficher les informations
  const renderInfo = (value) => {
    if (!value) return '-';
    return value;
  };

  // Fonction de rendu pour le nombre d'employés
  const renderNombreEmployes = (value) => {
    if (!value || value === 0) return '0';
    return value.toString();
  };

  // Fonction de rendu pour le client
  const renderClient = (client) => {
    if (!client || typeof client !== 'object') return '-';
    return client.name || '-';
  };

  // Colonnes de lecture (détail des sites)
  const readColumns = [
    {
      title: translate('Nom du site'),
      dataIndex: 'name',  // Nom du site
    },
    {
      title: translate('Client'),
      dataIndex: 'client',
      render: renderClient,  // Client du site
    },
    {
      title: translate('Adresse'),
      dataIndex: 'address',
      render: renderInfo,  // Adresse du site
    },
    {
      title: translate('Ville'),
      dataIndex: 'city',
      render: renderInfo,  // Ville du site
    },
    {
      title: translate('Pays'),
      dataIndex: 'country',
      render: renderInfo,  // Pays du site
    },
    {
      title: "Nombre d'employés",
      dataIndex: 'nombre',
      render: renderNombreEmployes,  // Nombre d'employés
    },
  ];

  // Colonnes principales pour afficher les sites
  const dataTableColumns = [
    {
      title: translate('Nom du site'),
      dataIndex: 'name',
      sorter: (a, b) => (a?.name || '').localeCompare(b?.name || ''),
    },
    {
      title: translate('Client'),
      dataIndex: 'client',
      sorter: (a, b) => {
        const clientA = a?.client?.name || '';
        const clientB = b?.client?.name || '';
        return clientA.localeCompare(clientB);
      },
      render: renderClient,
    },
    {
      title: translate('Adresse'),
      dataIndex: 'address',
      sorter: (a, b) => (a?.address || '').localeCompare(b?.address || ''),
      render: renderInfo,
    },
    {
      title: translate('Ville'),
      dataIndex: 'city',
      sorter: (a, b) => (a?.city || '').localeCompare(b?.city || ''),
      render: renderInfo,
    },
    {
      title: translate('Pays'),
      dataIndex: 'country',
      sorter: (a, b) => (a?.country || '').localeCompare(b?.country || ''),
      render: renderInfo,
    },
    {
      title: "Nombre d'employés",
      dataIndex: 'nombre',
      sorter: (a, b) => (a?.nombre || 0) - (b?.nombre || 0),
      render: renderNombreEmployes,
    },
  ];

  // Labels pour l'interface utilisateur
  const Labels = {
    PANEL_TITLE: translate('sites'),  // Titre du panneau pour "Sites"
    DATATABLE_TITLE: 'Liste des sites',  // Liste des sites
    ADD_NEW_ENTITY: 'Ajouter un site',  // Libellé pour ajouter un site
    ENTITY_NAME: translate('Site'),  // Nom de l'entité "Site"
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
        createForm={<SiteForm />}  // Formulaire pour créer un site
        updateForm={<SiteForm isUpdateForm={true} />}  // Formulaire pour mettre à jour un site
        config={config}
      />
    </ConfigProvider>
  );
}
