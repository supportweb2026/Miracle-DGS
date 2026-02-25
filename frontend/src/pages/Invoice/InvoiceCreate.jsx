import React, { useState, useEffect } from 'react';
import { Form, Select, DatePicker, Button, Card, Row, Col, Input, InputNumber } from 'antd';
import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import SelectAsync from '@/components/SelectAsync';
import { useSelector } from 'react-redux';
import { selectFinanceSettings } from '@/redux/settings/selectors';

const { Option } = Select;
const { TextArea } = Input;

export default function InvoiceCreate() {
  const [form] = Form.useForm();
  const translate = useLanguage();
  const navigate = useNavigate();
  
  const { last_invoice_number } = useSelector(selectFinanceSettings);
  const [lastNumber, setLastNumber] = useState(() => Number(last_invoice_number) + Number(1));
  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    if (last_invoice_number !== undefined && last_invoice_number !== null) {
      setLastNumber(Number(last_invoice_number) + Number(1));
      form.setFieldsValue({ 
        number: Number(last_invoice_number) + Number(1),
        date: dayjs()
      });
    }
  }, [last_invoice_number, form]);

  const [clients, setClients] = useState([]);
  const [allContracts, setAllContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  // Charger la liste des clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await request.list({ entity: 'client' });
        if (response.success) {
          setClients(response.result);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
      }
    };
    loadClients();
  }, []);

  // Charger tous les contrats
  useEffect(() => {
    const loadAllContracts = async () => {
      try {
        const response = await request.listAll({ entity: 'contract' });
        if (response.success) {
          setAllContracts(response.result);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des contrats:', error);
      }
    };
    loadAllContracts();
  }, []);

  // Gérer le changement de client
  const handleClientChange = (clientId) => {
    console.log('handleClientChange - clientId:', clientId);
    const contractsForClient = allContracts.filter(contract => {
      if (!contract.client) {
        console.warn('Contrat sans client:', contract);
        return false;
      }
      if (!contract.client._id) {
        console.warn('Contrat avec client sans _id:', contract);
        return false;
      }
      return contract.client._id === clientId;
    });
    console.log('Contrats trouvés pour ce client:', contractsForClient);
    setFilteredContracts(contractsForClient);
    form.setFieldsValue({ 
      contract: undefined, 
      services: [] 
    });
    setSelectedContract(null);
    setAvailableServices([]);
  };

  // Gérer le changement de contrat
  const handleContractChange = (contractId) => {
    console.log('handleContractChange - contractId:', contractId);
    const contract = filteredContracts.find(c => c._id === contractId);
    setSelectedContract(contract);
    if (contract && contract.services) {
      setAvailableServices(contract.services);
      form.setFieldsValue({ services: [] });
    }
    console.log('Contrat sélectionné:', contract);
  };

  const handleTaxChange = (value) => {
    setTaxRate(value);
    form.setFieldsValue({ taxRate: value });
  };

  const onFinish = async (values) => {
    try {
      const invoiceData = {
        number: values.number,
        year: dayjs().year(),
        date: dayjs().format('YYYY-MM-DD'),
        startDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : null,
        endDate: values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : null,
        object: values.object,
        notes: values.notes,
        client: values.client,
        contract: values.contract,
        taxRate: values.taxRate,
        currency: 'XAF',
        status: values.status,
        services: selectedServices.map(service => {
          console.log('📤 Service envoyé:', {
            name: service.name,
            numberOfAgents: service.numberOfAgents,
            numberOfDays: service.numberOfDays,
            dailyRate: service.dailyRate,
            total: service.dailyRate * service.numberOfDays * service.numberOfAgents
          });
          
          if (service.prestationType === 'site_specific') {
            return {
              _id: service._id,
              siteTariffId: service.siteTariffId._id,
              numberOfAgents: service.numberOfAgents,
              dailyRate: service.dailyRate,
              numberOfDays: service.numberOfDays, // Chaque prestation a ses propres jours
              prestationType: 'site_specific'
            };
          } else if (service.prestationType === 'classic') {
            return {
              _id: service._id,
              prestationId: service.prestationId._id,
              siteId: service.site._id,
              numberOfAgents: service.numberOfAgents,
              dailyRate: service.dailyRate,
              numberOfDays: service.numberOfDays, // Chaque prestation a ses propres jours
              prestationType: 'classic'
            };
          } else {
            // Fallback pour les anciens services sans prestationType
            return {
              _id: service._id,
              siteTariffId: service.siteTariffId?._id,
              prestationId: service.prestationId?._id,
              siteId: service.site?._id,
              numberOfAgents: service.numberOfAgents,
              dailyRate: service.dailyRate,
              numberOfDays: service.numberOfDays, // Chaque prestation a ses propres jours
              prestationType: service.prestationType || 'legacy'
            };
          }
        })
      };
      console.log('invoiceData=',invoiceData);

      const response = await request.create({
        entity: 'invoice',
        jsonData: invoiceData
      });

      if (response.success) {
        navigate(`/invoice/read/${response.result._id}`);
      } else {
        // Afficher le message d'erreur du serveur
        form.setFields([
          {
            name: 'number',
            errors: [response.message || 'Erreur lors de la création de la facture']
          }
        ]);
      }
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      form.setFields([
        {
          name: 'number',
          errors: ['Erreur lors de la création de la facture']
        }
      ]);
    }
  };

  return (
    <Card title={translate('Créer une facture')}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Form.Item
              name="number"
              label={translate('Numéro de facture')}
              rules={[
                { required: true, message: 'Veuillez saisir le numéro de facture' },
                { type: 'number', min: 1, message: 'Le numéro doit être supérieur à 0' }
              ]}
              initialValue={lastNumber}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={1}
                placeholder="Ex: 1, 2, 3..."
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
                <Option value="sent">{translate('Envoyée')}</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item
              name="client"
              label={translate('Client')}
              rules={[{ required: true, message: 'Veuillez sélectionner un client' }]}
            >
              <AutoCompleteAsync
                entity={'client'}
                displayLabels={['name']}
                searchFields={'name'}
                redirectLabel={'Add New Client'}
                withRedirect
                urlToRedirect={'/customer'}
                onChange={(value) => {
                  form.setFieldsValue({ client: value });
                  handleClientChange(value);
                }}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="contract"
              label={translate('Contrat')}
              rules={[{ required: true, message: 'Veuillez sélectionner un contrat' }]}
            >
              <Select
                placeholder="Sélectionner un contrat"
                onChange={handleContractChange}
                disabled={!form.getFieldValue('client')}
              >
                {filteredContracts.map(contract => (
                  <Option key={contract._id} value={contract._id}>
                    {`Contrat N°${contract.contractNumber || contract.number || contract._id}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Form.Item
              name="startDate"
              label={translate('Date de début')}
              rules={[{ required: true, message: 'Veuillez sélectionner la date de début' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="endDate"
              label={translate('Date de fin')}
              rules={[{ required: true, message: 'Veuillez sélectionner la date de fin' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              name="object"
              label={translate('Objet de la facture')}
              rules={[{ required: true, message: 'Veuillez saisir l\'objet de la facture' }]}
            >
              <Input placeholder="Ex: Sécurisation LOCAUX TLS" />
            </Form.Item>
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

        <Form.Item
          name="services"
          label={translate('Services à facturer')}
          rules={[{ required: true, message: 'Veuillez sélectionner au moins un service' }]}
        >
          <Select
            mode="multiple"
            placeholder="Sélectionner les services"
            disabled={!selectedContract}
            onChange={(selectedServiceIds) => {
              // Mettre à jour les services sélectionnés avec numberOfDays par défaut
              const updatedServices = selectedServiceIds.map(serviceId => {
                const service = availableServices.find(s => s._id === serviceId);
                return {
                  ...service,
                  numberOfDays: service?.numberOfDays || 1 // Utiliser numberOfDays du service ou 1 par défaut
                };
              });
              setSelectedServices(updatedServices);
            }}
          >
            {availableServices.map(service => {
              let label = '';
              
              if (service.prestationType === 'site_specific') {
                // Pour site_specific : utiliser siteTariffId
                label = `${service.siteTariffId?.site?.name || ''} - ${service.siteTariffId?.prestation?.name || ''} (${service.numberOfAgents || 0} agents)`;
              } else if (service.prestationType === 'classic') {
                // Pour classic : utiliser prestationId et site
                label = `${service.site?.name || ''} - ${service.prestationId?.name || ''} (${service.numberOfAgents || 0} agents)`;
              } else {
                // Fallback pour les anciens services sans prestationType
                label = `${service.siteTariffId?.site?.name || service.site?.name || ''} - ${service.siteTariffId?.prestation?.name || service.prestationId?.name || ''} (${service.numberOfAgents || 0} agents)`;
              }
              
              return (
                <Option 
                  key={service._id} 
                  value={service._id}
                >
                  {label}
                </Option>
              );
            })}
          </Select>
        </Form.Item>

        {/* Tableau pour modifier les services sélectionnés */}
        {selectedServices.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <h4>{translate('Modifier les services sélectionnés')}</h4>
            <table style={{ width: '100%', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #d9d9d9' }}>Service</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #d9d9d9' }}>Agents</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #d9d9d9' }}>Nombre de jours</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #d9d9d9' }}>Taux journalier</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #d9d9d9' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedServices.map((service, index) => {
                  const serviceName = service.prestationType === 'site_specific' 
                    ? service.siteTariffId?.prestation?.name || 'Service'
                    : service.prestationId?.name || 'Service';
                  
                  return (
                    <tr key={service._id}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                        {serviceName}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                        {service.numberOfAgents || 0}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                        <InputNumber
                          min={1}
                          value={service.numberOfDays || 1}
                          onChange={(value) => {
                            const updatedServices = [...selectedServices];
                            updatedServices[index].numberOfDays = value || 1;
                            setSelectedServices(updatedServices);
                          }}
                          style={{ width: '80px' }}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                        {service.dailyRate?.toLocaleString() || 0} XAF
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                        {((service.dailyRate || 0) * (service.numberOfDays || 1) * (service.numberOfAgents || 0)).toLocaleString()} XAF
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Form.Item
          name="notes"
          label={translate('Note')}
        >
          <TextArea rows={4} placeholder="Ajouter une note à la facture..." />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            {translate('Créer la facture')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
