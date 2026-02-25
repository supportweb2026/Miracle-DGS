import { useState, useEffect } from 'react';
import { Button, Tag, Form, Divider } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { useSelector, useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { settingsAction } from '@/redux/settings/actions';
import { erp } from '@/redux/erp/actions';
import { selectCreatedItem } from '@/redux/erp/selectors';
import { generate as uniqueId } from 'shortid';
import Loading from '@/components/Loading';
import { ArrowLeftOutlined, CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { request } from '@/request';
import ContractForm from '../Forms/ContractForm';

function SaveForm({ form }) {
  const translate = useLanguage();
  const handleClick = () => {
    form.submit();
  };

  return (
    <Button onClick={handleClick} type="primary" icon={<PlusOutlined />}>
      {translate('Save')}
    </Button>
  );
}

export default function CreateContractModule({ config }) {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { entity } = config;
  const { isLoading, isSuccess, result } = useSelector(selectCreatedItem);
  


  useEffect(() => {
    dispatch(settingsAction.list({ entity: 'setting' }));
  }, []);

  const onSubmit = async (values) => {
    try {
      console.log('🔴 STRATÉGIQUE - onSubmit appelé avec values:', JSON.stringify(values, null, 2));
      console.log('🔴 STRATÉGIQUE - Type de values.services:', typeof values.services);
      console.log('🔴 STRATÉGIQUE - Services reçus:', values.services);
      
      // Vérifier si les services ont déjà des siteTariffId
      const hasSiteTariffIds = values.services?.some(service => service.siteTariffId);
      console.log('🔴 STRATÉGIQUE - Services ont des siteTariffId:', hasSiteTariffIds);
      
      let servicesWithSiteTariff;
      
      if (hasSiteTariffIds) {
        console.log('🔴 STRATÉGIQUE - Services ont déjà des siteTariffId, pas besoin de créer');
        servicesWithSiteTariff = values.services.map(service => ({
          siteTariffId: service.siteTariffId,
          numberOfAgents: service.numberOfAgents,
          dailyRate: service.dailyRate,
          hourlyRate: service.hourlyRate,
          duration: service.duration
        }));
      } else {
        console.log('🔴 STRATÉGIQUE - Création des SiteTariff automatiquement');
        
        // Récupérer le site sélectionné
        const selectedSite = values.site;
        
        // Créer les SiteTariff pour chaque service
        servicesWithSiteTariff = await Promise.all(values.services.map(async (service) => {
          console.log('🔴 STRATÉGIQUE - Traitement du service:', service);
          
          // Créer le SiteTariff avec le site sélectionné et la prestation du service
          const siteTariffResponse = await request.create({ 
            entity: 'siteTariff',
            jsonData: {
              site: selectedSite,
              prestation: service.serviceType
            }
          });

          console.log('🔴 STRATÉGIQUE - SiteTariff créé:', siteTariffResponse);

          // Retourner le service avec l'ID du SiteTariff créé
          return {
            siteTariffId: siteTariffResponse.result._id,
            numberOfAgents: service.numberOfAgents,
            dailyRate: service.dailyRate,
            hourlyRate: service.hourlyRate,
            duration: service.duration
          };
        }));
      }

      const formData = {
        ...values,
        startDate: values.startDate ? dayjs(values.startDate).format('YYYY-MM-DD') : null,
        endDate: values.endDate ? dayjs(values.endDate).format('YYYY-MM-DD') : null,
        services: servicesWithSiteTariff
      };

      console.log('🔴 STRATÉGIQUE - FormData final envoyé au backend:', JSON.stringify(formData, null, 2));
      console.log('🔴 STRATÉGIQUE - Services finaux:', formData.services);
      
      // CORRECTION : Dispatch simple, l'ID sera récupéré via le state Redux
      console.log('🔴 DEBUG REDIRECTION - 🚀 AVANT dispatch erp.create');
      console.log('🔴 DEBUG REDIRECTION - entity:', entity);
      console.log('🔴 DEBUG REDIRECTION - formData:', formData);
      
      dispatch(erp.create({ entity, jsonData: formData }));
      console.log('🔴 DEBUG REDIRECTION - ✅ dispatch erp.create envoyé');
      console.log('🔴 DEBUG REDIRECTION - ⏳ Attente de la réponse...');
    } catch (error) {
      console.error('🔴 STRATÉGIQUE - ERREUR CRITIQUE lors de la création du contrat:', error);
      console.error('🔴 STRATÉGIQUE - Stack trace:', error.stack);
      // Vous pouvez ajouter ici une notification d'erreur pour l'utilisateur
    }
  };

  // NOUVEAU : Surveillance en temps réel de l'état Redux
  useEffect(() => {
    console.log('🔴 SURVEILLANCE REDUX - État actuel:');
    console.log('🔴 SURVEILLANCE REDUX - isLoading:', isLoading);
    console.log('🔴 SURVEILLANCE REDUX - isSuccess:', isSuccess);
    console.log('🔴 SURVEILLANCE REDUX - result:', result);
    console.log('🔴 SURVEILLANCE REDUX - result._id:', result?._id);
  }, [isLoading, isSuccess, result]);

  useEffect(() => {
    console.log('🔴 DEBUG REDIRECTION - useEffect déclenché');
    console.log('🔴 DEBUG REDIRECTION - isSuccess:', isSuccess);
    console.log('🔴 DEBUG REDIRECTION - result:', result);
    console.log('🔴 DEBUG REDIRECTION - result._id:', result?._id);
    
    if (isSuccess && result && result._id) {
      form.resetFields();
      // CORRECTION : Récupérer l'ID depuis le state Redux
      const contractId = result._id;
      console.log('🔴 DEBUG REDIRECTION - ✅ CONDITIONS REMPLIES - Redirection vers:', contractId);
      console.log('🔴 DEBUG REDIRECTION - URL de redirection:', `/${entity.toLowerCase()}/read/${contractId}`);
      
      try {
        navigate(`/${entity.toLowerCase()}/read/${contractId}`);
        console.log('🔴 DEBUG REDIRECTION - ✅ navigate() appelé avec succès');
      } catch (error) {
        console.error('🔴 DEBUG REDIRECTION - ❌ ERREUR navigate():', error);
      }
    } else if (isSuccess) {
      // Fallback : si pas d'ID, rediriger vers la liste
      form.resetFields();
      console.log('🔴 DEBUG REDIRECTION - ⚠️ Pas d\'ID, redirection vers la liste');
      console.log('🔴 DEBUG REDIRECTION - URL de fallback:', `/${entity.toLowerCase()}`);
      
      try {
        navigate(`/${entity.toLowerCase()}`);
        console.log('🔴 DEBUG REDIRECTION - ✅ navigate() fallback appelé avec succès');
      } catch (error) {
        console.error('🔴 DEBUG REDIRECTION - ❌ ERREUR navigate() fallback:', error);
      }
    } else {
      console.log('🔴 DEBUG REDIRECTION - ⏳ En attente des conditions...');
      console.log('🔴 DEBUG REDIRECTION - isSuccess:', isSuccess);
      console.log('🔴 DEBUG REDIRECTION - result:', result);
    }
  }, [isSuccess, result, navigate, entity, form]);

  return (
    <>
      <PageHeader
        onBack={() => {
          navigate(`/${entity.toLowerCase()}`);
        }}
        backIcon={<ArrowLeftOutlined />}
        title={translate('New')}
        ghost={false}
        tags={<Tag>{translate('Draft')}</Tag>}
        extra={[
          <Button
            key={uniqueId()}
            onClick={() => navigate(`/${entity.toLowerCase()}`)}
            icon={<CloseCircleOutlined />}
          >
            {translate('Cancel')}
          </Button>,
          <SaveForm form={form} key={uniqueId()} />,
        ]}
        style={{
          padding: '20px 0px',
        }}
      />
      <Divider dashed />
      <Loading isLoading={isLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
        >
          <ContractForm formRef={form} />
        </Form>
      </Loading>
    </>
  );
} 