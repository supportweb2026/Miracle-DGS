import React from 'react';
import useLanguage from '@/locale/useLanguage';
import ReadContractModule from '@/modules/ContractModule/ReadContractModule';

export default function ContractRead() {
  const entity = 'contract';
  const translate = useLanguage();
  const Labels = {
    PANEL_TITLE: translate('Contrat'),
    DATATABLE_TITLE: translate('Détails du contrat'),
    ADD_NEW_ENTITY: translate('Ajouter un nouveau contrat'),
    ENTITY_NAME: translate('contract'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  
  console.log('=== CONTRACT READ PAGE ===');
  console.log('Entity:', entity);
  console.log('Config:', configPage);
  
  return <ReadContractModule config={configPage} />;
} 