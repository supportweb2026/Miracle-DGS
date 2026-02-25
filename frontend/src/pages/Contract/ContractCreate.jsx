import React, { useState, useEffect } from 'react';
import { Form, Card, Button, message, ConfigProvider } from 'antd';
import { useNavigate } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import { request } from '@/request';
import { useSelector } from 'react-redux';
import { selectFinanceSettings } from '@/redux/settings/selectors';
import ContractForm from '@/forms/ContractForm';
import dayjs from 'dayjs';
import locale from 'antd/locale/fr_FR';
import 'dayjs/locale/fr';

// Configurer dayjs en français
dayjs.locale('fr');

export default function ContractCreate() {
  const [form] = Form.useForm();
  const translate = useLanguage();
  const navigate = useNavigate();
  
  const { last_contract_number } = useSelector(selectFinanceSettings);
  const [lastNumber, setLastNumber] = useState(() => Number(last_contract_number || 0) + Number(1));
  
  // Rediriger vers la liste si on n'est pas sur la page de création
  useEffect(() => {
    if (window.location.pathname !== '/contracts/create') {
      navigate('/contracts');
    }
  }, [navigate]);

  useEffect(() => {
    if (last_contract_number !== undefined && last_contract_number !== null) {
      setLastNumber(Number(last_contract_number) + Number(1));
      form.setFieldsValue({ 
        number: Number(last_contract_number) + Number(1)
      });
    }
  }, [last_contract_number, form]);

  const onFinish = async (values) => {
    try {
      console.log('🚨 CONTRACTCREATE - onFinish appelé avec:', values);
      console.log('🚨 CONTRACTCREATE - Type de values:', typeof values);
      console.log('🚨 CONTRACTCREATE - Keys de values:', Object.keys(values || {}));
      
      // Vérifier que services existe et est un tableau
      if (!values.services || !Array.isArray(values.services)) {
        console.error('❌ CONTRACTCREATE - ERREUR: services manquant ou invalide');
        console.error('❌ CONTRACTCREATE - services:', values.services);
        console.error('❌ CONTRACTCREATE - Type de services:', typeof values.services);
        message.error('Veuillez ajouter au moins un service');
        return;
      }
      
      console.log('✅ CONTRACTCREATE - Services validés:', values.services.length);
      
      // DÉBOGAGE DÉTAILLÉ : Afficher la structure exacte des services reçus
      console.log('🔍 CONTRACTCREATE - Structure détaillée des services reçus:');
      values.services.forEach((service, index) => {
        console.log(`  Service ${index}:`, JSON.stringify(service, null, 2));
        console.log(`  Service ${index} - selectedSite:`, service?.selectedSite);
        console.log(`  Service ${index} - prestations:`, service?.prestations);
        console.log(`  Service ${index} - prestationType:`, service?.prestationType);
        console.log(`  Service ${index} - siteTariffId:`, service?.siteTariffId);
        console.log(`  Service ${index} - site:`, service?.site);
        console.log(`  Service ${index} - prestationId:`, service?.prestationId);
      });
      
      // CORRECTION : ContractForm transforme déjà les données, on peut les utiliser directement
      // Vérifier que chaque service a les champs requis selon son type
      const validServices = values.services.filter((service, index) => {
        if (!service) {
          console.log(`❌ CONTRACTCREATE - Service ${index} est null/undefined`);
          return false;
        }
        
        console.log(`🔍 CONTRACTCREATE - Validation service ${index}:`, service);
        
        // Vérifier que le service a un site (transformé par ContractForm)
        if (!service.site) {
          console.log(`❌ CONTRACTCREATE - Service ${index} n'a pas de site:`, service);
          return false;
        }
        
        // Vérifier que le service a les identifiants requis selon son type
        if (service.prestationType === 'site_specific') {
          if (!service.siteTariffId) {
            console.log(`❌ CONTRACTCREATE - Service ${index} (site_specific) n'a pas de siteTariffId:`, service);
            return false;
          }
          console.log(`✅ CONTRACTCREATE - Service ${index} (site_specific) valide avec siteTariffId:`, service.siteTariffId);
        } else if (service.prestationType === 'classic') {
          if (!service.prestationId) {
            console.log(`❌ CONTRACTCREATE - Service ${index} (classic) n'a pas de prestationId:`, service);
            return false;
          }
          console.log(`✅ CONTRACTCREATE - Service ${index} (classic) valide avec prestationId:`, service.prestationId);
        } else {
          console.log(`❌ CONTRACTCREATE - Service ${index} a un type de prestation invalide:`, service.prestationType);
          return false;
        }
        
        return true;
      });
      
      console.log('✅ CONTRACTCREATE - Services valides après filtrage:', validServices.length);
      
      if (validServices.length === 0) {
        console.error('❌ CONTRACTCREATE - ERREUR: Aucun service valide trouvé');
        message.error('Veuillez ajouter au moins une prestation valide');
        return;
      }
      
      // Préparer les données finales - utiliser directement les services validés
      const formData = {
        ...values,
        startDate: values.startDate && dayjs.isDayjs(values.startDate) ? values.startDate.format('YYYY-MM-DD') : null,
        endDate: values.endDate && dayjs.isDayjs(values.endDate) ? values.endDate.format('YYYY-MM-DD') : null,
        services: validServices // Utiliser directement les services validés
      };

      console.log('🚨 CONTRACTCREATE - FormData final envoyé au backend:', formData);
      
      const response = await request.create({
        entity: 'contract',
        jsonData: formData
      });

      if (response.success) {
        console.log('✅ CONTRACTCREATE - Contrat créé avec succès');
        message.success('Contrat créé avec succès');
        navigate(`/contracts`);
      } else {
        console.error('❌ CONTRACTCREATE - Erreur lors de la création du contrat:', response);
        message.error('Erreur lors de la création du contrat');
      }
    } catch (error) {
      console.error('❌ CONTRACTCREATE - Erreur lors de la création du contrat:', error);
      message.error('Une erreur est survenue lors de la création du contrat');
    }
  };

  return (
    <ConfigProvider locale={locale}>
      <div style={{ padding: '24px' }}>
        <Card 
          title={translate('Créer un nouveau contrat')} 
          style={{ marginBottom: '24px' }}
          extra={
            <Button onClick={() => navigate('/contracts')} type="default">
              {translate('Retour à la liste')}
            </Button>
          }
        >
          <ContractForm formRef={form} onFinish={onFinish} />
        </Card>
      </div>
    </ConfigProvider>
  );
} 