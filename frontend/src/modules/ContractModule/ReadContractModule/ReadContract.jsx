import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Descriptions, Tag, Divider, Typography } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import {
  EditOutlined,
  FilePdfOutlined,
  CloseCircleOutlined,
  MailOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

import { useSelector, useDispatch } from 'react-redux';
import { erp } from '@/redux/erp/actions';
import useLanguage from '@/locale/useLanguage';
import { selectCurrentItem } from '@/redux/erp/selectors';
import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

export default function ReadContract({ config, selectedContract }) {
  const translate = useLanguage();
  const { entity, ENTITY_NAME } = config;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { result: currentResult } = useSelector(selectCurrentItem);

  const resetContract = {
    number: '',
    year: '',
    status: '',
    startDate: '',
    endDate: '',
    client: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
    services: [],
    paymentMode: '',
    notes: '',
  };

  const [currentContract, setCurrentContract] = useState(selectedContract ?? resetContract);
  const [client, setClient] = useState({});

  useEffect(() => {
    if (currentResult) {
      console.log('=== CURRENT RESULT IN READ CONTRACT ===');
      console.log('Current Result:', currentResult);
      setCurrentContract(currentResult);
    }
  }, [currentResult]);

  useEffect(() => {
    if (currentContract?.client) {
      setClient(currentContract.client);
    }
  }, [currentContract]);

  // Vérifier que currentContract existe avant de l'utiliser
  if (!currentContract || !currentContract._id) {
    console.log('=== NO CONTRACT DATA ===');
    return <div>Chargement...</div>;
  }

  // Vérifier que les données essentielles sont présentes
  if (!currentContract.client || !currentContract.services) {
    console.log('=== INCOMPLETE CONTRACT DATA ===');
    console.log('Client:', currentContract.client);
    console.log('Services:', currentContract.services);
    return <div>Données du contrat incomplètes...</div>;
  }

  function handleMailto(currentContract, entity) {
    const email = currentContract?.client?.email || '';
    const name = currentContract?.client?.name || '';
    const number = currentContract?.number || '';
    const year = currentContract?.year || '';
    
    const subject = `Votre contrat #${number}/${year}`;
    const body = `Bonjour ${name},%0D%0A%0D%0AVeuillez trouver ci-joint votre contrat n°${number}/${year}.%0D%0ANous restons à votre disposition pour toute précision.%0D%0ACordialement.`;

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'actif':
        return 'green';
      case 'pending':
      case 'en attente':
        return 'orange';
      case 'expired':
      case 'expiré':
        return 'red';
      case 'draft':
      case 'brouillon':
        return 'blue';
      default:
        return 'default';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return dayjs(date).format('DD/MM/YYYY');
  };

  // Fonctions utilitaires pour gérer les deux modes de prestation
  const getSiteName = (service) => {
    if (service?.prestationType === 'site_specific' && service?.siteTariffId?.site?.name) {
      return service.siteTariffId.site.name;
    } else if (service?.prestationType === 'classic' && service?.site?.name) {
      return service.site.name;
    }
    return 'Site non défini';
  };

  const getPrestationName = (service) => {
    if (service?.prestationType === 'site_specific' && service?.siteTariffId?.prestation?.name) {
      return service.siteTariffId.prestation.name;
    } else if (service?.prestationType === 'classic' && service?.prestationId?.name) {
      return service.prestationId.name;
    }
    return 'N/A';
  };

  const getSiteId = (service) => {
    if (service?.prestationType === 'site_specific' && service?.siteTariffId?.site?._id) {
      return service.siteTariffId.site._id;
    } else if (service?.prestationType === 'classic' && service?.site?._id) {
      return service.site._id;
    }
    return 'unknown';
  };

  console.log('=== RENDERING CONTRACT HEADER ===');
  console.log('Contract data for header:', {
    number: currentContract.number,
    year: currentContract.year,
    status: currentContract.status,
    id: currentContract._id
  });

  return (
    <>
      <PageHeader
        title={`${translate('Contrat')} #${currentContract.number || 'N/A'}/${currentContract.year || 'N/A'}`}
        subTitle={currentContract.status || 'N/A'}
        tags={[
          <Tag color={getStatusColor(currentContract.status)} key="status">
            {currentContract.status || 'N/A'}
          </Tag>
        ]}
        extra={[
          <Button
            key="edit"
            icon={<EditOutlined />}
            onClick={() => navigate(`/contracts/update/${currentContract._id}`)}
          >
            {translate('Modifier')}
          </Button>,
          <Button
            key="download"
            icon={<FilePdfOutlined />}
            onClick={() => window.open(`${DOWNLOAD_BASE_URL}${entity}/${entity}-${currentContract._id}.pdf`, '_blank')}
          >
            {translate('Télécharger')}
          </Button>,
          <Button
            key="mail"
            icon={<MailOutlined />}
            onClick={() => handleMailto(currentContract, entity)}
          >
            {translate('Envoyer par email')}
          </Button>,
        ]}
      />
      
      <Divider dashed />
      
      {/* Informations du contrat */}
      <div style={{ marginBottom: '24px', padding: '20px', border: '2px solid #e6f7ff', borderRadius: '12px', backgroundColor: '#f6ffed' }}>
        <Typography.Title level={4} style={{ color: '#1890ff', marginBottom: '16px', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
          📋 {translate('Informations du contrat')}
        </Typography.Title>
        
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>🔢 {translate('Numéro')}:</strong> {currentContract.number || 'N/A'}/{currentContract.year || 'N/A'}
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>🏷️ {translate('Statut')}:</strong> 
              <Tag color={getStatusColor(currentContract.status)} style={{ marginLeft: '8px' }}>
                {currentContract.status || 'N/A'}
              </Tag>
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>📅 {translate('Date de début')}:</strong> {formatDate(currentContract.startDate)}
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>📅 {translate('Date de fin')}:</strong> {formatDate(currentContract.endDate)}
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>💳 {translate('Mode de paiement')}:</strong> {currentContract.paymentMode?.name || currentContract.paymentMode || 'N/A'}
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>👤 {translate('Représentant')}:</strong> {currentContract.representativeName || 'N/A'}
            </div>
          </Col>
          <Col span={24}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>📝 {translate('Notes')}:</strong> {currentContract.notes || 'Aucune note'}
            </div>
          </Col>
        </Row>
      </div>

      <Divider />

      {/* Informations du client */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f6ffed' }}>
        <Typography.Title level={4} style={{ color: '#1890ff', marginBottom: '16px', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
          👥 {translate('Client')} : {client.name || 'N/A'}
        </Typography.Title>
        
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>📍 {translate('Adresse')}:</strong> {client.address || 'N/A'}
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>📧 {translate('Email')}:</strong> {client.email || 'N/A'}
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>📞 {translate('Téléphone')}:</strong> {client.phone || 'N/A'}
            </div>
          </Col>
        </Row>
      </div>

      <Divider />

      {/* Services du contrat */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f6ffed' }}>
        <Typography.Title level={4} style={{ color: '#1890ff', marginBottom: '16px', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
          🚀 {translate('Services inclus')}
        </Typography.Title>
      {currentContract.services && Array.isArray(currentContract.services) && currentContract.services.length > 0 ? (
        (() => {
          // Grouper les services par site
          const servicesBySite = {};
          currentContract.services.forEach(service => {
            // Gérer les deux modes de prestation
            const siteId = getSiteId(service);
            const siteName = getSiteName(service);
            
            if (siteId !== 'unknown') {
              if (!servicesBySite[siteId]) {
                servicesBySite[siteId] = {
                  name: siteName,
                  services: []
                };
              }
              servicesBySite[siteId].services.push(service);
            }
          });

          // Afficher chaque site avec ses services
          return Object.values(servicesBySite).map((siteData, siteIndex) => (
            <div key={`site-${siteIndex}`} style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f6ffed' }}>
              <Typography.Title level={5} style={{ color: '#1890ff', marginBottom: '16px', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
                🏢 {translate('Site')} : {siteData.name}
              </Typography.Title>
              
              {siteData.services.map((service, serviceIndex) => (
                <div key={`service-${serviceIndex}`} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #d9d9d9', borderRadius: '8px', backgroundColor: '#fff' }}>
                  <Row gutter={[16, 8]}>
                    <Col span={12}>
                      <strong>🔒 {translate('Prestation')}:</strong> {getPrestationName(service)}
                    </Col>
                    <Col span={12}>
                      <strong>💰 {translate('Tarif journalier')}:</strong> {service?.dailyRate ? `${service.dailyRate} XAF` : 'N/A'}
                    </Col>
                    <Col span={12}>
                      <strong>👥 {translate('Nombre d\'agents')}:</strong> {service?.numberOfAgents || 'N/A'}
                    </Col>
                    <Col span={12}>
                      <strong>🎯 {translate('Total journalier')}:</strong> {service?.dailyRate && service?.numberOfAgents ? `${service.dailyRate * service.numberOfAgents} XAF` : 'N/A'}
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          ));
        })()
      ) : (
        <p>{translate('Aucun service défini')}</p>
      )}
      </div>
    </>
  );
} 