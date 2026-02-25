import CrudModule from '@/modules/CrudModule/CrudModule';
import DynamicForm from '@/forms/DynamicForm';
import { fields } from './config';

import useLanguage from '@/locale/useLanguage';
import { ConfigProvider } from 'antd'; // Importer ConfigProvider
import locale from 'antd/locale/fr_FR';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
dayjs.locale('fr');

export default function Customer() {
  const translate = useLanguage();
  const entity = 'client';
  const searchConfig = {
    displayLabels: ['name'],
    searchFields: 'name',
  };
  const deleteModalLabels = ['name'];

  const Labels = {
    PANEL_TITLE: translate('client'),
    DATATABLE_TITLE: translate('client_list'),
    ADD_NEW_ENTITY: translate('add_new_client'),
    ENTITY_NAME: translate('client'),
  };
  const configPage = {
    entity,
    ...Labels,
  };
  
  const config = {
    ...configPage,
    fields,
    searchConfig,
    deleteModalLabels,
  };
  return (
    <ConfigProvider locale={locale}> {/* Appliquer la locale française ici */}
    <CrudModule
      createForm={<DynamicForm fields={fields} />}
      updateForm={<DynamicForm fields={fields} />}
      config={config}
    />
        </ConfigProvider>

  );
}
