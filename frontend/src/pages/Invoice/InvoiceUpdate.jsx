import React, { useState, useEffect } from 'react';
import { Form, Select, DatePicker, Button, Card, Row, Col, Input, InputNumber } from 'antd';
import { request } from '@/request';
import useLanguage from '@/locale/useLanguage';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import SelectAsync from '@/components/SelectAsync';

const { Option } = Select;
const { TextArea } = Input;

export default function InvoiceUpdate({ current }) {
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

  const [clients, setClients] = useState([]);
  const [allContracts, setAllContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

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

  // Charger la facture après que les taxes soient chargées
  useEffect(() => {
    if (taxOptions.length > 0) {
      const loadInvoice = async () => {
        try {
          console.log('=== DÉBUT DU CHARGEMENT DE LA FACTURE ===');
          console.log('ID de la facture:', id);
          console.log('État actuel des contrats:', allContracts);
          
          const response = await request.read({ entity: 'invoice', id });
          console.log('Réponse brute du serveur:', response);
          
          if (response.success) {
            const invoiceData = response.result;
            console.log('=== DONNÉES DE LA FACTURE ===');
            console.log('Données complètes:', invoiceData);
            console.log('Client:', invoiceData.client);
            console.log('Contrat:', invoiceData.contract);
            console.log('Services:', invoiceData.services);
            console.log('Statut:', invoiceData.status);
            
            setCurrentStatus(invoiceData.status);
            
            // Vérifier que nous avons les données nécessaires
            if (!invoiceData.client || !invoiceData.client._id) {
              console.error('ERREUR: Client manquant dans les données de la facture');
              console.log('Données du client:', invoiceData.client);
              return;
            }

            console.log('=== FILTRAGE DES CONTRATS ===');
            console.log('Nombre total de contrats:', allContracts.length);
            console.log('ID du client recherché:', invoiceData.client._id);
            
            // Filtrer les contrats pour le client actuel
            const contractsForClient = allContracts.filter(contract => {
              console.log('Vérification du contrat:', contract);
              console.log('Client du contrat:', contract?.client);
              return contract && contract.client && contract.client._id === invoiceData.client._id;
            });
            
            console.log('Contrats filtrés pour le client:', contractsForClient);
            setFilteredContracts(contractsForClient);

            // Trouver le contrat actuel
            console.log('=== RECHERCHE DU CONTRAT ACTUEL ===');
            console.log('ID du contrat recherché:', invoiceData.contract._id);
            const currentContract = contractsForClient.find(c => c._id === invoiceData.contract._id);
            console.log('Contrat actuel trouvé:', currentContract);
            
            if (currentContract) {
              console.log('Services du contrat actuel:', currentContract.services);
              setSelectedContract(currentContract);
              setAvailableServices(currentContract.services);
            } else {
              console.warn('Aucun contrat actuel trouvé');
            }

            // Trouver la taxe correspondante
            console.log('=== RECHERCHE DE LA TAXE ===');
            console.log('TaxRate de la facture:', invoiceData.taxRate);
            console.log('TaxName de la facture:', invoiceData.taxName);
            console.log('TaxOptions disponibles:', taxOptions);
            
            let found = taxOptions.find(opt => opt.rate === invoiceData.taxRate);
            
            // Si pas trouvé par le taux, essayer par le nom
            if (!found && invoiceData.taxName) {
              found = taxOptions.find(opt => 
                opt.label.toLowerCase() === invoiceData.taxName.toLowerCase()
              );
            }
            
            // Si toujours pas trouvé, essayer de deviner selon le taux
            if (!found) {
              if (invoiceData.taxRate === 10.5) {
                found = taxOptions.find(opt => opt.label === 'TPS et CSS');
              } else if (invoiceData.taxRate === 9.5) {
                found = taxOptions.find(opt => opt.label === 'TPS');
              } else if (invoiceData.taxRate === 19) {
                found = taxOptions.find(opt => opt.label === 'TVA et CSS');
              } else if (invoiceData.taxRate === 18) {
                found = taxOptions.find(opt => opt.label === 'TVA 18%');
              } else if (invoiceData.taxRate === 0) {
                found = taxOptions.find(opt => opt.label === 'Aucune');
              }
            }
            
            if (found) {
              setTaxOption(found);
              console.log('[LOG] Taxe trouvée:', found);
            } else {
              // Fallback si pas trouvé, créer une option avec le nom de la taxe
              const fallbackOption = {
                label: invoiceData.taxName || `Taxe ${invoiceData.taxRate}%`,
                value: invoiceData.taxName?.toLowerCase().replace(/\s+/g, '_') || 'custom',
                rate: invoiceData.taxRate
              };
              setTaxOption(fallbackOption);
              console.log('[LOG] Taxe fallback créée:', fallbackOption);
            }

            // Préparer les données du formulaire
            console.log('=== PRÉPARATION DES DONNÉES DU FORMULAIRE ===');
            const formData = {
              date: dayjs(invoiceData.date),
              startDate: dayjs(invoiceData.startDate),
              endDate: dayjs(invoiceData.endDate),
              taxRate: invoiceData.taxRate,
              taxName: invoiceData.taxName,
              client: invoiceData.client._id,
              contract: invoiceData.contract._id,
              services: invoiceData.services.map(service => service._id), // Pré-sélectionner les services de la facture
              year: invoiceData.year || new Date().getFullYear(),
              number: invoiceData.number,
              status: invoiceData.status,
              notes: invoiceData.notes
            };
            console.log('Données du formulaire préparées:', formData);
            console.log('🔍 Champs ajoutés - number:', invoiceData.number, 'status:', invoiceData.status, 'notes:', invoiceData.notes);
            form.setFieldsValue(formData);
            setTaxRate(invoiceData.taxRate);
            setSelectedClient(invoiceData.client);
            // Utiliser directement les services de la facture existante
            console.log('🔍 SERVICES DE LA FACTURE EXISTANTE:');
            console.log('📋 Nombre de services:', invoiceData.services?.length || 0);
            if (invoiceData.services && invoiceData.services.length > 0) {
              invoiceData.services.forEach((service, index) => {
                console.log(`--- SERVICE FACTURE ${index} ---`);
                console.log('ID:', service._id);
                console.log('prestationType:', service.prestationType);
                console.log('prestationId:', service.prestationId);
                console.log('siteId:', service.siteId);
                console.log('siteTariffId:', service.siteTariffId);
                console.log('numberOfAgents:', service.numberOfAgents);
                console.log('dailyRate:', service.dailyRate);
              });
            }
            setAvailableServices(invoiceData.services || []);
            setSelectedServices(invoiceData.services || []);
            console.log('=== STRUCTURE DES SERVICES CHARGÉS ===');
            console.log('Services de la facture:', invoiceData.services);
            console.log('Nombre de services:', invoiceData.services?.length);
            
            if (invoiceData.services && invoiceData.services.length > 0) {
              console.log('Premier service détaillé:', invoiceData.services[0]);
              
              // Analyser chaque service en détail
              invoiceData.services.forEach((service, index) => {
                console.log(`--- SERVICE ${index} ---`);
                console.log('Service complet:', service);
                console.log('prestationType:', service.prestationType, typeof service.prestationType);
                console.log('siteTariffId:', service.siteTariffId, typeof service.siteTariffId);
                console.log('prestationId:', service.prestationId, typeof service.prestationId);
                console.log('siteId:', service.siteId, typeof service.siteId);
                console.log('numberOfAgents:', service.numberOfAgents, typeof service.numberOfAgents);
                console.log('numberOfDays:', service.numberOfDays, typeof service.numberOfDays);
                console.log('dailyRate:', service.dailyRate, typeof service.dailyRate);
                console.log('total:', service.total, typeof service.total);
                console.log('startDate:', service.startDate, typeof service.startDate);
                console.log('endDate:', service.endDate, typeof service.endDate);
                console.log('Tous les champs du service:', Object.keys(service));
                
                // Vérifier les types d'objets
                if (service.siteTariffId && typeof service.siteTariffId === 'object') {
                  console.log('siteTariffId est un objet:', service.siteTariffId);
                  console.log('siteTariffId._id:', service.siteTariffId._id);
                }
                if (service.prestationId && typeof service.prestationId === 'object') {
                  console.log('prestationId est un objet:', service.prestationId);
                  console.log('prestationId._id:', service.prestationId._id);
                }
                if (service.siteId && typeof service.siteId === 'object') {
                  console.log('siteId est un objet:', service.siteId);
                  console.log('siteId._id:', service.siteId._id);
                }
              });
            } else {
              console.log('AUCUN SERVICE TROUVÉ dans la facture !');
            }
            console.log('=== FIN DU CHARGEMENT DE LA FACTURE ===');
          } else {
            console.error('ERREUR: La réponse du serveur n\'est pas un succès');
            console.log('Réponse complète:', response);
          }
        } catch (error) {
          console.error('=== ERREUR LORS DU CHARGEMENT DE LA FACTURE ===');
          console.error('Message d\'erreur:', error.message);
          console.error('Stack trace:', error.stack);
        } finally {
          setLoading(false);
        }
      };
      loadInvoice();
    }
  }, [id, form, taxOptions, allContracts]);

  // Charger la liste des clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await request.list({ entity: 'client' });
        if (response.success) {
          console.log('Liste des clients chargée:', response.result);
          setClients(response.result);
          // Précharger les options pour AutoCompleteAsync
          const options = response.result.map(client => ({
            value: client._id,
            label: client.name
          }));
          form.setFieldsValue({ client: selectedClient });
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
        console.log('=== CHARGEMENT DES CONTRATS ===');
        const response = await request.listAll({ entity: 'contract' });
        console.log('Réponse du chargement des contrats:', response);
        
        if (response.success) {
          console.log('Nombre de contrats chargés:', response.result.length);
          console.log('Détail des contrats:', response.result);
          setAllContracts(response.result);
        } else {
          console.error('ERREUR: Échec du chargement des contrats');
          console.log('Réponse complète:', response);
        }
      } catch (error) {
        console.error('ERREUR lors du chargement des contrats:', error);
        console.error('Stack trace:', error.stack);
      }
    };
    loadAllContracts();
  }, []);

  // Lors du chargement de la facture, synchroniser l'option de taxe
  useEffect(() => {
    const found = taxOptions.find(opt => (taxRate === 19 && opt.value === 'split') || (taxRate === 18 && opt.value === 'tva') || (taxRate === 0 && opt.value === 'none'));
    if (found) setTaxOption(found);
  }, [taxRate]);

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

  // Gérer le changement de client
  const handleClientChange = (clientId) => {
    console.log('Changement de client:', clientId);
    const client = clients.find(c => c._id === clientId);
    console.log('Client sélectionné:', client);
    setSelectedClient(client);
    const contractsForClient = allContracts.filter(contract => 
      contract && contract.client && contract.client._id === clientId
    );
    console.log('Nouveaux contrats filtrés:', contractsForClient);
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
    console.log('🔄 CHANGEMENT DE CONTRAT:', contractId);
    const contract = filteredContracts.find(c => c._id === contractId);
    console.log('📋 Contrat sélectionné:', contract);
    setSelectedContract(contract);
    if (contract && contract.services) {
      console.log('📋 Services du nouveau contrat:', contract.services);
      console.log('📋 Détail des services:', contract.services.map(service => ({
        id: service._id,
        site: service.siteTariffId?.site?.name,
        prestation: service.siteTariffId?.prestation?.name,
        agents: service.numberOfAgents
      })));
      setAvailableServices(contract.services);
      form.setFieldsValue({ services: [] });
      // Réinitialiser selectedServices quand on change de contrat
      setSelectedServices([]);
      console.log('🔄 selectedServices réinitialisé pour le nouveau contrat');
    }
  };

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
      
      const invoiceData = {
        number: values.number,
        year: dayjs().year(),
        date: values.date.format('YYYY-MM-DD'),
        startDate: values.startDate.format('YYYY-MM-DD'),
        endDate: values.endDate.format('YYYY-MM-DD'),
        client: values.client,
        contract: values.contract,
        taxRate: values.taxRate,
        taxName: taxName,
        currency: 'XAF',
        status: values.status,
        services: selectedServices.map((service, index) => {
          console.log(`[DEBUG] === MAPPING SERVICE ${index} ===`);
          console.log('[DEBUG] Service original:', service);
          console.log('[DEBUG] Type de service:', typeof service);
          console.log('[DEBUG] _id du service:', service._id);
          
          const fullService = availableServices.find(s => s._id === (service._id || service));
          console.log('[DEBUG] Full service trouvé:', fullService);
          console.log('[DEBUG] Type de fullService:', typeof fullService);
          
          if (fullService) {
            console.log('[DEBUG] fullService._id:', fullService._id);
            console.log('[DEBUG] fullService.prestationType:', fullService.prestationType);
            console.log('[DEBUG] fullService.siteTariffId:', fullService.siteTariffId);
            console.log('[DEBUG] fullService.prestationId:', fullService.prestationId);
            console.log('[DEBUG] fullService.siteId:', fullService.siteId);
          }
          
          const finalService = {
            _id: fullService?._id || service._id || service,
            siteTariffId: fullService?.siteTariffId?._id || service.siteTariffId?._id,
            prestationId: fullService?.prestationId || service.prestationId,
            siteId: fullService?.siteId || service.siteId,
            prestationType: fullService?.prestationType || service.prestationType,
            numberOfAgents: service.numberOfAgents,
            numberOfDays: service.numberOfDays || 1, // Chaque prestation a ses propres jours
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
      console.log('📋 invoiceData complet:', JSON.stringify(invoiceData, null, 2));
      console.log('📋 Nombre de services:', invoiceData.services.length);
      invoiceData.services.forEach((service, index) => {
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
        entity: 'invoice',
        id,
        jsonData: invoiceData
      });

      console.log('[DEBUG] Réponse du serveur:', response);

      if (response.success) {
        navigate(`/invoice/read/${id}`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la facture:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <Card title={translate('Modifier la facture')}>
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>Chargement de la facture...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card title={translate('Modifier la facture')}>
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
              <Select
                showSearch
                placeholder="Rechercher un client"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                onChange={(value) => {
                  console.log('Valeur sélectionnée:', value);
                  const client = clients.find(c => c._id === value);
                  handleClientChange(value);
                }}
                value={selectedClient?._id}
              >
                {clients.map(client => (
                  <Select.Option key={client._id} value={client._id}>
                    {client.name}
                  </Select.Option>
                ))}
              </Select>
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
                disabled={!selectedClient}
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
              label={translate('Services à facturer')}
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
                  console.log('📋 service.site:', service.site);
                  console.log('📋 service.siteId:', service.siteId);
                  console.log('📋 service.prestationId:', service.prestationId);
                  console.log('📋 service.siteTariffId:', service.siteTariffId);
                  
                  let label = '';
                  
                  if (service.prestationType === 'site_specific') {
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
          <Button type="primary" htmlType="submit" loading={submitLoading}>
            {submitLoading ? 'Mise à jour en cours...' : translate('Mettre à jour la facture')}
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
