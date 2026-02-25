import React from 'react';
import useLanguage from '@/locale/useLanguage';
import ContractDataTableModule from '@/modules/ContractModule/ContractDataTableModule';
import { ConfigProvider } from 'antd';
import { selectCurrentItem } from '@/redux/erp/selectors';
import { useSelector } from 'react-redux';
import locale from 'antd/locale/fr_FR';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

export default function Contract() {
  const translate = useLanguage();
  const entity = 'contract'; // Entité pour le contrat
  const { result: currentErp } = useSelector(selectCurrentItem);
  console.log('CONTRACT - Current ERP Data:', JSON.stringify(currentErp, null, 2));

  // Configuration de la recherche
  const searchConfig = {
    displayLabels: ['name', 'client'],  
    searchFields: 'name',  // Recherche par le nom de la dépense
    outputValue: '_id',  // Id à récupérer lors de la recherche
  };

  // Labels pour les modaux de suppression
  const deleteModalLabels = ['number', 'client.name'];

  // Fonctions utilitaires pour gérer les deux modes de prestation
  const getSiteName = (service) => {
    if (service?.prestationType === 'site_specific' && service?.siteTariffId?.site?.name) {
      return service.siteTariffId.site.name;
    } else if (service?.prestationType === 'classic' && service?.site?.name) {
      return service.site.name;
    }
    return 'N/A';
  };

  const getPrestationName = (service) => {
    if (service?.prestationType === 'site_specific' && service?.siteTariffId?.prestation?.name) {
      return service.siteTariffId.prestation.name;
    } else if (service?.prestationType === 'classic' && service?.prestationId?.name) {
      return service.prestationId.name;
    }
    return 'N/A';
  };

  // Colonnes pour afficher les contrats dans le tableau de lecture
  const readColumns = [
    {
      title: translate('Client'),
      dataIndex: 'client',
      key: 'client',
      render: (client) => {
        console.log('DETAIL - Client reçu:', client);
        return client && typeof client === 'object' ? client.name : 'N/A';
      }
    },
    {
      title: translate('Site'),
      dataIndex: 'services',
      key: 'site',
      render: (services, record) => {
        console.log('DETAIL - Services pour Site (RAW):', services);
        console.log('DETAIL - Record complet pour Site (RAW):', record);
        
        // Parse services if it's a string
        let parsedServices = services;
        if (typeof services === 'string') {
          try {
            parsedServices = JSON.parse(services);
          } catch (e) {
            console.error('Error parsing services:', e);
            return 'N/A';
          }
        }

        if (!parsedServices || !Array.isArray(parsedServices) || parsedServices.length === 0) {
          console.log('DETAIL - Services invalides pour Site');
          return 'N/A';
        }

        const siteNames = parsedServices.map((service, index) => {
          console.log('DETAIL - Service individuel pour Site:', service);
          return getSiteName(service);
        });

        const filteredNames = siteNames.filter(name => name !== 'N/A');
        return filteredNames.join(', ') || 'N/A';
      }
    },
    {
      title: translate('Prestation'),
      dataIndex: 'services',
      key: 'prestation',
      render: (services, record) => {
        console.log('DETAIL - Services pour Prestation (RAW):', services);
        console.log('DETAIL - Record complet pour Prestation (RAW):', record);
        
        // Parse services if it's a string
        let parsedServices = services;
        if (typeof services === 'string') {
          try {
            parsedServices = JSON.parse(services);
          } catch (e) {
            console.error('Error parsing services:', e);
            return 'N/A';
          }
        }

        if (!parsedServices || !Array.isArray(parsedServices) || parsedServices.length === 0) {
          console.log('DETAIL - Services invalides pour Prestation');
          return 'N/A';
        }

        const prestationNames = parsedServices.map((service, index) => {
          console.log('DETAIL - Service individuel pour Prestation:', service);
          return getPrestationName(service);
        });

        const filteredNames = prestationNames.filter(name => name !== 'N/A');
        return filteredNames.join(', ') || 'N/A';
      }
    },
    {
      title: translate('Nombre d\'agents'),
      dataIndex: 'services',
      key: 'numberOfAgents',
      render: (services, record) => {
        console.log('DETAIL - Services pour Nombre d\'agents (RAW):', services);
        console.log('DETAIL - Record complet pour Nombre d\'agents (RAW):', record);
        
        // Parse services if it's a string
        let parsedServices = services;
        if (typeof services === 'string') {
          try {
            parsedServices = JSON.parse(services);
          } catch (e) {
            console.error('Error parsing services:', e);
            return 'N/A';
          }
        }

        if (!parsedServices || !Array.isArray(parsedServices) || parsedServices.length === 0) {
          console.log('DETAIL - Services invalides pour Nombre d\'agents');
          return 'N/A';
        }

        const agentNumbers = parsedServices.map((service, index) => {
          console.log('DETAIL - Service individuel pour Nombre d\'agents:', service);
          return service?.numberOfAgents || 'N/A';
        });

        const filteredNumbers = agentNumbers.filter(num => num !== 'N/A');
        return filteredNumbers.join(', ') || 'N/A';
      }
    },
    {
      title: translate('Date début'),
      dataIndex: 'startDate',
      key: 'startDate',
      render: (startDate) => startDate ? dayjs(startDate).add(2, 'hours').format('DD/MM/YYYY') : 'N/A'
    },
    {
      title: translate('Date fin'),
      dataIndex: 'endDate',
      key: 'endDate', 
      render: (endDate) => endDate ? dayjs(endDate).add(2, 'hours').format('DD/MM/YYYY') : 'N/A'
    },
    {
      title: translate('Statut'),
      dataIndex: 'status',
      key: 'status'
    },
    {
      title: translate('Siret'),
      dataIndex: 'siret',
      key: 'siret'
    },
    {
      title: translate('Nom du représentant'),
      dataIndex: 'representativeName',
      key: 'representativeName'
    },
    {
      title: translate('Mode de paiement'),
      dataIndex: 'paymentMode',
      key: 'paymentMode',
      render: (paymentMode) => {
        return paymentMode && typeof paymentMode === 'object' ? paymentMode.name : 'N/A';
      }
    },
    {
      title: translate('RIB'),
      dataIndex: 'rib',
      key: 'rib',
      render: (rib, record) => {
        if (!record?.paymentMode?.name) return 'N/A';
        return record.paymentMode.name === 'Virement bancaire' ? (rib || 'N/A') : 'N/A';
      }
    },
    {
      title: translate('Banque'),
      dataIndex: 'banque',
      key: 'banque',
      render: (banque, record) => {
        if (!record?.paymentMode?.name) return 'N/A';
        return record.paymentMode.name === 'Virement bancaire' ? (banque || 'N/A') : 'N/A';
      }
    }
  ];

  // Colonnes pour le tableau de données avec possibilité de tri
  const dataTableColumns = [
    {
      title: translate('N°'),
      dataIndex: 'number',
      sorter: (a, b) => (a.number || 0) - (b.number || 0),
    },
    {
      title: translate('Client'),
      dataIndex: ['client', 'name'],
      render: (text, record) => (
        <span>{record.client?.name || 'Nom du client non défini'}</span>
      ),
      sorter: (a, b) => {
        const nameA = a.client?.name?.toLowerCase() || '';
        const nameB = b.client?.name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      },
    },
    {
      title: translate('Site'),
      dataIndex: 'services',
      render: (services) => {
        if (!services || !Array.isArray(services)) return 'N/A';
        return services.map(service => getSiteName(service)).join(', ');
      },
      sorter: (a, b) => {
        const siteA = getSiteName(a.services?.[0] || {}).toLowerCase();
        const siteB = getSiteName(b.services?.[0] || {}).toLowerCase();
        return siteA.localeCompare(siteB);
      },
    },
    {
      title: translate('Prestation'),
      dataIndex: 'services',
      render: (services) => {
        if (!services || !Array.isArray(services)) return 'N/A';
        return services.map(service => getPrestationName(service)).join(', ');
      },
      sorter: (a, b) => {
        const prestA = getPrestationName(a.services?.[0] || {}).toLowerCase();
        const prestB = getPrestationName(b.services?.[0] || {}).toLowerCase();
        return prestA.localeCompare(prestB);
      },
    },
    {
      title: translate('Date de début'),
      dataIndex: 'startDate',
      render: (startDate) => dayjs(startDate).add(2, 'hours').format('DD/MM/YYYY'),
      sorter: (a, b) => new Date(a.startDate) - new Date(b.startDate),
    },
    {
      title: translate('Date de fin'),
      dataIndex: 'endDate',
      render: (endDate) => dayjs(endDate).add(2, 'hours').format('DD/MM/YYYY'),
      sorter: (a, b) => new Date(a.endDate) - new Date(b.endDate),
    },
    {
      title: translate('Statut'),
      dataIndex: 'status',
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
  ];

  // Labels pour le titre et le libellé de l'entité "Contrats"
  const Labels = {
    PANEL_TITLE: translate('Contrats'),  // Titre du panneau pour "Contrats"
    DATATABLE_TITLE: 'Liste des Contrats',  // Titre du tableau des contrats
    ADD_NEW_ENTITY: 'Ajouter un nouveau contrat',  // Libellé pour ajouter un nouveau contrat
    ENTITY_NAME: translate('contract'),  // Nom de l'entité "Contrat"
  };

  // Configuration globale de la page
  const configPage = {
    entity,
    ...Labels,
  };

  // Configuration globale des données et des colonnes
  const config = {
    ...configPage,
    readColumns,
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
  };

  // Rendu du composant principal
  return (
    <ConfigProvider locale={locale}>
      <ContractDataTableModule config={config} />
    </ConfigProvider>
  );
  
}
