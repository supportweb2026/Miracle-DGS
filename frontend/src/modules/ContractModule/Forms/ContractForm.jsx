import React, { useRef } from 'react';
import { Form, Input, DatePicker, Button, Card, Row, Col, Select, ConfigProvider } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import { request } from '@/request';
import { useState, useEffect } from 'react';
import { locale } from '@/locale/antdLocale';
import dayjs from 'dayjs';
import { generate as uniqueId } from 'shortid';

export default function ContractForm({ subTotal = 0, current = null, services = [] }) {
  const translate = useLanguage();
  const formRef = useRef();
  const [paymentMode, setPaymentMode] = useState(null);
  const [siteTariffs, setSiteTariffs] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [servicesList, setServicesList] = useState([]);
  const [selectedSiteName, setSelectedSiteName] = useState('');

  console.log('🔍 ContractForm - Rendu du formulaire');
  console.log('🔍 ContractForm - Props reçues:', { subTotal, current, services });
  console.log('🔍 ContractForm - États actuels:', { paymentMode, siteTariffs, selectedSite, servicesList });

  const handlePaymentModeChange = async (id) => {
    try {
      const paymentMode = await request.read({ entity: 'paymentmode', id });
      if (paymentMode) {
        setPaymentMode(paymentMode.result.name);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du mode de paiement:', error);
    }
  };

  const handleSiteChange = async (siteId, siteName) => {
    console.log('🔍 handleSiteChange - Site sélectionné:', siteId, siteName);
    console.log('🔍 handleSiteChange - Type de siteId:', typeof siteId);
    console.log('🔍 handleSiteChange - siteId value:', siteId);
    
    try {
      setSelectedSite(siteId);
      setSelectedSiteName(siteName);
      console.log('🔍 handleSiteChange - Recherche des tarifs pour le site:', siteId);
      
      const response = await request.filter({
        entity: 'siteTariff',
        options: {
          filter: {
            site: siteId,
            removed: false
          }
        }
      });
      
      console.log('🔍 handleSiteChange - Réponse reçue:', response);
      console.log('🔍 handleSiteChange - Type de réponse:', typeof response);
      console.log('🔍 handleSiteChange - Réponse complète:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('🔍 handleSiteChange - === DÉBUT ANALYSE FILTRAGE ===');
        console.log('🔍 handleSiteChange - siteId à rechercher:', siteId);
        console.log('🔍 handleSiteChange - Type de siteId:', typeof siteId);
        console.log('🔍 handleSiteChange - Nombre de résultats:', response.result.length);
        
        // Analyser chaque tarif avant filtrage
        response.result.forEach((tariff, index) => {
          console.log(`🔍 handleSiteChange - Tarif ${index}:`, {
            tariffId: tariff._id,
            siteId: tariff.site?._id,
            siteIdType: typeof tariff.site?._id,
            siteName: tariff.site?.name,
            prestationId: tariff.prestation?._id,
            prestationName: tariff.prestation?.name,
            removed: tariff.removed
          });
          
          // Test de comparaison détaillé
          if (tariff.site && tariff.site._id) {
            const directComparison = tariff.site._id === siteId;
            const stringComparison = tariff.site._id.toString() === siteId;
            const objectIdComparison = tariff.site._id.toString() === siteId.toString();
            
            console.log(`🔍 handleSiteChange - Comparaisons pour tarif ${index}:`, {
              directComparison,
              stringComparison,
              objectIdComparison,
              'siteId === tariff.site._id': directComparison,
              'siteId === tariff.site._id.toString()': stringComparison,
              'siteId.toString() === tariff.site._id.toString()': objectIdComparison
            });
          }
        });
        
        console.log('🔍 handleSiteChange - === FIN ANALYSE FILTRAGE ===');
        console.log('🔍 handleSiteChange - Tarifs trouvés:', response.result);
        setSiteTariffs(response.result);
      } else {
        console.log('🔍 handleSiteChange - Aucun tarif trouvé ou erreur');
        console.log('🔍 handleSiteChange - Status de la réponse:', response.success);
        console.log('🔍 handleSiteChange - Message d\'erreur:', response.message);
      }
    } catch (error) {
      console.error('🔍 handleSiteChange - Erreur lors de la récupération des tarifs:', error);
      console.error('🔍 handleSiteChange - Stack trace:', error.stack);
    }
  };

  const handleServiceChange = (value, field) => {
    const selectedTariff = siteTariffs.find(tariff => tariff.prestation._id === value);
    if (selectedTariff) {
      const services = formRef.current?.getFieldValue('services');
      const updatedServices = services.map((service, index) => {
        if (index === field.name) {
          return {
            ...service,
            dailyRate: selectedTariff.useCustomValues ? selectedTariff.customDailyRate : selectedTariff.prestation.baseDailyRate,
            hourlyRate: selectedTariff.useCustomValues ? selectedTariff.customHourlyRate : selectedTariff.prestation.baseHourlyRate,
            duration: selectedTariff.useCustomValues ? selectedTariff.customDuration : selectedTariff.prestation.baseDuration,
          };
        }
        return service;
      });
      if (formRef.current) {
        formRef.current.setFieldsValue({ services: updatedServices });
      }
    }
  };

  return (
    <ConfigProvider locale={locale}>
      <div style={{ width: '100%' }}>
        <Form ref={formRef}>
          {/* Informations client */}
          <Card title="Informations client" style={{ marginBottom: 16 }}>
            <Row gutter={[12, 0]}>
              <Col span={24}>
                <Form.Item
                  name="client"
                  rules={[{ required: true, message: 'Veuillez sélectionner un client' }]}
                >
                  <AutoCompleteAsync
                    entity={'client'}
                    displayLabels={['name']}
                    searchFields={'name'}
                    redirectLabel={'Ajouter un nouveau client'}
                    withRedirect
                    urlToRedirect={'/customer'}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="siret"
                  rules={[{ required: true, message: 'Veuillez entrer le SIRET' }]}
                >
                  <Input placeholder="SIRET" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="representative"
                  rules={[{ required: true, message: 'Veuillez entrer le nom du représentant' }]}
                >
                  <Input placeholder="Nom du représentant" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* Sites et prestations */}
          <Card title="Sites et prestations" style={{ marginBottom: 16 }}>
            <Form.List
              name="services"
              rules={[
                {
                  validator: async (_, services) => {
                    if (!services || services.length < 1) {
                      return Promise.reject(new Error('Veuillez ajouter au moins un site et une prestation'));
                    }
                  },
                },
              ]}
            >
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field) => (
                    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                      <Col span={11}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'siteTariffId', 'site']}
                          label="Site"
                          rules={[{ required: true, message: 'Veuillez sélectionner un site' }]}
                        >
                          <AutoCompleteAsync
                            entity="site"
                            displayLabels={['name']}
                            searchFields="name"
                            onChange={(value, option) => {
                              console.log('🔍 AutoCompleteAsync Site - Valeur sélectionnée:', value, option);
                              handleSiteChange(value, option?.label || '');
                            }}
                          />
                        </Form.Item>
                      </Col>

                      <Col span={11}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'siteTariffId', 'prestation']}
                          label="Prestation"
                          rules={[{ required: true, message: 'Veuillez sélectionner une prestation' }]}
                        >
                          <Select
                            placeholder="Sélectionner une prestation"
                            disabled={!selectedSite}
                            onChange={(value) => handleServiceChange(value, field)}
                          >
                            {siteTariffs.map((tariff) => (
                              <Select.Option key={tariff.prestation._id} value={tariff.prestation._id}>
                                {tariff.prestation.name}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                      <Col span={2}>
                        {fields.length > 1 && (
                          <Button 
                            type="text" 
                            danger 
                            icon={<MinusCircleOutlined />} 
                            onClick={() => remove(field.name)}
                            style={{ marginTop: 32 }}
                          />
                        )}
                      </Col>

                      <Col span={11}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'numberOfAgents']}
                          label="Nombre d'agents"
                          rules={[{ required: true, message: 'Veuillez entrer le nombre d\'agents' }]}
                        >
                          <Input type="number" min={1} />
                        </Form.Item>
                      </Col>
                    </Row>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Ajouter un site et prestation
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Card>

          {/* Informations de paiement */}
          <Card title="Informations de paiement" style={{ marginBottom: 16 }}>
            <Row gutter={[12, 0]}>
              <Col span={12}>
                <Form.Item
                  name="paymentMode"
                  rules={[{ required: true, message: 'Veuillez sélectionner un mode de paiement' }]}
                >
                  <AutoCompleteAsync
                    entity="paymentmode"
                    displayLabels={['name']}
                    searchFields="name"
                    onChange={handlePaymentModeChange}
                    placeholder="Mode de paiement"
                  />
                </Form.Item>
              </Col>

              {paymentMode === 'Virement bancaire' && (
                <>
                  <Col span={12}>
                    <Form.Item name="bankName">
                      <Input placeholder="Nom de la Banque" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="rib">
                      <Input placeholder="RIB" />
                    </Form.Item>
                  </Col>
                </>
              )}
            </Row>
          </Card>

          {/* Dates et statut */}
          <Card title="Dates et statut">
            <Row gutter={[12, 0]}>
              <Col span={8}>
                <Form.Item
                  name="startDate"
                  rules={[{ required: true, message: 'Veuillez sélectionner une date de début' }]}
                >
                  <DatePicker style={{ width: '100%' }} placeholder="Date de début" />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="endDate"
                  rules={[{ required: true, message: 'Veuillez sélectionner une date de fin' }]}
                >
                  <DatePicker style={{ width: '100%' }} placeholder="Date de fin" />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="status"
                  initialValue="actif"
                  rules={[{ required: true, message: 'Veuillez sélectionner un statut' }]}
                >
                  <Select placeholder="Statut">
                    <Select.Option value="actif">Actif</Select.Option>
                    <Select.Option value="suspendu">Suspendu</Select.Option>
                    <Select.Option value="en_attente">En attente</Select.Option>
                    <Select.Option value="resilie">Résilié</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </div>
    </ConfigProvider>
  );
} 