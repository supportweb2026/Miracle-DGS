import React from 'react';
import { Form, InputNumber, Switch } from 'antd';
import useLanguage from '@/locale/useLanguage';
import AutoCompleteAsync from '@/components/AutoCompleteAsync';

export default function SiteTariffForm({ isUpdateForm = false }) {
  const translate = useLanguage();

  return (
    <>
      {/* Sélection du site avec AutoCompleteAsync */}
      <Form.Item
        label="Site"
        name="site"
        rules={[{ required: true, message: 'Veuillez sélectionner un site!' }]}
      >
        <AutoCompleteAsync
          entity="site"
          displayLabels={['name']}
          searchFields="name"
          redirectLabel="Ajouter un nouveau site"
          withRedirect
          urlToRedirect="/site"
        />
      </Form.Item>

      {/* Sélection de la prestation avec AutoCompleteAsync */}
      <Form.Item
        label="Prestation"
        name="prestation"
        rules={[{ required: true, message: 'Veuillez sélectionner une prestation!' }]}
      >
        <AutoCompleteAsync
          entity="prestation"
          displayLabels={['name']}
          searchFields="name"
          redirectLabel="Ajouter une nouvelle prestation"
          withRedirect
          urlToRedirect="/prestation"
        />
      </Form.Item>

      {/* Option pour utiliser des valeurs spécifiques */}
      <Form.Item
        label="Utiliser des valeurs spécifiques"
        name="useCustomValues"
        valuePropName="checked"
        initialValue={false}
      >
        <Switch />
      </Form.Item>

      {/* Champs pour les valeurs spécifiques */}
      <Form.Item
        noStyle
        shouldUpdate={(prevValues, currentValues) => 
          prevValues.useCustomValues !== currentValues.useCustomValues
        }
      >
        {({ getFieldValue }) => {
          const useCustomValues = getFieldValue('useCustomValues');
          
          if (useCustomValues) {
            return (
              <>
                {/* Durée spécifique */}
                <Form.Item
                  label="Durée spécifique (heures)"
                  name="customDuration"
                  rules={[{ required: true, message: 'Veuillez entrer la durée!' }]}
                >
                  <InputNumber min={1} max={24} style={{ width: '100%' }} />
                </Form.Item>

                {/* Tarif horaire spécifique */}
                <Form.Item
                  label="Tarif horaire spécifique (XAF)"
                  name="customHourlyRate"
                  rules={[{ required: true, message: 'Veuillez entrer le tarif horaire!' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value} XAF`}
                    parser={(value) => value.replace(' XAF', '')}
                  />
                </Form.Item>

                {/* Tarif journalier spécifique */}
                <Form.Item
                  label="Tarif journalier spécifique (XAF)"
                  name="customDailyRate"
                  rules={[{ required: true, message: 'Veuillez entrer le tarif journalier!' }]}
                >
                  <InputNumber
                    min={0}
                    style={{ width: '100%' }}
                    formatter={(value) => `${value} XAF`}
                    parser={(value) => value.replace(' XAF', '')}
                  />
                </Form.Item>
              </>
            );
          }
          return null;
        }}
      </Form.Item>
    </>
  );
} 