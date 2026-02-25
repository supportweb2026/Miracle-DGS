import React, { useRef } from 'react';
import { Form, Input, DatePicker, Button, Card, Row, Col, Select, Divider, Switch, message } from 'antd';
import { PlusOutlined, MinusCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import AutoCompleteAsync from '@/components/AutoCompleteAsync';
import { request } from '@/request';
import { useState, useEffect } from 'react';
import { selectFinanceSettings } from '@/redux/settings/selectors';
import { useSelector, useDispatch } from 'react-redux';
import { settingsAction } from '@/redux/settings/actions';

export default function ContractForm({ isUpdateForm = false, formRef: externalFormRef, onFinish: parentOnFinish, ...props }) {
  const translate = useLanguage();
  const dispatch = useDispatch();
  
  // SOLUTION : TOUJOURS utiliser le formRef local pour éviter les problèmes de timing
  const localFormRef = useRef();
  const formRef = localFormRef; // Forcer l'utilisation du formRef local
  
  // IMPORTANT : Exposer le formRef local au composant parent si nécessaire
  React.useImperativeHandle(externalFormRef, () => ({
    ...formRef.current,
    setSiteTariffsMap: setSiteTariffsMap
  }), []);
  
  const [paymentMode, setPaymentMode] = useState(null);
  // Nouveau state pour le nom du mode de paiement
  const [paymentModeName, setPaymentModeName] = useState('');
  // Remplacer le state global par un Map pour stocker les tarifs par site
  const [siteTariffsMap, setSiteTariffsMap] = useState(new Map());
  // Nouveau state pour TOUS les tarifs sitetariff
  const [allSiteTariffs, setAllSiteTariffs] = useState([]);
  // Nouveau state pour les prestations classiques
  const [classicPrestations, setClassicPrestations] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedSiteName, setSelectedSiteName] = useState('');
  const [prestationTypeUpdate, setPrestationTypeUpdate] = useState(0);
  
  // NOUVEAU : State local pour stocker les siteTariffId par service
  const [serviceSiteTariffIds, setServiceSiteTariffIds] = useState(new Map());
  
  const { last_contract_number } = useSelector(selectFinanceSettings);
  
  const [lastNumber, setLastNumber] = useState(() => Number(last_contract_number) + Number(1));

  // Fonction pour transformer les données du formulaire avant l'envoi
  const transformFormData = (values) => {
    const transformedData = { 
      ...values,
      year: new Date().getFullYear() // Ajouter l'année courante
    };
    
    // Transformer les services pour correspondre au modèle backend
    if (values.services && Array.isArray(values.services)) {
      const transformedServices = [];
      
      values.services.forEach((service, serviceIndex) => {
        if (!service || !service.prestations || !Array.isArray(service.prestations)) {
          console.log(`⚠️ transformFormData - Service ${serviceIndex} invalide ou sans prestations:`, service);
          return;
        }
        
        // CORRECTION CRITIQUE : Convertir prestationType booléen en string
        let prestationType = service.prestationType;
        if (typeof prestationType === 'boolean') {
          prestationType = prestationType ? 'classic' : 'site_specific';
          console.log(`🔧 transformFormData - Service ${serviceIndex}: prestationType converti de ${service.prestationType} vers '${prestationType}'`);
        } else {
          prestationType = prestationType || 'site_specific';
        }
        
        // Traiter chaque prestation du service
        service.prestations.forEach((prestation, prestationIndex) => {
          if (!prestation || !prestation.prestation) {
            console.log(`⚠️ transformFormData - Prestation ${prestationIndex} invalide dans le service ${serviceIndex}:`, prestation);
            return;
          }
          
          // Créer un service transformé pour chaque prestation
          const transformedService = {
            numberOfAgents: prestation.numberOfAgents || 1,
            prestationType: prestationType, // Utiliser la valeur corrigée
            site: service.selectedSite?.id || service.selectedSite
          };
          
          console.log(`🔍 TRANSFORM - Service ${serviceIndex} Prestation ${prestationIndex}:`);
          console.log(`🔍 TRANSFORM - numberOfAgents original:`, prestation.numberOfAgents);
          console.log(`🔍 TRANSFORM - numberOfAgents transformé:`, transformedService.numberOfAgents);
          console.log(`🔍 TRANSFORM - prestationType:`, prestationType);
          
          // Gérer les prestations selon le type
          if (prestationType === 'site_specific') {
            // Mode site_specific : utiliser siteTariffId
            // CORRECTION : Récupérer le siteTariffId spécifiquement pour cette prestation
            let siteTariffId = null;
            
            // PRIORITÉ 1: Trouver le siteTariff correspondant à cette prestation spécifique
            if (prestation.prestation) {
              const siteTariffs = siteTariffsMap.get(serviceIndex) || [];
              console.log(`🔍 transformFormData - Service ${serviceIndex} Prestation ${prestationIndex}:`);
              console.log(`🔍 transformFormData - prestation.prestation:`, prestation.prestation);
              console.log(`🔍 transformFormData - siteTariffs disponibles:`, siteTariffs.length);
              console.log(`🔍 transformFormData - siteTariffs détail:`, siteTariffs.map(t => ({
                id: t._id,
                prestationId: t.prestation?._id,
                prestationName: t.prestation?.name
              })));
              
              const siteTariff = siteTariffs.find(t => {
                const match = t.prestation._id === prestation.prestation;
                console.log(`🔍 transformFormData - Comparaison: ${t.prestation._id} === ${prestation.prestation} = ${match}`);
                return match;
              });
              
              if (siteTariff) {
                siteTariffId = siteTariff._id;
                console.log(`✅ transformFormData - Service ${serviceIndex} Prestation ${prestationIndex}: siteTariffId trouvé:`, siteTariffId);
              } else {
                console.log(`⚠️ transformFormData - Service ${serviceIndex} Prestation ${prestationIndex}: Aucun siteTariff trouvé pour la prestation:`, prestation.prestation);
              }
            }
            
            // PRIORITÉ 2: Fallback - Essayer de récupérer depuis le state local (si disponible)
            if (!siteTariffId) {
              const localSiteTariffId = serviceSiteTariffIds.get(serviceIndex);
              if (localSiteTariffId) {
                siteTariffId = localSiteTariffId;
                console.log(`⚠️ transformFormData - Service ${serviceIndex} Prestation ${prestationIndex}: Utilisation du siteTariffId local:`, siteTariffId);
              }
            }
            
            // PRIORITÉ 3: Fallback - Essayer de récupérer depuis le service
            if (!siteTariffId && prestation.siteTariffId) {
              siteTariffId = prestation.siteTariffId;
              console.log(`⚠️ transformFormData - Service ${serviceIndex} Prestation ${prestationIndex}: Utilisation du siteTariffId du service:`, siteTariffId);
            }
            
            // Assigner le siteTariffId trouvé
            if (siteTariffId) {
              transformedService.siteTariffId = siteTariffId;
            }
            
            // VÉRIFICATION CRITIQUE
            if (!transformedService.siteTariffId) {
              console.error(`❌ transformFormData - CRITIQUE: Service ${serviceIndex} Prestation ${prestationIndex} n'a pas de siteTariffId après transformation!`);
              console.error(`❌ transformFormData - Prestation ID:`, prestation.prestation);
              console.error(`❌ transformFormData - SiteTariffs disponibles:`, siteTariffsMap.get(serviceIndex)?.length || 0);
            }
            
            // IMPORTANT: Récupérer et stocker les tarifs directement
            if (prestation.prestation) {
              const siteTariffs = siteTariffsMap.get(serviceIndex) || [];
              const siteTariff = siteTariffs.find(t => t.prestation._id === prestation.prestation);
              if (siteTariff) {
                // Stocker les tarifs directement dans le service
                transformedService.dailyRate = siteTariff.useCustomValues ? 
                  (siteTariff.customDailyRate || 0) : 
                  (siteTariff.prestation.baseDailyRate || 0);
                transformedService.hourlyRate = siteTariff.useCustomValues ? 
                  (siteTariff.customHourlyRate || 0) : 
                  (siteTariff.prestation.baseHourlyRate || 0);
                transformedService.duration = siteTariff.useCustomValues ? 
                  (siteTariff.customDuration || 0) : 
                  (siteTariff.prestation.baseDuration || 0);
              }
            }
          } else {
            // Mode classic : utiliser prestationId
            transformedService.prestationId = prestation.prestation;
            
            // IMPORTANT: Récupérer et stocker les tarifs depuis la prestation classique
            const classicPrestation = classicPrestations.find(p => p._id === prestation.prestation);
            if (classicPrestation) {
              transformedService.dailyRate = classicPrestation.baseDailyRate || 0;
              transformedService.hourlyRate = classicPrestation.baseHourlyRate || 0;
              transformedService.duration = classicPrestation.baseDuration || 0;
            }
          }
          
          transformedServices.push(transformedService);
        });
      });
      
      console.log('🔍 === RÉSULTAT FINAL TRANSFORMATION ===');
      console.log('🔍 Nombre de services transformés:', transformedServices.length);
      transformedServices.forEach((service, index) => {
        console.log(`🔍 Service final ${index}:`, {
          numberOfAgents: service.numberOfAgents,
          prestationType: service.prestationType,
          site: service.site,
          siteTariffId: service.siteTariffId,
          prestationId: service.prestationId
        });
      });
      console.log('🔍 === FIN RÉSULTAT TRANSFORMATION ===');
      
      transformedData.services = transformedServices;
    }
      
    return transformedData;
  };

  // Fonction onFinish personnalisée qui transforme les données
  const handleFormFinish = async (values) => {
    console.log('🚨 CONTRACTFORM - handleFormFinish appelé avec:', values);
    console.log('🚨 CONTRACTFORM - parentOnFinish disponible:', !!parentOnFinish);
    console.log('🚨 CONTRACTFORM - formRef disponible:', !!formRef);
    
    // LOGS DÉTAILLÉS POUR LE NOMBRE D'AGENTS
    console.log('🔍 === ANALYSE NOMBRE D\'AGENTS ===');
    if (values.services && Array.isArray(values.services)) {
      values.services.forEach((service, serviceIndex) => {
        console.log(`🔍 Service ${serviceIndex}:`, service);
        if (service.prestations && Array.isArray(service.prestations)) {
          service.prestations.forEach((prestation, prestationIndex) => {
            console.log(`🔍 Service ${serviceIndex} Prestation ${prestationIndex}:`, {
              prestation: prestation.prestation,
              numberOfAgents: prestation.numberOfAgents,
              dailyRate: prestation.dailyRate,
              hourlyRate: prestation.hourlyRate
            });
          });
        }
      });
    }
    console.log('🔍 === FIN ANALYSE NOMBRE D\'AGENTS ===');
    
    try {
      // IMPORTANT: Synchroniser complètement le formulaire avant la transformation
      if (formRef && formRef.current) {
        console.log('🚨 CONTRACTFORM - Synchronisation du formulaire...');
        const syncSuccess = await syncFormData();
        
        if (syncSuccess) {
          // Récupérer les valeurs synchronisées
          const syncedValues = formRef.current.getFieldsValue();
          console.log('🚨 CONTRACTFORM - Valeurs synchronisées:', syncedValues);
          
          // Fusionner avec les valeurs reçues
          const mergedValues = { ...values, ...syncedValues };
          console.log('🚨 CONTRACTFORM - Valeurs fusionnées:', mergedValues);
          
          const transformedData = transformFormData(mergedValues);
          console.log('🚨 CONTRACTFORM - Données transformées:', transformedData);
          
          // Appeler la fonction onFinish parent si elle existe
          if (parentOnFinish) {
            console.log('🚨 CONTRACTFORM - Appel de parentOnFinish avec:', transformedData);
            await parentOnFinish(transformedData);
            console.log('🚨 CONTRACTFORM - parentOnFinish terminé avec succès');
          } else {
            console.log('⚠️ CONTRACTFORM - parentOnFinish non disponible');
          }
        } else {
          console.log('⚠️ CONTRACTFORM - Échec de la synchronisation');
          message.error('Erreur lors de la synchronisation des données');
        }
      } else {
        console.log('⚠️ CONTRACTFORM - formRef non disponible');
        message.error('Erreur: formulaire non disponible');
      }
    } catch (error) {
      console.error('❌ CONTRACTFORM - Erreur lors de la transformation:', error);
      message.error('Erreur lors de la soumission du formulaire');
    }
  };

  // NOUVELLE FONCTION : Transformation des données AVANT envoi au parent
  const transformAndSendToParent = async (values) => {
    try {
      // IMPORTANT: Synchroniser complètement le formulaire avant la transformation
      const syncSuccess = await syncFormData();
      
      if (syncSuccess) {
        // Récupérer les valeurs synchronisées
        const syncedValues = formRef && formRef.current ? formRef.current.getFieldsValue() : {};
        
        // Fusionner avec les valeurs reçues
        const mergedValues = { ...values, ...syncedValues };
        
        // Transformer les données avec le state local
        const transformedData = transformFormData(mergedValues);
        
        // Appeler la fonction onFinish parent avec les données transformées
        if (parentOnFinish) {
          await parentOnFinish(transformedData);
        }
      } else {
        console.log('⚠️ transformAndSendToParent - Échec de la synchronisation');
        message.error('Erreur lors de la synchronisation des données');
      }
    } catch (error) {
      console.error('❌ transformAndSendToParent - Erreur lors de la transformation:', error);
      message.error('Erreur lors de la transformation des données');
    }
  };

  // NOUVEAU : useEffect pour initialiser le formulaire avec les données existantes (mode update)
  useEffect(() => {
    if (props.current && formRef && formRef.current && isUpdateForm) {
      console.log('🔍 useEffect - INITIALISATION DU FORMULAIRE AVEC DONNÉES EXISTANTES');
      console.log('🔍 useEffect - Données reçues:', props.current);
      
      try {
        // Préparer les données pour le formulaire
        const formData = { ...props.current };
        
        // Convertir les dates si elles sont des strings
        if (formData.startDate && typeof formData.startDate === 'string') {
          formData.startDate = new Date(formData.startDate);
        }
        if (formData.endDate && typeof formData.endDate === 'string') {
          formData.endDate = new Date(formData.endDate);
        }
        
        // Transformer les services pour correspondre à la structure attendue
        if (formData.services && Array.isArray(formData.services)) {
          const transformedServices = formData.services.map((service, index) => {
            console.log(`🔍 CONTRACT FORM - Transformation service ${index}:`, service);
            console.log(`🔍 CONTRACT FORM - prestationType:`, service.prestationType);
            console.log(`🔍 CONTRACT FORM - site:`, service.site);
            console.log(`🔍 CONTRACT FORM - siteTariffId:`, service.siteTariffId);
            console.log(`🔍 CONTRACT FORM - prestationId:`, service.prestationId);
            
            // Déterminer le type de prestation
            const prestationType = service.prestationType || 'site_specific';
            
            let selectedSite, prestation;
            
            if (prestationType === 'site_specific') {
              // Service spécifique au site
              selectedSite = service.site || service.siteTariffId?.site;
              prestation = service.siteTariffId?.prestation?._id || service.siteTariffId?.prestation;
              console.log(`🔍 CONTRACT FORM - Service ${index} SITE_SPECIFIC - Site:`, selectedSite, 'Prestation:', prestation);
            } else {
              // Service classique
              selectedSite = service.site;
              prestation = service.prestationId?._id || service.prestationId;
              console.log(`🔍 CONTRACT FORM - Service ${index} CLASSIC - Site:`, selectedSite, 'Prestation:', prestation);
            }
            
            // Créer la structure attendue par le formulaire
            return {
              selectedSite: selectedSite?._id || selectedSite, // Extraire l'ID si c'est un objet
              prestationType: prestationType,
              prestations: [{
                prestation: prestation,
                numberOfAgents: service.numberOfAgents || 1,
                dailyRate: service.dailyRate || 0,
                hourlyRate: service.hourlyRate || 0
              }]
            };
          });
          
          formData.services = transformedServices;
          console.log('🔍 CONTRACT FORM - Services transformés:', transformedServices);
        }
        
        // Supprimer les champs qui ne sont pas des champs de formulaire
        delete formData._id;
        delete formData.__v;
        delete formData.created;
        delete formData.removed;
        
        console.log('🔍 useEffect - Données finales pour le formulaire:', formData);
        
        // Initialiser le formulaire avec les données
        formRef.current.setFieldsValue(formData);
        console.log('🔍 useEffect - FORMULAIRE INITIALISÉ AVEC SUCCÈS');
        
      } catch (error) {
        console.error('❌ useEffect - Erreur lors de l\'initialisation du formulaire:', error);
      }
    }
  }, [props.current, formRef, isUpdateForm]);

  useEffect(() => {
    // Charger la prestation classique au montage du composant
    loadClassicPrestations();
    // Charger TOUS les tarifs sitetariff au montage du composant
    loadAllSiteTariffs();
    
    // Log de débogage pour vérifier l'état initial
    console.log('🔍 useEffect - État initial du composant');
    console.log('🔍 useEffect - formRef disponible:', !!formRef);
    console.log('🔍 useEffect - siteTariffsMap initial:', siteTariffsMap);
    console.log('🔍 useEffect - allSiteTariffs initial:', allSiteTariffs);
    console.log('🔍 useEffect - classicPrestations initial:', classicPrestations);
    
    // Vérifier l'état initial du form après un délai
    setTimeout(() => {
      console.log('🔍 useEffect - Vérification après timeout de 500ms');
      console.log('🔍 useEffect - formRef disponible après timeout:', !!formRef);
      console.log('🔍 useEffect - formRef.current disponible après timeout:', !!(formRef && formRef.current));
      
      if (formRef && formRef.current) {
        console.log('🔍 useEffect - Vérification de l\'état initial du form après timeout');
        const services = formRef.current.getFieldValue('services') || [];
        console.log('🔍 useEffect - Services dans le form:', services);
        
        services.forEach((service, index) => {
          if (service) {
            console.log(`🔍 useEffect - Service ${index}:`, service);
            console.log(`🔍 useEffect - Service ${index} prestationType:`, service.prestationType);
          }
        });
        
        // Forcer l'initialisation du champ prestationType pour tous les services
        console.log('🔍 useEffect - Forçage de l\'initialisation des champs prestationType');
        const updatedServices = services.map((service, index) => {
          if (service && !service.prestationType) {
            return { ...service, prestationType: 'site_specific' };
          }
          return service;
        });
        
        if (JSON.stringify(services) !== JSON.stringify(updatedServices)) {
          console.log('🔍 useEffect - Mise à jour des services avec prestationType initialisé');
          formRef.current.setFieldsValue({ services: updatedServices });
          console.log('🔍 useEffect - Services mis à jour avec succès');
        } else {
          console.log('🔍 useEffect - Aucune mise à jour nécessaire, tous les services ont déjà prestationType');
        }
      } else {
        console.log('⚠️ useEffect - formRef toujours non disponible après timeout');
        console.log('⚠️ useEffect - formRef:', formRef);
        console.log('⚠️ useEffect - formRef?.current:', formRef?.current);
      }
    }, 500);
  }, []);

  useEffect(() => {
    console.log('🔍 useEffect - DÉBUT - Changement détecté');
    console.log('🔍 useEffect - paymentMode a changé:', paymentMode);
    console.log('🔍 useEffect - Type de paymentMode:', typeof paymentMode);
    console.log('🔍 useEffect - paymentMode est null/undefined:', paymentMode === null || paymentMode === undefined);
    console.log('🔍 useEffect - formRef disponible:', !!formRef);
    console.log('🔍 useEffect - formRef.current disponible:', !!(formRef && formRef.current));
    console.log('🔍 useEffect - État complet du composant:', {
      paymentMode,
      siteTariffsMap: siteTariffsMap.size,
      classicPrestations: classicPrestations.length,
      selectedSite,
      selectedSiteName,
      lastNumber
    });
    
    // Log des valeurs du formulaire si disponible
    if (formRef && formRef.current) {
      try {
        const formValues = formRef.current.getFieldsValue();
        console.log('🔍 useEffect - Valeurs du formulaire:', formValues);
        console.log('🔍 useEffect - Mode de paiement dans le form:', formValues.paymentMode);
        console.log('🔍 useEffect - Date de début dans le form:', formValues.startDate);
        console.log('🔍 useEffect - Date de fin dans le form:', formValues.endDate);
      } catch (error) {
        console.log('⚠️ useEffect - Erreur lors de la lecture des valeurs du form:', error);
      }
    }
    
    console.log('🔍 useEffect - FIN - Changement traité');
  }, [paymentMode]);

  const loadClassicPrestations = async () => {
    try {
      const response = await request.list({ entity: 'prestation' });
      
      if (response && response.success && response.result) {
        console.log('🔍 loadClassicPrestations - Prestations trouvées:', response.result.length);
        setClassicPrestations(response.result);
      } else {
        console.log('⚠️ loadClassicPrestations - Aucune prestation trouvée ou réponse invalide');
        setClassicPrestations([]);
      }
    } catch (error) {
      console.error('❌ loadClassicPrestations - Erreur:', error);
      setClassicPrestations([]);
    }
  };

  const loadAllSiteTariffs = async () => {
    try {
      const response = await request.list({ 
        entity: 'sitetariff',
        additionalFilters: {
          removed: false
        }
      });
      
      if (response && response.success && response.result) {
        console.log('🔍 loadAllSiteTariffs - Tous les tarifs trouvés:', response.result.length);
        setAllSiteTariffs(response.result);
        
        // Log détaillé pour debug
        console.log('🔍 loadAllSiteTariffs - DÉTAIL DE TOUS LES TARIFS:');
        response.result.forEach((tariff, index) => {
          console.log(`  ${index + 1}. Site: ${tariff.site}, Prestation: ${tariff.prestation?.name || 'NOM MANQUANT'} (ID: ${tariff.prestation?._id || 'ID MANQUANT'})`);
        });
      } else {
        console.log('⚠️ loadAllSiteTariffs - Aucun tarif trouvé ou réponse invalide');
        setAllSiteTariffs([]);
      }
    } catch (error) {
      console.error('❌ loadAllSiteTariffs - Erreur:', error);
      setAllSiteTariffs([]);
    }
  };

  useEffect(() => {
    if (last_contract_number !== undefined && last_contract_number !== null) {
      setLastNumber(Number(last_contract_number) + Number(1));
      if (formRef && formRef.current) {
        formRef.current.setFieldsValue({ 
          number: Number(last_contract_number) + Number(1)
        });
      }
    }
  }, [last_contract_number, formRef]);

  // NOUVEAU : useEffect pour charger les données initiales au montage du composant
  useEffect(() => {
    console.log('=== CONTRACT FORM INITIALIZATION EFFECT ===');
    console.log('🔍 Chargement des données initiales...');
    
    // Charger les prestations classiques
    loadClassicPrestations();
    
    // Charger tous les tarifs de site
    loadAllSiteTariffs();
    
    console.log('✅ Données initiales chargées');
  }, []); // Seulement au montage du composant


  // Ajout du console.log pour voir la valeur du numéro affiché dans le formulaire
  console.log('Current lastNumber value:', lastNumber);
  

  const handlePaymentModeChange = async (value) => {
    if (value) {
      // Extraire l'ID et le nom du mode de paiement
      const paymentModeId = value.id || value;
      const paymentModeName = value.name || '';
      
      // Stocker l'ID et le nom du mode de paiement
      setPaymentMode(paymentModeId);
      setPaymentModeName(paymentModeName);
    } else {
      console.log('🔍 handlePaymentModeChange - Aucun mode de paiement sélectionné');
      setPaymentMode(null);
      setPaymentModeName('');
    }
  };

  const handleSiteChange = async (value, siteField) => {
    console.log('🔍 SITE - Changement détecté:', { value, siteField: siteField.name });
    
    // Vérifier la structure de value
    if (!value) {
      console.log('❌ SITE - Value est null/undefined');
      return;
    }
    
    // value peut être soit un objet avec id, soit directement l'id
    const siteId = value.id || value;
    const siteName = value.name || value;
    
    console.log('🔍 SITE - Extraction des valeurs:', { siteId, siteName });
    
    if (!siteId) {
      console.log('❌ SITE - ID du site manquant dans:', value);
      return;
    }
    
    try {
      console.log('🔍 SITE - Filtrage des tarifs pour le site:', siteId);
      console.log('🔍 SITE - Nombre total de tarifs disponibles:', allSiteTariffs.length);
      
      // Filtrer les tarifs pour ce site depuis la liste globale
      const siteTariffs = allSiteTariffs.filter(tariff => {
        // CORRECTION : Extraire l'ID du site depuis l'objet complet
        let tariffSiteId;
        if (tariff.site && typeof tariff.site === 'object') {
          // Si tariff.site est un objet, essayer de récupérer l'ID
          tariffSiteId = tariff.site._id || tariff.site.id || tariff.site.$oid;
        } else {
          // Si tariff.site est directement l'ID
          tariffSiteId = tariff.site;
        }
        
        // Améliorer la comparaison des IDs
        const isMatch = String(tariffSiteId) === String(siteId);
        return isMatch;
      });
      
      console.log('🔍 SITE - Tarifs trouvés pour le site:', siteTariffs.length);
      
      if (siteTariffs.length > 0) {
        // Log détaillé de chaque tarif pour identifier les doublons
        console.log('🔍 SITE - Détail des tarifs trouvés:');
        siteTariffs.forEach((tariff, index) => {
          console.log(`  ${index + 1}. Site: ${tariff.site?.name || 'NOM MANQUANT'}, Prestation: ${tariff.prestation?.name || 'NOM MANQUANT'}, Tarif ID: ${tariff._id}`);
        });
        
        // Vérifier s'il y a des doublons de prestation
        const prestationIds = siteTariffs.map(t => t.prestation?._id).filter(Boolean);
        const uniquePrestationIds = [...new Set(prestationIds)];
        
        if (prestationIds.length !== uniquePrestationIds.length) {
          console.log('⚠️ SITE - DOUBLONS DÉTECTÉS, déduplication en cours...');
          
          // DÉDUPLICATION : Ne garder qu'un tarif par prestation
          const uniqueTariffs = [];
          const seenPrestations = new Set();
          
          siteTariffs.forEach((tariff) => {
            const prestationId = tariff.prestation?._id;
            if (prestationId && !seenPrestations.has(prestationId)) {
              seenPrestations.add(prestationId);
              uniqueTariffs.push(tariff);
            }
            })
          
          console.log('🔍 SITE - Tarifs après déduplication:', uniqueTariffs.length);
          
          // Utiliser les tarifs dédupliqués
          setSiteTariffsMap(prev => {
            const newMap = new Map(prev);
            newMap.set(siteField.name, uniqueTariffs);
            return newMap;
          });
        } else {
          // Pas de doublons, utiliser tous les tarifs
          setSiteTariffsMap(prev => {
            const newMap = new Map(prev);
            newMap.set(siteField.name, siteTariffs);
            return newMap;
          });
        }
        
        // Mettre à jour le nom du site sélectionné
        setSelectedSiteName(siteName);
        setSelectedSite(siteId);
        
        // Vérifier l'état actuel du switch prestation pour ce site
        if (formRef && formRef.current) {
          try {
            const currentPrestationType = formRef.current.getFieldValue(['services', siteField.name, 'prestationType']);
            console.log('🔍 SITE - Type de prestation actuel:', currentPrestationType);
            
            // Mettre à jour le formulaire avec le site sélectionné
            const currentServices = formRef.current.getFieldValue('services') || [];
            
            const updatedServices = currentServices.map((service, index) => {
              if (index === siteField.name) {
                return { ...service, selectedSite: siteId };
              }
              return service;
            });
            
            formRef.current.setFieldsValue({ services: updatedServices });
            console.log('✅ SITE - Formulaire mis à jour avec le site:', siteId);
            
          } catch (error) {
            console.log('⚠️ Erreur lors de la mise à jour des services:', error);
          }
        }
      } else {
        console.log('⚠️ SITE - Aucun tarif trouvé pour ce site');
        setSiteTariffsMap(prev => {
          const newMap = new Map(prev);
          newMap.set(siteField.name, []);
          return newMap;
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors du filtrage des tarifs du site:', error);
      setSiteTariffsMap(prev => {
        const newMap = new Map(prev);
        newMap.set(siteField.name, []);
        return newMap;
      });
    }
  };

  const handleServiceChange = async (siteField, prestationField, value) => {
    console.log('🔍 SERVICE - Changement détecté:', { siteField: siteField.name, prestationField: prestationField.name, value: value });
    if (!value || !value.id) {
      console.log('❌ SERVICE - ERREUR: ID de la prestation manquant');
      return;
    }
    
    try {
      // Déterminer le type de prestation
      const prestationType = formRef && formRef.current ? 
        formRef.current.getFieldValue(['services', siteField.name, 'prestationType']) || 'site_specific' : 
        'site_specific';
      
      let dailyRate = 0;
      let hourlyRate = 0;
      let duration = 0;
      let siteTariffId = null;
      
      if (prestationType === 'site_specific') {
        // Prestation spécifique au site
        const siteTariffs = siteTariffsMap.get(siteField.name) || [];
        
        const tariff = siteTariffs.find(t => t.prestation._id === value.id);
        
        if (tariff) {
          // IMPORTANT: Récupérer le siteTariffId (ID de l'objet SiteTariff)
          siteTariffId = tariff._id;
          
          if (tariff.useCustomValues) {
            dailyRate = tariff.customDailyRate || 0;
            hourlyRate = tariff.customHourlyRate || 0;
            duration = tariff.customDuration || 0;
          } else {
            dailyRate = tariff.prestation.baseDailyRate || 0;
            hourlyRate = tariff.prestation.baseHourlyRate || 0;
            duration = tariff.prestation.baseDuration || 0;
          }
        } else {
          console.log('⚠️ handleServiceChange - Aucun tarif trouvé pour cette prestation');
        }
      } else {
        // Prestation classique
        const prestation = classicPrestations.find(p => p._id === value.id);
        
        if (prestation) {
          dailyRate = prestation.baseDailyRate || 0;
          hourlyRate = prestation.baseHourlyRate || 0;
          duration = prestation.baseDuration || 0;
        }
      }
      
      // Mettre à jour le formulaire avec les tarifs ET le siteTariffId
      if (formRef && formRef.current) {
        try {
          // Mettre à jour les tarifs (CORRECTION : utiliser la nouvelle structure)
          formRef.current.setFieldsValue({
            [`services.${siteField.name}.prestations.${prestationField.name}.dailyRate`]: dailyRate,
            [`services.${siteField.name}.prestations.${prestationField.name}.hourlyRate`]: hourlyRate,
            [`services.${siteField.name}.prestations.${prestationField.name}.duration`]: duration
          });
          
          // IMPORTANT: Stocker le siteTariffId pour ce service
          if (siteTariffId) {
            // Stocker dans le state local ET dans le formulaire
            setServiceSiteTariffIds(prev => {
              const newMap = new Map(prev);
              newMap.set(siteField.name, siteTariffId);
              return newMap;
            });
            
            // Stocker aussi dans le formulaire si disponible
            if (formRef && formRef.current) {
              formRef.current.setFieldsValue({
                [`services.${siteField.name}.prestations.${prestationField.name}.siteTariffId`]: siteTariffId
              });
            }
          }
          
        } catch (error) {
          console.log('⚠️ Erreur lors de la mise à jour du formulaire:', error);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des détails de la prestation:', error);
      message.error('Erreur lors de la récupération des détails de la prestation');
    }
  };

  const handleSitePrestationTypeChange = (siteField, checked) => {
    const newType = checked ? 'classic' : 'site_specific';
    
    // Log de l'état avant le changement
    if (formRef && formRef.current) {
      try {
        const oldPrestationType = formRef.current.getFieldValue(['services', siteField.name, 'prestationType']);
        
        // Log des prestations disponibles avant le changement
        if (oldPrestationType === 'site_specific') {
          const oldSiteTariffs = siteTariffsMap.get(siteField.name) || [];
          console.log('🔍 handleSitePrestationTypeChange - Prestation SITE SPECIFIC avant changement:', oldSiteTariffs.length);
        } else {
          console.log('🔍 handleSitePrestationTypeChange - Prestation CLASSIC avant changement:', classicPrestations.length);
        }
      } catch (error) {
        console.log('⚠️ handleSitePrestationTypeChange - Erreur lors de la vérification de l\'état avant:', error);
      }
    }
    
    // Mettre à jour le type de prestation du site
    if (formRef && formRef.current) {
      try {
        // Vérifier d'abord la structure actuelle du form
        const currentServices = formRef.current.getFieldValue('services') || [];
        
        const fieldPath = `services.${siteField.name}.prestationType`;
        
        // Mettre à jour le formulaire
        formRef.current.setFieldsValue({
          [fieldPath]: newType
        });
        console.log('✅ handleSitePrestationTypeChange - Formulaire mis à jour avec newType:', newType);
        
        // Vérifier que la mise à jour a bien eu lieu
        const updatedValue = formRef.current.getFieldValue(fieldPath);
        
        // Log des prestations disponibles après le changement
        if (newType === 'site_specific') {
          const newSiteTariffs = siteTariffsMap.get(siteField.name) || [];
          console.log('🔍 handleSitePrestationTypeChange - Prestation SITE SPECIFIC après changement:', newSiteTariffs.length);
          if (newSiteTariffs.length > 0) {
            console.log('🔍 handleSitePrestationTypeChange - Détail des prestations spécifiques disponibles:');
            newSiteTariffs.forEach((tariff, index) => {
              console.log(`  ${index + 1}. ${tariff.prestation?.name || 'Nom manquant'} (ID: ${tariff.prestation?._id || 'ID manquant'})`);
            });
          } else {
            console.log('⚠️ handleSitePrestationTypeChange - ATTENTION: Aucune prestation spécifique disponible pour ce site');
          }
        } else {
          console.log('🔍 handleSitePrestationTypeChange - Prestation CLASSIC après changement:', classicPrestations.length);
          if (classicPrestations.length > 0) {
            console.log('🔍 handleSitePrestationTypeChange - Détail des prestations classiques disponibles (premières 5):');
            classicPrestations.slice(0, 5).forEach((prestation, index) => {
              console.log(`  ${index + 1}. ${prestation.name} (ID: ${prestation._id})`);
            });
            if (classicPrestations.length > 5) {
              console.log(`  ... et ${classicPrestations.length - 5} autres prestations`);
            }
          }
        }
        
      } catch (error) {
        console.error('❌ handleSitePrestationTypeChange - Erreur lors de la mise à jour du champ:', error);
        console.error('❌ handleSitePrestationTypeChange - Stack trace:', error.stack);
      }
    } else {
      console.log('⚠️ handleSitePrestationTypeChange - formRef non disponible, impossible de mettre à jour le form');
    }
    
    // Réinitialiser toutes les prestations sélectionnées pour ce site
    if (formRef && formRef.current) {
      try {
        const currentServices = formRef.current.getFieldValue(['services', siteField.name, 'prestations']) || [];
        
        // Réinitialiser les prestations
        currentServices.forEach((_, index) => {
          const prestationPath = `services.${siteField.name}.prestations.${index}.prestation`;
          
          formRef.current.setFieldsValue({
            [prestationPath]: ''
          });
        });
        
        // CORRECTION : Nettoyer les champs selon le type de prestation
        if (newType === 'site_specific') {
          // Mode site_specific : vider prestationId, garder siteTariffId
          formRef.current.setFieldsValue({
            [`services.${siteField.name}.prestationId`]: null
          });
        } else {
          // Mode classic : vider siteTariffId, garder prestationId
          formRef.current.setFieldsValue({
            [`services.${siteField.name}.siteTariffId`]: null
          });
        }
        
        // CORRECTION CRITIQUE : S'assurer que prestationType reste une string AVANT le re-render
        formRef.current.setFieldsValue({
          [`services.${siteField.name}.prestationType`]: newType
        });
        console.log('🔍 handleSitePrestationTypeChange - CORRECTION FINALE - prestationType forcé à:', newType);

        // FORCER LE RE-RENDER en mettant à jour un champ factice
        formRef.current.setFieldsValue({
          [`services.${siteField.name}._forceUpdate`]: Date.now()
        });

        // CORRECTION FINALE : Forcer une dernière fois la valeur string
        setTimeout(() => {
          if (formRef && formRef.current) {
            formRef.current.setFieldsValue({
              [`services.${siteField.name}.prestationType`]: newType
            });
            console.log('🔍 handleSitePrestationTypeChange - CORRECTION FINALE TIMEOUT - prestationType forcé à:', newType);
          }
        }, 50);
        
      } catch (error) {
        console.error('❌ handleSitePrestationTypeChange - Erreur lors de la réinitialisation des prestations:', error);
      }
    }
    
    // Log supplémentaire pour vérifier l'état final
    setTimeout(() => {
      if (formRef && formRef.current) {
        const finalValue = formRef.current.getFieldValue(`services.${siteField.name}.prestationType`);
        
        // Log final des prestations disponibles
        if (finalValue === 'site_specific') {
          const finalSiteTariffs = siteTariffsMap.get(siteField.name) || [];
          console.log('🔍 handleSitePrestationTypeChange - État final: Mode SITE SPECIFIC avec', finalSiteTariffs.length, 'prestation');
        } else {
          console.log('🔍 handleSitePrestationTypeChange - État final: Mode CLASSIC avec', classicPrestations.length, 'prestation');
        }
      }
    }, 100);
  };

  // NOUVELLE FONCTION : Forcer la mise à jour du siteTariffId dans le formulaire
  const forceUpdateSiteTariffId = (siteIndex, prestationId) => {
    try {
      // CORRECTION : Ne s'exécuter que si on est en mode site_specific
      const prestationType = formRef && formRef.current ? 
        formRef.current.getFieldValue(['services', siteIndex, 'prestationType']) || 'site_specific' : 
        'site_specific';
      
      // Si on est en mode classic, ne pas chercher de siteTariffId
      if (prestationType === 'classic') {
        console.log('🔴 forceUpdateSiteTariffId - Mode classic détecté, pas de siteTariffId nécessaire');
        return;
      }
      
      // Récupérer les tarifs du site
      const siteTariffs = siteTariffsMap.get(siteIndex) || [];
      
      // Trouver le tarif correspondant à la prestation
      const tariff = siteTariffs.find(t => t.prestation._id === prestationId);
      if (tariff) {
        // Stocker dans le state local
        setServiceSiteTariffIds(prev => {
          const newMap = new Map(prev);
          newMap.set(siteIndex, tariff._id);
          return newMap;
        });
        
        // Mettre à jour le formulaire si disponible
        if (formRef && formRef.current) {
          formRef.current.setFieldsValue({
            [`services.${siteIndex}.prestations.${prestationId}.siteTariffId`]: tariff._id
          });
        }
        
      } else {
        console.log('⚠️ forceUpdateSiteTariffId - Aucun tarif trouvé pour la prestation:', prestationId);
      }
    } catch (error) {
      console.error('❌ forceUpdateSiteTariffId - Erreur lors de la mise à jour:', error);
    }
  };

  // NOUVELLE FONCTION : Synchroniser complètement le formulaire (OPTIMISÉE)
  const syncFormData = async () => {
    try {
      // Récupérer les valeurs du formulaire si disponible
      let currentValues = {};
      if (formRef && formRef.current) {
        currentValues = formRef.current.getFieldsValue();
      }
      
      let hasChanges = false;
      const corrections = [];
      
      // Vérifier et corriger tous les services (OPTIMISÉ)
      if (currentValues.services && Array.isArray(currentValues.services)) {
        for (let serviceIndex = 0; serviceIndex < currentValues.services.length; serviceIndex++) {
          const service = currentValues.services[serviceIndex];
          if (service && service.prestationType === 'site_specific' && service.prestations) {
            for (let prestationIndex = 0; prestationIndex < service.prestations.length; prestationIndex++) {
              const prestation = service.prestations[prestationIndex];
              if (prestation.prestation && !serviceSiteTariffIds.has(serviceIndex)) {
                console.log(`🔍 syncFormData - Correction nécessaire pour le service ${serviceIndex} prestation ${prestationIndex}`);
                corrections.push({ serviceIndex, prestationId: prestation.prestation });
                hasChanges = true;
              }
            }
          }
        }
      }
      
      if (hasChanges) {
        console.log(`🔍 syncFormData - ${corrections.length} corrections à appliquer:`, corrections);
        
        // Appliquer toutes les corrections en parallèle
        const correctionPromises = corrections.map(({ serviceIndex, prestationId }) => 
          forceUpdateSiteTariffId(serviceIndex, prestationId)
        );
        
        // Attendre que toutes les corrections soient appliquées
        await Promise.all(correctionPromises);
        
        // Attendre un peu pour laisser le state se mettre à jour
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('🔍 syncFormData - Synchronisation terminée avec corrections appliquées');
        console.log('🔍 syncFormData - État final serviceSiteTariffIds:', serviceSiteTariffIds);
      } else {
        console.log('🔍 syncFormData - Aucune correction nécessaire');
      }
      
      return true;
    } catch (error) {
      console.error('❌ syncFormData - Erreur lors de la synchronisation:', error);
      return false;
    }
  };

  return (
    <>
      <Form
        ref={formRef}
        onFinish={handleFormFinish}
        layout="vertical"
        {...props}
      >
        <Form.Item
          label="Numéro"
          name="number"
          rules={[{ required: true, message: 'Veuillez entrer un numéro!' }]}
          initialValue={lastNumber}
        >
        <Input 
          type="number" 
          placeholder="Numéro du contrat"
        />
      </Form.Item>

      {/* Sélection du client avec AutoCompleteAsync */}
      <Form.Item
        label="Client"
        name="client"
        rules={[{ required: true, message: 'Veuillez sélectionner un client!' }]}
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

      {/* Champ SIRET */}
      <Form.Item
        label="SIRET"
        name="siret"
        rules={[{ required: true, message: 'Veuillez entrer le SIRET!' }]}
      >
        <Input />
      </Form.Item>

      {/* Nom du représentant */}
      <Form.Item
        label="Nom du représentant"
        name="representativeName"
        rules={[{ required: true, message: 'Veuillez entrer le nom du représentant!' }]}
      >
        <Input />
      </Form.Item>

      {/* Sites et prestations */}
      <Card title="Sites et prestations" style={{ marginBottom: 16 }}>
        <Form.List
          name="services"
          initialValue={[
            {
              selectedSite: '',
              prestationType: 'site_specific',
              prestations: [
                {
                  prestation: '',
                  numberOfAgents: 1
                }
              ]
            }
          ]}
          rules={[
            {
              validator: async (_, services) => {
                if (!services || services.length < 1) {
                  return Promise.reject(new Error('Veuillez ajouter au moins un site et une prestation'));
                }
                
                // Vérifier que chaque service a au moins une prestation valide
                for (let i = 0; i < services.length; i++) {
                  const service = services[i];
                  if (!service || !service.selectedSite || !service.prestations || !Array.isArray(service.prestations)) {
                    return Promise.reject(new Error(`Service ${i + 1} invalide`));
                  }
                  
                  if (service.prestations.length === 0) {
                    return Promise.reject(new Error(`Service ${i + 1} doit avoir au moins une prestation`));
                  }

                  for (let j = 0; j < service.prestations.length; j++) {
                    const prestation = service.prestations[j];
                    if (!prestation || !prestation.prestation) {
                      return Promise.reject(new Error(`Prestation ${j + 1} du service ${i + 1} invalide`));
                    }
                  }
                }
              },
            },
          ]}
        >
          {(siteFields, { add: addSite, remove: removeSite }) => (
            <>
              {siteFields.map((siteField) => (
                <div key={siteField.key} style={{ marginBottom: 16, padding: 16, border: '1px solid #d9d9d9', borderRadius: 6 }}>
                  {/* Première ligne : Site et Switch */}
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={16}>
                      <Form.Item
                        {...siteField}
                        name={[siteField.name, 'selectedSite']}
                        label="* Site"
                        rules={[{ required: true, message: 'Veuillez sélectionner un site!' }]}
                      >
                        <AutoCompleteAsync
                          entity="site"
                          displayLabels={['name']}
                          searchFields="name"
                          redirectLabel="Ajouter un nouveau site"
                          withRedirect
                          urlToRedirect="/site"
                          onChange={(value) => {
                            handleSiteChange(value, siteField);
                          }}
                          onSelect={(value, option) => {
                          }}
                          onSearch={(searchText) => {
                          }}
                        />
                      </Form.Item>
                    </Col>
                    
                    <Col span={8}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 29 }}>
                        <span style={{ fontSize: '12px', color: '#666' }}>Site</span>
                        
                        {/* Switch simplifié comme dans SiteTariffForm */}
                        <Form.Item
                          name={[siteField.name, 'prestationType']}
                          initialValue="site_specific"
                          noStyle
                        >
                          <Switch
                            key={prestationTypeUpdate}
                            checkedChildren="Classic"
                            unCheckedChildren="Site"
                            style={{ margin: '0 8px' }}
                            checked={(() => {
                              try {
                                const currentType = formRef && formRef.current ? 
                                  formRef.current.getFieldValue(['services', siteField.name, 'prestationType']) || 'site_specific' : 
                                  'site_specific';
                                console.log('🔍 Switch checked - currentType AVANT correction:', currentType, 'type:', typeof currentType);

                                // CORRECTION : S'assurer que currentType est bien une string
                                const correctedType = typeof currentType === 'boolean' ? (currentType ? 'classic' : 'site_specific') : currentType;
                                console.log('🔍 Switch checked - currentType APRÈS correction:', correctedType, 'type:', typeof correctedType);
                                const isChecked = correctedType === 'classic';
                                console.log('🔍 Switch checked - isChecked:', isChecked);
                                return isChecked;
                              } catch (error) {
                                console.log('⚠️ Switch checked - Error:', error);
                                return false;
                              }
                            })()}
                            onChange={(checked) => {
                              console.log('🔍 Switch onChange - checked:', checked);
                              const newType = checked ? 'classic' : 'site_specific';
                              console.log('🔍 Switch onChange - newType:', newType);
                              
                              // Mettre à jour directement le formulaire AVANT d'appeler handleSitePrestationTypeChange
                              if (formRef && formRef.current) {
                                formRef.current.setFieldsValue({
                                  [`services.${siteField.name}.prestationType`]: newType
                                });
                                console.log('✅ Switch onChange - Formulaire mis à jour avec:', newType);
                              }
                              
                              // Appeler la fonction de gestion
                              handleSitePrestationTypeChange(siteField, checked);
                              
                              // Forcer le re-render
                              setPrestationTypeUpdate(prev => prev + 1);
                              console.log('🔄 Switch onChange - Re-render forcé');
                            }}
                          />
                        </Form.Item>
                        
                        <span style={{ fontSize: '12px', color: '#666' }}>Classic</span>
                      </div>
                    </Col>
                  </Row>

                  {/* Deuxième ligne : Zone des prestations en pleine largeur */}
                  <Row>
                    <Col span={24}>
                      <Form.Item
                        {...siteField}
                        name={[siteField.name, 'prestations']}
                        label="* Prestations"
                        rules={[{ required: true, message: 'Veuillez ajouter au moins une prestation!' }]}
                      >
                        <Form.List
                          name={[siteField.name, 'prestations']}
                          initialValue={[
                            {
                              prestation: '',
                              numberOfAgents: 1
                            }
                          ]}
                        >
                          {(prestationFields, { add: addPrestation, remove: removePrestation }) => (
                            <>
                              {prestationFields.map((prestationField) => (
                                <div key={prestationField.key} style={{ marginBottom: 16, padding: 16, border: '1px solid #e6f7ff', borderRadius: 6, backgroundColor: '#f6ffed' }}>
                                  <Row gutter={16} align="middle">

                                    <Col span={10}>
                                      <Form.Item
                                        {...prestationField}
                                        name={[prestationField.name, 'prestation']}
                                        label="* Prestation"
                                        rules={[{ required: true, message: 'Veuillez sélectionner une prestation' }]}
                                      >
                                        <Select
                                          placeholder="Sélectionner une prestation"
                                          popupMatchSelectWidth={false}
                                          dropdownStyle={{ minWidth: 400 }}
                                          showSearch
                                          optionFilterProp="children"
                                          disabled={(() => {
                                            try {
                                              const sitePrestationType = formRef && formRef.current ? 
                                                formRef.current.getFieldValue(['services', siteField.name, 'prestationType']) || 'site_specific' : 
                                                'site_specific';
                                              return sitePrestationType === 'site_specific' && (!siteTariffsMap.has(siteField.name) || siteTariffsMap.get(siteField.name).length === 0);
                                            } catch (error) {
                                              return false;
                                            }
                                          })()}
                                          onChange={(value) => {
                                            handleServiceChange(siteField, prestationField, { id: value, name: classicPrestations.find(p => p._id === value)?.name || '' });
                                            
                                            // IMPORTANT: Forcer la mise à jour du siteTariffId après la sélection
                                            if (value) {
                                              setTimeout(() => {
                                                forceUpdateSiteTariffId(siteField.name, value);
                                              }, 100);
                                            }
                                          }}
                                        >
                                          {(() => {
                                            try {
                                              const sitePrestationType = formRef && formRef.current ? 
                                                formRef.current.getFieldValue(['services', siteField.name, 'prestationType']) || 'site_specific' : 
                                                'site_specific';
                                              
                                              if (sitePrestationType === 'site_specific') {
                                                // Prestations spécifiques au site
                                                const siteTariffs = siteTariffsMap.get(siteField.name) || [];
                                                
                                                if (siteTariffs.length === 0) {
                                                  return (
                                                    <Select.Option value="" disabled>
                                                      Aucune prestation disponible
                                                    </Select.Option>
                                                  );
                                                }
                                                
                                                return siteTariffs.map((tariff) => {
                                                  return (
                                                    <Select.Option key={tariff.prestation._id} value={tariff.prestation._id}>
                                                      {tariff.prestation.name} (Site)
                                                    </Select.Option>
                                                  );
                                                });
                                              } else {
                                                // Prestations classiques (toutes disponibles)
                                                return classicPrestations.map((prestation) => (
                                                  <Select.Option key={prestation._id} value={prestation._id}>
                                                    {prestation.name} (Classic)
                                                  </Select.Option>
                                                ));
                                              }
                                            } catch (error) {
                                              console.error('❌ Prestations - Erreur lors de la détermination du type:', error);
                                              // Fallback vers les prestations classiques
                                              return classicPrestations.map((prestation) => (
                                                <Select.Option key={prestation._id} value={prestation._id}>
                                                  {prestation.name} (Classic)
                                                </Select.Option>
                                              ));
                                            }
                                          })()}
                                        </Select>
                                        
                                        {(() => {
                                          try {
                                            // CORRECTION : Vérifier le prestationType avant d'afficher le message d'erreur
                                            const sitePrestationType = formRef && formRef.current ? 
                                              formRef.current.getFieldValue(['services', siteField.name, 'prestationType']) || 'site_specific' : 
                                              'site_specific';
                                              
                                            if (sitePrestationType === 'site_specific' && siteTariffsMap.has(siteField.name) && siteTariffsMap.get(siteField.name).length === 0) {
                                              return (
                                                <div style={{ 
                                                  marginTop: 4, 
                                                  color: '#ff4d4f', 
                                                  fontSize: '12px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '8px'
                                                }}>
                                                  <span>⚠️</span>
                                                  <span>Aucune prestation spécifique disponible pour ce site. Activez le mode "Classic" ou configurez dans Tarifs par site.</span>
                                                  <Button 
                                                    size="small" 
                                                    type="link" 
                                                    onClick={() => window.open('/siteTariff', '_blank')}
                                                    style={{ 
                                                      padding: 0, 
                                                      height: 'auto',
                                                      color: '#1890ff',
                                                      fontSize: '12px'
                                                    }}
                                                  >
                                                    Configurer
                                                  </Button>
                                                </div>
                                              );
                                            }
                                            return null;
                                          } catch (error) {
                                            return null;
                                          }
                                        })()}
                                      </Form.Item>
                                    </Col>

                                    <Col span={10}>
                                      <Form.Item
                                        {...prestationField}
                                        name={[prestationField.name, 'numberOfAgents']}
                                        label="* Nombre d'agents"
                                        rules={[{ required: true, message: 'Veuillez entrer le nombre d\'agents' }]}
                                      >
                                        <Input type="number" min={1} />
                                      </Form.Item>
                                    </Col>

                                    <Col span={4}>
                                      <Form.Item>
                                        <Button
                                          type="text"
                                          danger
                                          icon={<MinusCircleOutlined />}
                                          onClick={() => removePrestation(prestationField.name)}
                                          disabled={prestationFields.length === 1}
                                        />
                                      </Form.Item>
                                    </Col>
                                  </Row>
                                </div>
                              ))}

                              <Form.Item style={{ marginTop: 16 }}>
                                <Button
                                  type="dashed"
                                  onClick={() => addPrestation({
                                    prestation: '',
                                    numberOfAgents: 1
                                  })}
                                  block
                                  icon={<PlusOutlined />}
                                  style={{ 
                                    height: '40px', 
                                    borderColor: '#1890ff', 
                                    color: '#1890ff',
                                    fontSize: '14px'
                                  }}
                                >
                                  + Ajouter une prestation
                                </Button>
                              </Form.Item>
                            </>
                          )}
                        </Form.List>
                      </Form.Item>
                    </Col>

                    <Col span={8}>
                      <Form.Item>
                        <Button
                          type="text"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => {
                            removeSite(siteField.name);
                          }}
                          block
                        >
                          Supprimer ce site
                        </Button>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              ))}

              {/* Bouton pour ajouter un nouveau site */}
              <Form.Item>
                <Button 
                  type="dashed" 
                  onClick={() => {
                    setSelectedSite(null);
                    setSelectedSiteName('');
                    
                    // Ajouter une seule nouvelle entrée de site avec type par défaut
                    addSite({
                      selectedSite: '',
                      prestationType: 'site_specific',
                      prestations: [
                        {
                          prestation: '',
                          numberOfAgents: 1
                        }
                      ]
                    });
                  }} 
                  block 
                  icon={<PlusOutlined />}
                >
                  Ajouter un site et prestations
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Card>

      {/* Mode de paiement */}
      <Form.Item
        label="Mode de paiement"
        name="paymentMode"
        rules={[{ required: true, message: 'Veuillez choisir un mode de paiement!' }]}
      >
        <AutoCompleteAsync
          entity="paymentmode"
          displayLabels={['name']}
          searchFields="name"
          redirectLabel="Ajouter un nouveau mode de paiement"
          urlToRedirect="/paymentmode"
          onChange={(value) => {
            handlePaymentModeChange(value);
          }}
        />
      </Form.Item>

      {paymentModeName === 'Virement bancaire' && (
        <>
          <Form.Item
            label="Nom de la Banque"
            name="banque"
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="RIB"
            name="rib"
          >
            <Input />
          </Form.Item>
        </>
      )}

      {/* Date de début du contrat */}
      <Form.Item
        label="Date de début"
        name="startDate"
        rules={[{ required: true, message: 'Veuillez choisir une date de début!' }]}
      >
        <DatePicker 
          style={{ width: '100%' }} 
          onOpenChange={(open) => {
          }}
          onFocus={() => {
          }}
          onChange={(date, dateString) => {
          }}
          onPanelChange={(date, mode) => {
          }}
        />
      </Form.Item>

      {/* Date de fin du contrat */}
      <Form.Item
        label="Date de fin"
        name="endDate"
        rules={[{ required: true, message: 'Veuillez choisir une date de fin!' }]}
      >
        <DatePicker 
          style={{ width: '100%' }} 
          onOpenChange={(open) => {
          }}
          onFocus={() => {
          }}
          onChange={(date, dateString) => {
          }}
          onPanelChange={(date, mode) => {
          }}
        />
      </Form.Item>


      {/* Statut du contrat */}
      <Form.Item
        label="Statut du contrat"
        name="status"
        initialValue="actif"
        rules={[{ required: true, message: 'Veuillez choisir un statut!' }]}
      >
        <Select>
          <Select.Option value="actif">Actif</Select.Option>
          <Select.Option value="suspendu">Suspendu</Select.Option>
          <Select.Option value="en_attente">En attente</Select.Option>
          <Select.Option value="resilie">Résilié</Select.Option>
        </Select>
      </Form.Item>

      {/* Boutons de soumission */}
      <Form.Item style={{ marginTop: 24 }}>
        <Button type="primary" htmlType="submit">
          {isUpdateForm ? 'Mettre à jour le contrat' : 'Créer le contrat'}
        </Button>
        <Button 
          style={{ marginLeft: 8 }} 
          onClick={() => window.history.back()}
        >
          Annuler
        </Button>
      </Form.Item>

      </Form>
    </>
  );
}
