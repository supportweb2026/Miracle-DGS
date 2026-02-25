import React, { useState, useEffect } from 'react';
import { Form, Select, DatePicker, Button, Card, Row, Col, Input, InputNumber, Table } from 'antd';
import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import SelectAsync from '@/components/SelectAsync';
import { useSelector } from 'react-redux';
import { selectFinanceSettings } from '@/redux/settings/selectors';

const { Option } = Select;
const { TextArea } = Input;

export default function QuoteCreate() {
  const [form] = Form.useForm();
  const translate = useLanguage();
  const navigate = useNavigate();
  
  const { last_quote_number } = useSelector(selectFinanceSettings);
  const [lastNumber, setLastNumber] = useState(() => Number(last_quote_number) + Number(1));
  const [taxRate, setTaxRate] = useState(0);
  const [prestations, setPrestations] = useState([]);
  const [selectedPrestations, setSelectedPrestations] = useState([]);
  const [selectedPrestation, setSelectedPrestation] = useState(null);
  const [numberOfAgents, setNumberOfAgents] = useState('');
  const [numberOfDays, setNumberOfDays] = useState('');
  const [taxes, setTaxes] = useState([]);

  useEffect(() => {
    if (last_quote_number !== undefined && last_quote_number !== null) {
      setLastNumber(Number(last_quote_number) + Number(1));
      form.setFieldsValue({ 
        number: Number(last_quote_number) + Number(1),
        date: dayjs(),
        expiredDate: dayjs().add(30, 'days')
      });
    }
  }, [last_quote_number, form]);

  // Plus besoin de charger la liste des prospects - c'est un champ texte libre

  // Charger la liste des prestations
  useEffect(() => {
    const loadPrestations = async () => {
      try {
        const response = await request.list({ entity: 'prestation' });
        if (response.success) {
          setPrestations(response.result);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des prestations:', error);
      }
    };
    loadPrestations();
  }, []);

  const handleNumberChange = (value) => {
    setLastNumber(value);
    form.setFieldsValue({ number: value });
  };

  const handleTaxChange = (value) => {
    setTaxRate(value);
    form.setFieldsValue({ taxRate: value });
    
    // Trouver le nom de la taxe correspondante
    const selectedTax = taxes.find(tax => tax.taxValue === value);
    if (selectedTax) {
      form.setFieldsValue({ taxName: selectedTax.taxName });
    }
  };

  const handlePrestationChange = (prestationId) => {
    const prestation = prestations.find(p => p._id === prestationId);
    if (prestation) {
      setSelectedPrestation(prestation);
    }
  };

  const handlePrestationUpdate = (index, field, value) => {
    console.log('🔧 handlePrestationUpdate - index:', index, 'field:', field, 'value:', value);
    console.log('🔧 handlePrestationUpdate - value type:', typeof value);
    console.log('🔧 handlePrestationUpdate - selectedPrestations before:', selectedPrestations);
    
    const updatedPrestations = [...selectedPrestations];
    updatedPrestations[index] = {
      ...updatedPrestations[index],
      [field]: value
    };

    console.log('🔧 handlePrestationUpdate - prestation after update:', updatedPrestations[index]);

    // Recalculer le total : dailyRate * numberOfDays (de la prestation) * numberOfAgents
    const agentsCount = updatedPrestations[index].numberOfAgents || 1;
    const daysCount = updatedPrestations[index].numberOfDays || 1;
    const dailyRate = updatedPrestations[index].dailyRate || 0;
    
    console.log('🔧 handlePrestationUpdate - calcul:', {
      dailyRate,
      daysCount,
      agentsCount,
      total: dailyRate * daysCount * agentsCount
    });
    
    updatedPrestations[index].total = dailyRate * daysCount * agentsCount;

    console.log('🔧 handlePrestationUpdate - updatedPrestations after:', updatedPrestations);
    setSelectedPrestations(updatedPrestations);
  };

  const removePrestation = (index) => {
    console.log('🗑️ removePrestation - index:', index);
    const filteredPrestations = selectedPrestations.filter((_, i) => i !== index);
    console.log('🗑️ removePrestation - filteredPrestations:', filteredPrestations);
    setSelectedPrestations(filteredPrestations);
  };

  const onFinish = async (values) => {
    try {
      console.log('🚀 onFinish - Form values:', values);
      console.log('🚀 onFinish - Selected prestations:', selectedPrestations);
      console.log('🚀 onFinish - taxRate:', taxRate);

      // Vérifier si des prestations ont été sélectionnées
      if (!selectedPrestations || selectedPrestations.length === 0) {
        console.error('❌ Aucune prestation sélectionnée');
        return;
      }

      const quoteData = {
        number: values.number || lastNumber,
        year: dayjs().year(),
        date: dayjs().format('YYYY-MM-DD'),
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        expiredDate: values.expiredDate.format('YYYY-MM-DD'),
        prospect: values.prospect,
        taxRate: taxRate,
        currency: 'XAF',
        status: values.status,
        services: selectedPrestations.map((prestation, index) => {
          console.log(`📤 Service ${index} envoyé:`, {
            name: prestation.name,
            numberOfAgents: prestation.numberOfAgents,
            numberOfDays: prestation.numberOfDays,
            dailyRate: prestation.dailyRate,
            total: prestation.total
          });
          return {
            name: prestation.name,
            numberOfAgents: prestation.numberOfAgents,
            numberOfDays: prestation.numberOfDays, // Chaque prestation a ses propres jours
            dailyRate: prestation.dailyRate,
            total: prestation.total,
            startDate: values.startDate.format('YYYY-MM-DD'),
            endDate: values.endDate.format('YYYY-MM-DD')
          };
        }),
        notes: values.notes
      };

      console.log('📤 Quote data to be sent:', quoteData);

      const response = await request.create({
        entity: 'quote',
        jsonData: quoteData
      });

      console.log('📥 Server response:', response);

      if (response.success) {
        navigate(`/quote/read/${response.result._id}`);
      } else {
        console.error('Error creating quote:', response.message);
      }
    } catch (error) {
      console.error('Erreur lors de la création du devis:', error);
    }
  };

  const columns = [
    {
      title: translate('Prestation'),
      dataIndex: 'name',
      key: 'name',
      render: (name) => name
    },
    {
      title: translate('Nombre d\'agents'),
      dataIndex: 'numberOfAgents',
      key: 'numberOfAgents',
      render: (_, record, index) => (
        <Input
          type="number"
          min={1}
          value={record.numberOfAgents}
          onChange={(e) => handlePrestationUpdate(index, 'numberOfAgents', parseInt(e.target.value))}
        />
      )
    },
    {
      title: translate('Nombre de jours'),
      dataIndex: 'numberOfDays',
      key: 'numberOfDays',
      render: (_, record, index) => (
        <Input
          type="number"
          min={1}
          value={record.numberOfDays}
          onChange={(e) => handlePrestationUpdate(index, 'numberOfDays', parseInt(e.target.value))}
        />
      )
    },
    {
      title: translate('Tarif journalier'),
      dataIndex: 'dailyRate',
      key: 'dailyRate',
      render: (_, record, index) => (
        <Input
          type="number"
          min={0}
          value={record.dailyRate}
          onChange={(e) => handlePrestationUpdate(index, 'dailyRate', parseInt(e.target.value))}
        />
      )
    },
    {
      title: translate('Total'),
      dataIndex: 'total',
      key: 'total',
      render: (total) => `${total.toLocaleString()} XAF`
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_, __, index) => (
        <Button type="link" danger onClick={() => removePrestation(index)}>
          {translate('Supprimer')}
        </Button>
      )
    }
  ];

  return (
    <Card title={translate('Créer un devis')}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Form.Item
              name="number"
              label={translate('Numéro de devis')}
              rules={[
                { required: true, message: 'Veuillez saisir le numéro de devis' },
                { type: 'number', min: 1, message: 'Le numéro doit être supérieur à 0' }
              ]}
              initialValue={lastNumber}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={1}
                placeholder="Ex: 1, 2, 3..."
                onChange={handleNumberChange}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="date"
              label={translate('Date de création')}
              rules={[{ required: true, type: 'object' }]}
            >
              <DatePicker style={{ width: '100%' }} disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="status"
              label={translate('Statut')}
              initialValue="draft"
              rules={[{ required: true, message: translate('Veuillez sélectionner un statut') }]}
            >
              <Select>
                <Option value="draft">{translate('Brouillon')}</Option>
                <Option value="pending">{translate('En attente')}</Option>
                <Option value="sent">{translate('Envoyé')}</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Form.Item
              name="startDate"
              label={translate('Date de début')}
              rules={[{ required: true, message: 'Veuillez sélectionner une date de début' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="endDate"
              label={translate('Date de fin')}
              rules={[{ required: true, message: 'Veuillez sélectionner une date de fin' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="expiredDate"
              label={translate('Date d\'expiration')}
              rules={[{ required: true, message: 'Veuillez sélectionner une date d\'expiration' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Form.Item
              name="prospect"
              label={translate('Prospect')}
              rules={[{ required: true, message: 'Veuillez saisir le nom du prospect' }]}
            >
              <Input placeholder="Nom du prospect" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="prospectAddress"
              label="Adresse Prospect"
              rules={[{ required: false }]}
            >
              <Input placeholder="Adresse du prospect" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="prospectPhone"
              label="Téléphone Prospect"
              rules={[{ required: false }]}
            >
              <Input placeholder="Téléphone du prospect" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              label={translate('Ajouter une prestation')}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Select
                    placeholder="Sélectionner une prestation"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    onChange={handlePrestationChange}
                    style={{ width: '100%' }}
                  >
                    {prestations.map(prestation => (
                      <Option key={prestation._id} value={prestation._id}>
                        {prestation.name} - {prestation.baseDailyRate.toLocaleString()} XAF/jour
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={4}>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Nombre d'agents"
                    value={numberOfAgents}
                    onChange={(e) => setNumberOfAgents(parseInt(e.target.value) || 1)}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={4}>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Nombre de jours"
                    value={numberOfDays}
                    onChange={(e) => setNumberOfDays(parseInt(e.target.value) || 1)}
                    style={{ width: '100%' }}
                  />
                </Col>
                <Col span={4}>
                  <Button 
                    type="primary" 
                    onClick={() => {
                      if (selectedPrestation) {
                        const agents = numberOfAgents || 1;
                        const days = numberOfDays || 1;
                        console.log('➕ Ajout prestation - agents:', agents, 'days:', days);
                        console.log('➕ Ajout prestation - selectedPrestation:', selectedPrestation);
                        
                        const newPrestation = {
                          name: selectedPrestation.name,
                          numberOfAgents: agents,
                          numberOfDays: days,
                          dailyRate: selectedPrestation.baseDailyRate,
                          total: selectedPrestation.baseDailyRate * days * agents
                        };
                        
                        console.log('➕ Ajout prestation - newPrestation:', newPrestation);
                        console.log('➕ Ajout prestation - total calculé:', selectedPrestation.baseDailyRate * days * agents);
                        
                        setSelectedPrestations([...selectedPrestations, newPrestation]);
                        setSelectedPrestation(null);
                        setNumberOfAgents('');
                        setNumberOfDays('');
                      }
                    }}
                    style={{ width: '100%' }}
                  >
                    {translate('Ajouter')}
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Table
              columns={columns}
              dataSource={selectedPrestations}
              rowKey={(record, index) => index}
              pagination={false}
            />
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="taxRate"
              label={translate('Taxe')}
              rules={[{ required: true, message: translate('Veuillez sélectionner une taxe') }]}
            >
              <SelectAsync
                value={taxRate}
                onChange={handleTaxChange}
                entity={'taxes'}
                outputValue={'taxValue'}
                displayLabels={['taxName']}
                withRedirect={true}
                urlToRedirect="/taxes"
                redirectLabel={translate('Add New Tax')}
                placeholder={translate('Select Tax Value')}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              name="notes"
              label={translate('Notes')}
            >
              <TextArea rows={4} />
            </Form.Item>
          </Col>
        </Row>

        <Row>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit">
              {translate('Créer le devis')}
            </Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
