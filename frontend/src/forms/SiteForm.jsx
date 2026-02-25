import React from 'react';
import { Form, Input, InputNumber } from 'antd';
import AutoCompleteAsync from '@/components/AutoCompleteAsync';

export default function SiteForm() {
  return (
    <>
      <Form.Item
        label="Nom du site"
        name="name"
        rules={[{ required: true, message: 'Veuillez entrer le nom du site.' }]}
        style={{ marginBottom: '16px' }}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Client"
        name="client"
        rules={[{ required: true, message: 'Veuillez sélectionner un client.' }]}
        style={{ marginBottom: '16px' }}
      >
        <AutoCompleteAsync
          entity="client"
          displayLabels={['name']}
          searchFields="name"
          placeholder="Sélectionner un client"
          redirectLabel="Ajouter un nouveau client"
          withRedirect
          urlToRedirect="/customer"
        />
      </Form.Item>

      <Form.Item
        label="Adresse"
        name="address"
        rules={[{ required: true, message: "Veuillez entrer l'adresse du site." }]}
        style={{ marginBottom: '16px' }}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Ville"
        name="city"
        rules={[{ required: true, message: 'Veuillez entrer la ville.' }]}
        style={{ marginBottom: '16px' }}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Nombre d'employés"
        name="nombre"
        rules={[{ required: true, message: 'Veuillez entrer le nombre d\'employés.' }]}
        style={{ marginBottom: '16px' }}
        initialValue={0}
      >
        <InputNumber min={0} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item
        label="Pays"
        name="country"
        rules={[{ required: true, message: 'Le pays est requis.' }]}
        style={{ marginBottom: '16px' }}
        initialValue="Gabon"
        >
        <Input value="Gabon" disabled />
      </Form.Item>
    </>
  );
}
