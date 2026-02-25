import React from 'react';
import { Form, Input, InputNumber } from 'antd';
import useLanguage from '@/locale/useLanguage';

// Formulaire pour ajouter ou modifier une prestation
export default function PrestationForm({ isUpdateForm = false }) {
  const translate = useLanguage();

  return (
    <>
      {/* Champ Nom de la prestation */}
      <Form.Item
        label="Nom de la prestation"
        name="name"
        rules={[{ required: true, message: 'Veuillez entrer le nom de la prestation !' }]}
      >
        <Input />
      </Form.Item>

      {/* Champ Description */}
      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: true, message: 'Veuillez entrer une description !' }]}
      >
        <Input.TextArea rows={4} />
      </Form.Item>

      {/* Champ Durée de base */}
      <Form.Item
        label="Durée de base (en heures)"
        name="baseDuration"
        rules={[{ required: true, message: 'Veuillez entrer la durée de base !' }]}
      >
        <InputNumber min={1} max={24} style={{ width: '100%' }} />
      </Form.Item>

      {/* Champ Tarif horaire */}
      <Form.Item
        label="Tarif horaire (XAF)"
        name="baseHourlyRate"
        rules={[{ required: true, message: 'Veuillez entrer le tarif horaire !' }]}
      >
        <InputNumber
          min={0}
          style={{ width: '100%' }}
          formatter={(value) => `${value} XAF`}
          parser={(value) => value.replace(' XAF', '')}
        />
      </Form.Item>

      {/* Champ Tarif journalier */}
      <Form.Item
        label="Tarif journalier (XAF)"
        name="baseDailyRate"
        rules={[{ required: true, message: 'Veuillez entrer le tarif journalier !' }]}
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
