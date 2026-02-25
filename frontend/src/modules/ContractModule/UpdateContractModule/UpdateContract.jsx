import React, { useEffect, useState } from 'react';
import { Typography, Tag, Button, Form, Divider, Space, ConfigProvider } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import ContractForm from '@/forms/ContractForm';
import dayjs from 'dayjs';
import { request } from '@/request';
import locale from 'antd/locale/fr_FR';
import 'dayjs/locale/fr';

// Configurer dayjs en français
dayjs.locale('fr');

const { Title } = Typography;

function SaveForm({ form, translate }) {
  return (
    <Button
      type="primary"
      htmlType="submit"
      icon={<PlusOutlined />}
      size="large"
    >
      {translate('Sauvegarder')}
    </Button>
  );
}

export default function UpdateContract({ config, currentResult, isSuccess }) {
  const translate = useLanguage();
  let { entity } = config;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // CORRECTION : Utiliser Form.useForm() correctement
  const [form] = Form.useForm();
  
  // NOUVEAU : State pour gérer l'initialisation du formulaire
  const [isFormReady, setIsFormReady] = useState(false);
  
  // NOUVEAU : State pour stocker les données du contrat avec dates converties
  const [processedContractData, setProcessedContractData] = useState(null);
  
  // NOUVEAU : State pour stocker les prestations
  const [prestations, setPrestations] = useState([]);

  // NOUVEAU : State pour stocker les données du siteTariff
  const [siteTariffData, setSiteTariffData] = useState(null);

  // NOUVEAU : State pour stocker les services groupés
  const [groupedServices, setGroupedServices] = useState(null);

  const { id } = useParams();

  // LOGS DE DIAGNOSTIC DÉTAILLÉS
  console.log('=== UPDATE CONTRACT COMPONENT - DIAGNOSTIC COMPLET ===');
  console.log('🔍 UpdateContract - RENDER - Début du rendu');
  console.log('🔍 UpdateContract - ID du contrat:', id);
  console.log('🔍 UpdateContract - Entity:', entity);
  console.log('🔍 UpdateContract - Config:', config);
  console.log('🔍 UpdateContract - CurrentResult:', currentResult);
  console.log('🔍 UpdateContract - IsSuccess:', isSuccess);
  console.log('🔍 UpdateContract - Form disponible:', !!form);
  console.log('🔍 UpdateContract - Form.current disponible:', !!(form && form.current));
  console.log('🔍 UpdateContract - isFormReady:', isFormReady);
  console.log('🔍 UpdateContract - processedContractData:', !!processedContractData);
  console.log('🔍 UpdateContract - siteTariffData:', !!siteTariffData);
  console.log('🔍 UpdateContract - prestations chargées:', prestations.length);

  // NOUVEAU : Charger les prestations
  const loadPrestations = async () => {
    try {
      console.log('🔍 UpdateContract - Chargement des prestations...');
      const response = await request.list({ entity: 'prestation' });
      
      if (response && response.success && response.result) {
        console.log('✅ UpdateContract - Prestations chargées:', response.result.length);
        setPrestations(response.result);
      } else {
        console.log('⚠️ UpdateContract - Aucune prestation trouvée');
        setPrestations([]);
      }
    } catch (error) {
      console.error('❌ UpdateContract - Erreur chargement prestations:', error);
      setPrestations([]);
    }
  };

  // NOUVEAU : Récupérer le siteTariff, site et prestation
  const loadSiteTariffData = async (contractData) => {
    try {
      console.log('🔍 UpdateContract - Analyse des services du contrat...');
      console.log('🔍 UpdateContract - Données du contrat reçues:', contractData);
      
      if (!contractData || !contractData.services || !Array.isArray(contractData.services)) {
        console.log('⚠️ UpdateContract - Aucun service trouvé dans le contrat');
        return;
      }

      console.log('🔍 UpdateContract - Nombre de services à traiter:', contractData.services.length);

      // Analyser chaque service
      contractData.services.forEach((service, index) => {
        console.log(`🔍 UpdateContract - Service ${index} - ANALYSE COMPLÈTE:`);
        console.log(`  - Service complet:`, service);
        console.log(`  - siteTariffId:`, service.siteTariffId);
        console.log(`  - site:`, service.site);
        console.log(`  - prestationType:`, service.prestationType);
        console.log(`  - numberOfAgents:`, service.numberOfAgents);
        console.log(`  - dailyRate:`, service.dailyRate);
        console.log(`  - hourlyRate:`, service.hourlyRate);
        console.log(`  - duration:`, service.duration);
        
        // NOUVEAU : Logs détaillés pour les sites
        if (service.site) {
          console.log(`🔍 UpdateContract - Service ${index} - SITE DÉTAILS:`);
          console.log(`  - Site ID:`, service.site._id);
          console.log(`  - Site Name:`, service.site.name);
          console.log(`  - Site Address:`, service.site.address);
          console.log(`  - Site City:`, service.site.city);
        }
        
        // NOUVEAU : Logs détaillés pour les prestations classiques
        if (service.prestationId) {
          console.log(`🔍 UpdateContract - Service ${index} - PRESTATION CLASSIQUE DÉTAILS:`);
          console.log(`  - Prestation ID:`, service.prestationId._id);
          console.log(`  - Prestation Name:`, service.prestationId.name);
          console.log(`  - Prestation Description:`, service.prestationId.description);
        }
        
        if (service.siteTariffId) {
          console.log(`🔍 UpdateContract - Service ${index} - siteTariffId trouvé:`, service.siteTariffId);
          
          // NOUVEAU : Le siteTariffId est déjà un objet complet, extraire son ID
          let siteTariffId;
          if (typeof service.siteTariffId === 'object' && service.siteTariffId._id) {
            siteTariffId = service.siteTariffId._id;
            console.log(`🔍 UpdateContract - Service ${index} - ID extrait du siteTariffId:`, siteTariffId);
            
            // NOUVEAU : Utiliser directement le siteTariff déjà présent dans le contrat
            const siteTariff = service.siteTariffId;
            const site = siteTariff.site;
            const prestation = siteTariff.prestation;
            
            console.log(`🔍 UpdateContract - Service ${index} - SiteTariff complet déjà disponible:`, siteTariff);
            console.log(`🔍 UpdateContract - Service ${index} - Site:`, site);
            console.log(`🔍 UpdateContract - Service ${index} - Prestation:`, prestation);
            
            // NOUVEAU : Logs détaillés pour le siteTariff
            if (site) {
              console.log(`🔍 UpdateContract - Service ${index} - SITE TARIF DÉTAILS:`);
              console.log(`  - Site ID:`, site._id);
              console.log(`  - Site Name:`, site.name);
              console.log(`  - Site Address:`, site.address);
              console.log(`  - Site City:`, site.city);
            }
            
            if (prestation) {
              console.log(`🔍 UpdateContract - Service ${index} - PRESTATION TARIF DÉTAILS:`);
              console.log(`  - Prestation ID:`, prestation._id);
              console.log(`  - Prestation Name:`, prestation.name);
              console.log(`  - Prestation Description:`, prestation.description);
            }
            
            // Stocker les données directement
            setSiteTariffData(prev => ({
              ...prev,
              [index]: { siteTariff, site, prestation }
            }));
            
          } else {
            siteTariffId = service.siteTariffId;
            console.log(`🔍 UpdateContract - Service ${index} - siteTariffId est déjà un ID:`, siteTariffId);
            
            // Requêter la collection sitetariff avec cet ID
            loadSiteTariffById(siteTariffId, index);
          }
        } else {
          console.log(`⚠️ UpdateContract - Service ${index} - Pas de siteTariffId`);
        }
      });
      
    } catch (error) {
      console.error('❌ UpdateContract - Erreur analyse services:', error);
    }
  };

  // NOUVEAU : Charger un siteTariff par ID
  const loadSiteTariffById = async (siteTariffId, serviceIndex) => {
    try {
      console.log(`🔍 UpdateContract - Chargement du siteTariff ${siteTariffId} pour le service ${serviceIndex}...`);
      
      const response = await request.get({ entity: 'sitetariff', id: siteTariffId });
      
      if (response && response.success && response.result) {
        const siteTariff = response.result;
        console.log(`✅ UpdateContract - SiteTariff ${siteTariffId} chargé:`, siteTariff);
        
        // Extraire site et prestation
        const site = siteTariff.site;
        const prestation = siteTariff.prestation;
        
        console.log(`🔍 UpdateContract - Service ${serviceIndex} - Site:`, site);
        console.log(`🔍 UpdateContract - Service ${serviceIndex} - Prestation:`, prestation);
        
        // NOUVEAU : Logs détaillés pour le siteTariff chargé
        if (site) {
          console.log(`🔍 UpdateContract - Service ${serviceIndex} - SITE TARIF CHARGÉ DÉTAILS:`);
          console.log(`  - Site ID:`, site._id);
          console.log(`  - Site Name:`, site.name);
          console.log(`  - Site Address:`, site.address);
          console.log(`  - Site City:`, site.city);
        }
        
        if (prestation) {
          console.log(`🔍 UpdateContract - Service ${serviceIndex} - PRESTATION TARIF CHARGÉ DÉTAILS:`);
          console.log(`  - Prestation ID:`, prestation._id);
          console.log(`  - Prestation Name:`, prestation.name);
          console.log(`  - Prestation Description:`, prestation.description);
        }
        
        // Stocker les données
        setSiteTariffData(prev => ({
          ...prev,
          [serviceIndex]: { siteTariff, site, prestation }
        }));
        
      } else {
        console.log(`⚠️ UpdateContract - SiteTariff ${siteTariffId} non trouvé`);
      }
    } catch (error) {
      console.error(`❌ UpdateContract - Erreur chargement siteTariff ${siteTariffId}:`, error);
    }
  };

  // NOUVEAU : useEffect pour charger les prestations au montage
  useEffect(() => {
    console.log('🔍 UpdateContract - useEffect - Chargement des prestations');
    loadPrestations();
  }, []);

  // NOUVEAU : useEffect pour traiter les données du contrat
  useEffect(() => {
    console.log('🔍 UpdateContract - useEffect - Traitement des données du contrat');
    console.log('🔍 UpdateContract - currentResult:', currentResult);
    console.log('🔍 UpdateContract - isSuccess:', isSuccess);
    
    if (currentResult && isSuccess) {
      console.log('🔍 UpdateContract - Traitement des données du contrat...');
      
      try {
        // Convertir les dates en objets dayjs
        const processedData = { ...currentResult };
        
        console.log('🔍 UpdateContract - Données brutes du contrat:', processedData);
        
        // Traiter les dates si elles existent
        if (processedData.startDate) {
          console.log('🔍 UpdateContract - Conversion date début:', processedData.startDate);
          processedData.startDate = dayjs(processedData.startDate);
          console.log('🔍 UpdateContract - Date début convertie:', processedData.startDate);
        }
        if (processedData.endDate) {
          console.log('🔍 UpdateContract - Conversion date fin:', processedData.endDate);
          processedData.endDate = dayjs(processedData.endDate);
          console.log('🔍 UpdateContract - Date fin convertie:', processedData.endDate);
        }
        if (processedData.signatureDate) {
          console.log('🔍 UpdateContract - Conversion date signature:', processedData.signatureDate);
          processedData.signatureDate = dayjs(processedData.signatureDate);
          console.log('🔍 UpdateContract - Date signature convertie:', processedData.signatureDate);
        }
        
        console.log('🔍 UpdateContract - Données traitées avant setState:', processedData);
        setProcessedContractData(processedData);
        console.log('✅ UpdateContract - Données du contrat traitées et stockées');
        
        // NOUVEAU : Charger les données du siteTariff
        loadSiteTariffData(processedData);
        
      } catch (error) {
        console.error('❌ UpdateContract - Erreur traitement données:', error);
        setProcessedContractData(currentResult);
      }
    } else {
      console.log('🔍 UpdateContract - Conditions non remplies pour le traitement des données');
      console.log('  - currentResult:', !!currentResult);
      console.log('  - isSuccess:', isSuccess);
    }
  }, [currentResult, isSuccess]);

  // AJOUTER : Nouvel useEffect pour le regroupement des services
  useEffect(() => {
    if (processedContractData && processedContractData.services && Array.isArray(processedContractData.services)) {
      console.log('🔍 UpdateContract - === REGROUPEMENT IMMÉDIAT DES SERVICES ===');
      
      // Regroupement des services par site
      const servicesBySite = new Map();
      
      processedContractData.services.forEach((service, index) => {
        const siteId = service.site?._id || service.site;
        const siteName = service.site?.name || 'Site inconnu';
        
        if (!servicesBySite.has(siteId)) {
          servicesBySite.set(siteId, {
            selectedSite: siteId,
            prestationType: service.prestationType || 'site_specific',
            prestations: []
          });
        }
        
        const siteService = servicesBySite.get(siteId);
        const prestationData = {
          prestation: service.prestationType === 'classic' 
            ? (service.prestationId?._id || service.prestationId)
            : null,
          numberOfAgents: service.numberOfAgents || 1,
          dailyRate: service.dailyRate || 0,
          hourlyRate: service.hourlyRate || 0,
          duration: service.duration || 12
        };
        
        siteService.prestations.push(prestationData);
      });
      
      const groupedServices = Array.from(servicesBySite.values());
      console.log('✅ UpdateContract - Services groupés:', groupedServices.length, 'sites');
      
      // Stocker les services groupés pour plus tard
      setGroupedServices(groupedServices);
    }
  }, [processedContractData]);

  // MODIFIER : L'ancien useEffect pour utiliser les services déjà groupés
  useEffect(() => {
    if (processedContractData && groupedServices && form && form.current && isFormReady) {
      // Pré-remplir le formulaire avec les services déjà groupés
      const formValues = {
        number: processedContractData.number,
        client: processedContractData.client?._id || processedContractData.client,
        paymentMode: processedContractData.paymentMode?._id || processedContractData.paymentMode,
        startDate: processedContractData.startDate,
        endDate: processedContractData.endDate,
        siret: processedContractData.siret,
        representativeName: processedContractData.representativeName,
        rib: processedContractData.rib,
        banque: processedContractData.banque,
        description: processedContractData.description,
        reference: processedContractData.reference,
        services: groupedServices
      };
      
      form.current.setFieldsValue(formValues);
    }
  }, [processedContractData, groupedServices, form, isFormReady]);

  // NOUVEAU : useEffect pour vérifier l'initialisation du formulaire
  useEffect(() => {
    console.log('🔍 UpdateContract - Vérification initialisation formulaire...');
    
    // Première vérification
    if (form && form.current) {
      console.log('✅ UpdateContract - Formulaire disponible immédiatement');
      setIsFormReady(true);
      return;
    }
    
    // Délai de 500ms
    const timer1 = setTimeout(() => {
      console.log('🔍 UpdateContract - Vérification après 500ms');
      if (form && form.current) {
        console.log('✅ UpdateContract - Formulaire disponible après 500ms');
        setIsFormReady(true);
      }
    }, 500);
    
    // Fallback de 1000ms
    const timer2 = setTimeout(() => {
      console.log('🔍 UpdateContract - Fallback après 1000ms');
      setIsFormReady(true);
    }, 1000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [form]);

  // NOUVEAU : Logs avant le rendu final
  console.log('🔍 UpdateContract - AVANT RENDU FINAL');
  console.log('🔍 UpdateContract - isFormReady:', isFormReady);
  console.log('🔍 UpdateContract - processedContractData:', !!processedContractData);
  console.log('🔍 UpdateContract - form disponible:', !!(form && form.current));
  console.log('🔍 UpdateContract - siteTariffData:', siteTariffData);

  // Afficher un loader tant que le formulaire n'est pas prêt
  if (!isFormReady || !processedContractData) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h3>Initialisation du formulaire...</h3>
        <p>Veuillez patienter pendant le chargement...</p>
        <p>État: {isFormReady ? 'Formulaire prêt' : 'Formulaire en cours...'} | Données: {processedContractData ? 'Chargées' : 'En cours...'}</p>
      </div>
    );
  }

  // NOUVEAU : Logs de succès
  console.log('✅ UpdateContract - RENDU DU FORMULAIRE');
  console.log('✅ UpdateContract - Formulaire prêt et données disponibles');

  return (
    <ConfigProvider locale={locale}>
      <div>
        <div style={{ marginBottom: 16 }}>
          <Title level={3}>
            {translate('Modifier')} {translate('Contract')}
          </Title>
        </div>

        <ContractForm
          isUpdateForm={true}
          formRef={form}
          onFinish={(values) => {
            console.log('🔍 UpdateContract - onFinish appelé avec:', values);
            
            // Appeler l'action de mise à jour
            dispatch(erp.update({ entity, id, jsonData: values }));
            
            // Rediriger vers la page de lecture du contrat
            navigate(`/contracts/read/${id}`);
          }}
          current={processedContractData}
          prestations={prestations}
        />

        <Divider />

        <div style={{ marginTop: 16 }}>
          <Space>
            <Button
              icon={<CloseCircleOutlined />}
              onClick={() => navigate(`/${entity}`)}
            >
              {translate('Fermer')}
            </Button>
          </Space>
        </div>
      </div>
    </ConfigProvider>
  );
} 