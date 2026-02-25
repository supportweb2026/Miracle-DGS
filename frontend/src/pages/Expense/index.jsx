import React from 'react';
import useLanguage from '@/locale/useLanguage';
import CrudModule from '@/modules/CrudModule/CrudModule';
import ExpensetwoForm from '@/forms/ExpensetwoForm';  
import { ConfigProvider } from 'antd'; // Importer ConfigProvider
import locale from 'antd/locale/fr_FR';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

export default function Expense() {
  const translate = useLanguage();
  const entity = 'expense'; // Changement pour les dépenses

  const searchConfig = {
    displayLabels: ['name', 'category'],  
    searchFields: 'name',  // Recherche par le nom de la dépense
    outputValue: '_id',  // Id à récupérer lors de la recherche
  };

  const deleteModalLabels = ['name'];  // Nom de la dépense dans le modal de suppression

  const readColumns = [
    {
      title: translate('Name'),
      dataIndex: 'name',  // Nom de la dépense

    },
    {
      title: translate('Expense Category'),
      dataIndex: 'category',  // Catégorie de la dépense
      render: (category) => {
        console.log('category reçu dans render:', category);
        return category && typeof category === 'object' ? category.name : 'N/A';
      }
    },
    {
      title: translate('Currency'),
      dataIndex: 'currency',  // Devise de la dépense
    },
    {
      title: translate('Total'),
      dataIndex: 'total',  // Montant total de la dépense
    },
    {
      title: translate('Description'),
      dataIndex: 'description',  // Description de la dépense
    },
    {
      title: translate('Reference'),
      dataIndex: 'reference',  // Référence de la dépense
    },
    {
      title: translate('Date'),
      dataIndex: 'created',  // Référence de la dépense
    },
  ];

  const dataTableColumns = [
    {
      title: translate('Nom'),
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),

    },
    {
      title: 'Catégorie des Dépenses',
      dataIndex: ['category', 'categoryName'],
      render: (text, record) => (
        <span style={{ color: record.category && record.category.categoryColor ? record.category.categoryColor : 'black' }}>
          {record.category && record.category.categoryName ? record.category.categoryName : 'N/A'}
        </span>
      ),

    },
   
    {
      title: translate('Total'),
      dataIndex: 'total',
      sorter: (a, b) => a.total - b.total,

    },
    {
      title: translate('Devise'),
      dataIndex: 'currency',
      sorter: (a, b) => a.currency.localeCompare(b.currency),
    },
    {
      title: translate('Description'),
      dataIndex: 'description',
      sorter: (a, b) => a.description.localeCompare(b.description),

    },
    {
      title: translate('Référence'),
      dataIndex: 'reference',
      sorter: (a, b) => a.reference.localeCompare(b.reference),
    },
    {
      title: translate('Date'), 
      dataIndex: 'created',  
      render: (created) => dayjs(created).format('DD/MM/YYYY'), 
      sorter: (a, b) => new Date(a.created) - new Date(b.created), 
    },
  ];

  const Labels = {
    PANEL_TITLE: translate('expenses'),  // Le titre du panneau pour "Dépenses"
    DATATABLE_TITLE: 'Liste des Dépenses',  // Titre du tableau des dépenses
    ADD_NEW_ENTITY: 'Ajouter une nouvelle dépense',  // Libellé pour ajouter une nouvelle dépense
    ENTITY_NAME: translate('expense'),  // Nom de l'entité "Dépense"
  };

  const configPage = {
    entity,
    ...Labels,
  };

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
      createForm={<ExpensetwoForm />}  // Formulaire pour créer une dépense
      updateForm={<ExpensetwoForm isUpdateForm={true} />}  // Formulaire pour mettre à jour une dépense
      config={config}
    />
      </ConfigProvider>

  );
}
