import React from 'react';
import { Form, Input, Select } from 'antd'; 
import useLanguage from '@/locale/useLanguage';
import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import {DatePicker} from 'antd';
// Formulaire pour ajouter une nouvelle dépense
export default function ExpenseForm({ isUpdateForm = false }) {
  const translate = useLanguage();

 

  return (
    <>
      {/* Champ Nom */}
      <Form.Item
        label="Nom"
        name="name"
        rules={[{ required: true, message: 'Veuillez entrer le nom de la dépense !' }]}
      >
        <Input />
      </Form.Item>

      {/* Champ Catégorie de la dépense */}
      <Form.Item
        label="Catégorie de la dépense"
        name="category"
        rules={[{ required: true, message: 'Veuillez choisir une catégorie de dépense !' }]}
      >
         <AutoCompleteAsync
                      entity={'ExpenseCategory'}
                      displayLabels={['categoryName']}
                      searchFields={'categoryName'}
                      redirectLabel={'Ajouter une nouvelle catégorie de dépenses'}
                      withRedirect
                      urlToRedirect={'/expenseCategory'}
                    />
      </Form.Item>

      {/* Champ Devise */}
      <Form.Item
        label="Devise"
        name="currency"
        initialValue="XAF"
        rules={[{ required: true, message: 'Veuillez choisir une devise !' }]}
      >
        <Select disabled>
          <Select.Option value="XAF">XAF</Select.Option>
        </Select>
      </Form.Item>

      {/* Champ Total */}
      <Form.Item
        label="Total"
        name="total"
        rules={[{ required: true, message: 'Veuillez entrer le montant total !' }]}
      >
        <Input type="number" />
      </Form.Item>

      {/* Champ Description */}
      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: false, message: '' }]}
      >
        <Input.TextArea rows={4} placeholder="Description de la dépense" />
      </Form.Item>

      {/* Champ Référence */}
      <Form.Item
        label="Référence"
        name="reference"
        rules={[{ required: false, message: '' }]}
      >
        <Input />
      </Form.Item>
    
    </>
    
  );
}
