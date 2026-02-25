import React from 'react';
import useLanguage from '@/locale/useLanguage';
import UpdateContractModule from '@/modules/ContractModule/UpdateContractModule';

export default function ContractUpdate() {
  const entity = 'contract';
  const translate = useLanguage();
  const Labels = {
    PANEL_TITLE: translate('Modifier le contrat'),
    DATATABLE_TITLE: translate('Modification du contrat'),
    ADD_NEW_ENTITY: translate('Ajouter un nouveau contrat'),
    ENTITY_NAME: translate('contract'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  
  console.log('=== CONTRACT UPDATE PAGE ===');
  console.log('Entity:', entity);
  console.log('Config:', configPage);
  
  return <UpdateContractModule config={configPage} />;
} 