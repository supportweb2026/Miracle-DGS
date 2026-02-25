import React, { useState, useEffect } from 'react';
import { Form, Select, DatePicker, Button, Card, Row, Col, Input } from 'antd';
import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import SelectAsync from '@/components/SelectAsync';

const { Option } = Select;
const { TextArea } = Input;

export default function QuoteUpdate({ current }) {
  const [form] = Form.useForm();
  const translate = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const [taxRate, setTaxRate] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('draft');
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [taxOptions, setTaxOptions] = useState([]);
  const [taxOption, setTaxOption] = useState(null);

  const [availableServices, setAvailableServices] = useState([]);

  // Charger la liste des taxes
  useEffect(() => {
    const loadTaxes = async () => {
      try {
        const response = await request.list({ entity: 'taxes' });
        if (response.success) {
          const taxes = response.result.map(tax => ({
            label: tax.taxName,
            value: tax.taxName.toLowerCase().replace(/\s+/g, '_'),
            rate: tax.taxValue
          }));
          setTaxOptions(taxes);
          console.log('[LOG] Taxes chargées:', taxes);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des taxes:', error);
      }
    };
    loadTaxes();
  }, []);

  // Charger le devis après que les taxes soient chargées
  useEffect(() => {
    if (taxOptions.length > 0) {
      const loadQuote = async () => {
        try {
          console.log('=== DÉBUT DU CHARGEMENT DU DEVIS ===');
          console.log('ID du devis:', id);
          
          const response = await request.read({ entity: 'quote', id });
          console.log('Réponse brute du serveur:', response);
          
          if (response.success) {
            const quoteData = response.result;
            console.log('=== DONNÉES DU DEVIS ===');
            console.log('Données complètes:', quoteData);
            console.log('Prospect:', quoteData.prospect);
            console.log('Services:', quoteData.services);
            console.log('Statut:', quoteData.status);
            
            setCurrentStatus(quoteData.status);
            
            // Vérifier que nous avons les données nécessaires
            if (!quoteData.prospect) {
              console.error('ERREUR: Prospect manquant dans les données du devis');
              console.log('Données du prospect:', quoteData.prospect);
              return;
            }

            // Pour les devis, on n'a pas besoin de charger les contrats
            // Les services sont directement dans quoteData.services
            console.log('=== SERVICES DU DEVIS ===');
            console.log('Services du devis:', quoteData.services);
            console.log('Nombre de services:', quoteData.services?.length || 0);
            
            // Utiliser directement les services du devis
            setAvailableServices(quoteData.services || []);
            setSelectedServices(quoteData.services || []);

            // Trouver la taxe correspondante
            console.log('=== RECHERCHE DE LA TAXE ===');
            console.log('TaxRate du devis:', quoteData.taxRate);
            console.log('TaxName du devis:', quoteData.taxName);
            console.log('TaxOptions disponibles:', taxOptions);
            
            let found = taxOptions.find(opt => opt.rate === quoteData.taxRate);
            
            // Si pas trouvé par le taux, essayer par le nom
            if (!found && quoteData.taxName) {
              found = taxOptions.find(opt => 
                opt.label.toLowerCase() === quoteData.taxName.toLowerCase()
              );
            }
            
            // Si toujours pas trouvé, essayer de deviner selon le taux
            if (!found) {
              if (quoteData.taxRate === 10.5) {
                found = taxOptions.find(opt => opt.label === 'TPS et CSS');
              } else if (quoteData.taxRate === 9.5) {
                found = taxOptions.find(opt => opt.label === 'TPS');
              } else if (quoteData.taxRate === 19) {
                found = taxOptions.find(opt => opt.label === 'TVA et CSS');
              } else if (quoteData.taxRate === 18) {
                found = taxOptions.find(opt => opt.label === 'TVA 18%');
              } else if (quoteData.taxRate === 0) {
                found = taxOptions.find(opt => opt.label === 'Aucune');
              }
            }
            
            if (found) {
              setTaxOption(found);
              console.log('[LOG] Taxe trouvée:', found);
            } else {
              // Fallback si pas trouvé, créer une option avec le nom de la taxe
              const fallbackOption = {
                label: quoteData.taxName || `Taxe ${quoteData.taxRate}%`,
                value: quoteData.taxName?.toLowerCase().replace(/\s+/g, '_') || 'custom',
                rate: quoteData.taxRate
              };
              setTaxOption(fallbackOption);
              console.log('[LOG] Taxe fallback créée:', fallbackOption);
            }

            // Préparer les données du formulaire
            console.log('=== PRÉPARATION DES DONNÉES DU FORMULAIRE ===');
            const formData = {
              date: dayjs(quoteData.date),
              expiredDate: dayjs(quoteData.expiredDate),
              startDate: quoteData.services && quoteData.services.length > 0 ? dayjs(quoteData.services[0].startDate) : dayjs(),
              endDate: quoteData.services && quoteData.services.length > 0 ? dayjs(quoteData.services[0].endDate) : dayjs(),
              taxRate: quoteData.taxRate,
              taxName: quoteData.taxName,
              prospect: quoteData.prospect,
              services: quoteData.services.map(service => service._id), // Pré-sélectionner les services du devis
              year: quoteData.year || new Date().getFullYear(),
              number: quoteData.number,
              status: quoteData.status,
              notes: quoteData.notes,
            };
            console.log('Données du formulaire préparées:', formData);
            form.setFieldsValue(formData);
            setTaxRate(quoteData.taxRate);
            // Plus besoin de setSelectedProspect - c'est un champ texte
            // Utiliser directement les services du devis existant
            console.log('🔍 SERVICES DU DEVIS EXISTANT:');
            console.log('📋 Nombre de services:', quoteData.services?.length || 0);
            if (quoteData.services && quoteData.services.length > 0) {
              quoteData.services.forEach((service, index) => {
                console.log(`--- SERVICE DEVIS ${index} ---`);
                console.log('ID:', service._id);
                console.log('name:', service.name);
                console.log('numberOfAgents:', service.numberOfAgents);
                console.log('numberOfDays:', service.numberOfDays);
                console.log('dailyRate:', service.dailyRate);
                console.log('total:', service.total);
                console.log('startDate:', service.startDate);
                console.log('endDate:', service.endDate);
              });
            }
            setAvailableServices(quoteData.services || []);
            setSelectedServices(quoteData.services || []);
            console.log('=== FIN DU CHARGEMENT DU DEVIS ===');
          } else {
            console.error('ERREUR: La réponse du serveur n\'est pas un succès');
            console.log('Réponse complète:', response);
          }
        } catch (error) {
          console.error('=== ERREUR LORS DU CHARGEMENT DU DEVIS ===');
          console.error('Message d\'erreur:', error.message);
          console.error('Stack trace:', error.stack);
        } finally {
          setLoading(false);
        }
      };
      loadQuote();
    }
  }, [id, form, taxOptions]);

  // Plus besoin de charger la liste des prospects - c'est un champ texte libre

  // Pour les devis, on n'a pas besoin de charger les contrats
  // Les services sont directement dans les données du devis

  // Handler pour la sélection de la taxe
  const handleTaxOptionChange = (value) => {
    console.log('[DEBUG] handleTaxOptionChange appelé avec value:', value);
    const found = taxOptions.find(opt => opt.value === value);
    console.log('[DEBUG] taxOption trouvée:', found);
    if (found) {
      setTaxOption(found);
      setTaxRate(found.rate);
      form.setFieldsValue({ 
        taxRate: found.rate,
        taxName: found.label 
      });
      console.log('[DEBUG] Formulaire mis à jour avec taxRate:', found.rate, 'et taxName:', found.label);
    }
  };

  // Plus besoin de gérer le changement de prospect - c'est un champ texte libre

  const onFinish = async (values) => {
    try {
      setSubmitLoading(true);
      if (!selectedServices || selectedServices.length === 0) {
        alert('Veuillez sélectionner au moins un service.');
        return;
      }
      console.log('[LOG] Valeurs du formulaire avant envoi:', values);
      console.log('[DEBUG] taxOption:', taxOption);
      console.log('[DEBUG] values.taxRate:', values.taxRate);
      console.log('[DEBUG] values.taxName:', values.taxName);
      console.log('[DEBUG] selectedServices:', selectedServices);
      console.log('[DEBUG] availableServices:', availableServices);
      
      // Déterminer le nom de la taxe
      let taxName = values.taxName;
      if (!taxName && taxOption) {
        taxName = taxOption.label;
      } else if (!taxName) {
        // Fallback : essayer de deviner selon le taux
        if (values.taxRate === 10.5) {
          taxName = 'TPS et CSS';
        } else if (values.taxRate === 9.5) {
          taxName = 'TPS';
        } else if (values.taxRate === 19) {
          taxName = 'TVA et CSS';
        } else if (values.taxRate === 18) {
          taxName = 'TVA 18%';
        } else if (values.taxRate === 0) {
          taxName = 'Aucune';
        } else {
          taxName = `Taxe ${values.taxRate}%`;
        }
      }
      
      const quoteData = {
        number: values.number,
        year: dayjs().year(),
        date: values.date.format('YYYY-MM-DD'),
        expiredDate: values.expiredDate.format('YYYY-MM-DD'),
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        prospect: values.prospect,
        taxRate: values.taxRate,
        taxName: taxName,
        currency: 'XAF',
        status: values.status,
        services: selectedServices.map((service, index) => {
          console.log(`[DEBUG] === MAPPING SERVICE ${index} ===`);
          console.log('[DEBUG] Service original:', service);
          
          // Pour les devis, envoyer les données brutes pour que le backend recalcule
          const finalService = {
            _id: service._id,
            name: service.name,
            numberOfAgents: service.numberOfAgents,
            numberOfDays: service.numberOfDays, // Chaque prestation a ses propres jours
            dailyRate: service.dailyRate,
            startDate: values.startDate.format('YYYY-MM-DD'),
            endDate: values.endDate.format('YYYY-MM-DD')
          };
          
          console.log('[DEBUG] Service final mappé:', finalService);
          console.log(`[DEBUG] === FIN MAPPING SERVICE ${index} ===`);
          
          return finalService;
        }),
        notes: values.notes
      };
      console.log('🚀 === DONNÉES ENVOYÉES AU BACKEND ===');
      console.log('📋 quoteData complet:', JSON.stringify(quoteData, null, 2));
      console.log('📋 Nombre de services:', quoteData.services.length);
      quoteData.services.forEach((service, index) => {
        console.log(`📋 Service ${index}:`, {
          _id: service._id,
          numberOfAgents: service.numberOfAgents,
          numberOfDays: service.numberOfDays,
          dailyRate: service.dailyRate,
          prestationType: service.prestationType,
          siteTariffId: service.siteTariffId,
          prestationId: service.prestationId
        });
      });
      console.log('🚀 === FIN DONNÉES BACKEND ===');

      const response = await request.update({
        entity: 'quote',
        id,
        jsonData: quoteData
      });

      console.log('[DEBUG] Réponse du serveur:', response);

      if (response.success) {
        navigate(`/quote/read/${id}`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du devis:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Card title={translate('Modifier le devis')}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>Chargement du devis...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card title={translate('Modifier le devis')}>
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
            >
              <Input disabled />
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
          <Col span={8}>
            <Form.Item
              name="startDate"
              label={translate('Date de début')}
              rules={[{ required: true, message: 'Veuillez sélectionner une date de début' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              name="endDate"
              label={translate('Date de fin')}
              rules={[{ required: true, message: 'Veuillez sélectionner une date de fin' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          <Col span={8}>
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
          <Col span={12}>
            <Form.Item
              label={translate('Taxe')}
              required
            >
              <Select
                value={taxOption?.value}
                onChange={handleTaxOptionChange}
                placeholder="Sélectionner une taxe"
              >
                {taxOptions.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="taxRate" noStyle>
              <Input type="hidden" />
            </Form.Item>
            <Form.Item name="taxName" noStyle>
              <Input type="hidden" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Form.Item
              name="services"
              label={translate('Services à deviser')}
              rules={[{ required: true, message: 'Veuillez sélectionner au moins un service' }]}
            >
              <Select
                mode="multiple"
                placeholder="Sélectionner les services"
                style={{ width: '100%' }}
                onChange={(value) => {
                  console.log('🔍 SERVICES SÉLECTIONNÉS DANS LE SELECT:', value);
                  console.log('📋 Services disponibles:', availableServices);
                  
                  // Mettre à jour selectedServices avec les services complets correspondant aux IDs
                  const selectedServicesComplete = value.map(serviceId => {
                    const fullService = availableServices.find(s => s._id === serviceId);
                    console.log('🔍 Service ID:', serviceId, 'Service complet trouvé:', fullService);
                    return fullService;
                  }).filter(service => service); // Filtrer les services non trouvés
                  
                  console.log('📋 selectedServices mis à jour:', selectedServicesComplete);
                  setSelectedServices(selectedServicesComplete);
                }}
              >
                {availableServices.map(service => {
                  console.log('🔍 SERVICE EN COURS DE RENDU:', service);
                  
                  let label = '';
                  
                  // Pour les devis, utiliser directement le nom du service
                  if (service.name) {
                    label = `${service.name} (${service.numberOfAgents || 0} agents) - ${service.dailyRate || 0} XAF/jour`;
                  } else if (service.prestationType === 'site_specific') {
                    // Pour site_specific : utiliser siteTariffId
                    const siteName = service.siteTariffId?.site?.name || 'Site non spécifié';
                    const prestationName = service.siteTariffId?.prestation?.name || 'Prestation non spécifiée';
                    label = `${siteName} - ${prestationName} (${service.numberOfAgents || 0} agents)`;
                  } else if (service.prestationType === 'classic') {
                    // Pour classic : utiliser prestationId et site
                    const siteName = service.site?.name || service.siteId?.name || 'Site non spécifié';
                    const prestationName = service.prestationId?.name || 'Prestation non spécifiée';
                    label = `${siteName} - ${prestationName} (${service.numberOfAgents || 0} agents)`;
                  } else {
                    // Fallback pour les anciens services sans prestationType
                    const siteName = service.siteTariffId?.site?.name || service.site?.name || service.siteId?.name || 'Site non spécifié';
                    const prestationName = service.siteTariffId?.prestation?.name || service.prestationId?.name || 'Prestation non spécifiée';
                    label = `${siteName} - ${prestationName} (${service.numberOfAgents || 0} agents)`;
                  }
                  
                  console.log('📋 Label généré:', label);
                  
                  return (
                    <Select.Option key={service._id} value={service._id}>
                      {label}
                    </Select.Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Col>
        </Row>

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
                  const serviceName = service.name || 'Service';
                  
                  return (
                    <tr key={service._id}>
                      <td style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
                        {serviceName}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                        <Input
                          type="number"
                          min={1}
                          value={service.numberOfAgents || 1}
                          onChange={(e) => {
                            const updatedServices = [...selectedServices];
                            updatedServices[index].numberOfAgents = parseInt(e.target.value) || 1;
                            // Recalculer le total
                            updatedServices[index].total = updatedServices[index].dailyRate * updatedServices[index].numberOfDays * updatedServices[index].numberOfAgents;
                            setSelectedServices(updatedServices);
                          }}
                          style={{ width: '80px' }}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                        <Input
                          type="number"
                          min={1}
                          value={service.numberOfDays || 1}
                          onChange={(e) => {
                            const updatedServices = [...selectedServices];
                            updatedServices[index].numberOfDays = parseInt(e.target.value) || 1;
                            // Recalculer le total
                            updatedServices[index].total = updatedServices[index].dailyRate * updatedServices[index].numberOfDays * updatedServices[index].numberOfAgents;
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
          <TextArea rows={4} placeholder="Ajouter une note au devis..." />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitLoading}>
            {submitLoading ? 'Mise à jour en cours...' : translate('Mettre à jour le devis')}
          </Button>
          {submitLoading && (
            <div style={{ marginTop: '8px', color: '#1890ff', fontSize: '14px' }}>
              ⏳ Sauvegarde de vos modifications...
            </div>
          )}
        </Form.Item>
      </Form>
    </Card>
  );
}