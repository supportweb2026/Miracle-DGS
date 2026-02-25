import React from 'react';
import { Form, Input, Select } from 'antd';  // Ajout de Select ici
import useLanguage from '@/locale/useLanguage';

// Formulaire pour ajouter un nouveau service
export default function ServiceForm({ isUpdateForm = false }) {
  const translate = useLanguage();

  return (
    <>
      {/* Champ Nom du service */}
      <Form.Item
        label="Nom du service"
        name="name"
        rules={[{ required: true, message: 'Veuillez entrer le nom du service !' }]}
      >
        <Input />
      </Form.Item>

      {/* Champ Description du service */}
      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: false, message: '' }]}
      >
        <Input.TextArea rows={4} placeholder="Description du service" />
      </Form.Item>

      {/* Champ Taux journalier */}
      <Form.Item
        label="Tarif journalier"
        name="tauxJournalier"
        rules={[{ required: true, message: 'Veuillez entrer le taux journalier !' }]}
      >
        <Input type="number" />
      </Form.Item>

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
      
    </>
  );
}
