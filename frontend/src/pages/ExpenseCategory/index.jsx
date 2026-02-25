import React from 'react';
import useLanguage from '@/locale/useLanguage';
import { Switch } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import CrudModule from '@/modules/CrudModule/CrudModule';
import ExpenseForm from '@/forms/ExpenseForm';  // Utilisation de ExpenseForm ici

export default function ExpenseCategory() {
  const translate = useLanguage();
  const entity = 'expenseCategory';
  
  const searchConfig = {
    displayLabels: ['categoryName'],
    searchFields: 'categoryName',
    outputValue: '_id',
  };

  const deleteModalLabels = ['categoryName'];

  const readColumns = [
    {
      title: translate('Name'),
      dataIndex: 'categoryName',
    },
    {
      title: translate('Description'),
      dataIndex: 'categoryDescription',
    },
    {
      title: translate('Color'),
      dataIndex: 'categoryColor',
      render: (_, record) => {
        if (!record || !record.categoryColor) return <span>N/A</span>;
        return <span style={{ color: record.categoryColor }}>{record.categoryColor}</span>;
      },
    },
    
  ];

  const dataTableColumns = [
    {
      title: translate('Nom'),
      dataIndex: 'categoryName',
    },
    {
      title: translate('Description'),
      dataIndex: 'categoryDescription',
    },
    {
      title: translate('Color'),
      dataIndex: 'categoryColor',
      render: (_, record) => {
        if (!record || !record.categoryColor) return <span>N/A</span>;
        return <span style={{ color: record.categoryColor }}>{record.categoryColor}</span>;
      },
    },
    
	
  ];

  const Labels = {
    PANEL_TITLE: 'Catégorie de dépenses',
    DATATABLE_TITLE: 'Liste des Catégories de dépenses',
    ADD_NEW_ENTITY: 'Ajouter une nouvelle catégorie',
    ENTITY_NAME: translate('expenses_category'),
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
    <CrudModule
      createForm={<ExpenseForm />}   
      updateForm={<ExpenseForm isUpdateForm={true} />}
      config={config}
    />
  );
}
