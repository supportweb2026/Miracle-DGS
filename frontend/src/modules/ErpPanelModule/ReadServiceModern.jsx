import { useState, useEffect } from 'react';
import { Divider, Typography } from 'antd';

import { Button, Row, Col, Descriptions, Statistic, Tag } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import {
  EditOutlined,
  FilePdfOutlined,
  CloseCircleOutlined,
  RetweetOutlined,
  MailOutlined,
} from '@ant-design/icons';

import { useSelector, useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';

import { generate as uniqueId } from 'shortid';

import { selectCurrentItem } from '@/redux/erp/selectors';

import { DOWNLOAD_BASE_URL } from '@/config/serverApiConfig';
import { useMoney, useDate } from '@/settings';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

const { Title } = Typography;

const Service = ({ service, currentErp, translate }) => {
  const { moneyFormatter } = useMoney();

  // Pour les factures, utiliser numberOfDays, sinon calculer la durée
  const duration = service.numberOfDays || dayjs(service.endDate || '1970-01-01').diff(dayjs(service.startDate || '1970-01-01'), 'day') + 1;
  
  // Calcul du total pour ce service
  console.log('Service data:', service);
  const totalService = (service.dailyRate || 0) * duration * service.numberOfAgents;

  // Fonctions utilitaires pour gérer les deux types de services
  const getSiteName = (service) => {
    if (service?.prestationType === 'site_specific' && service?.siteTariffId?.site?.name) {
      return service.siteTariffId.site.name;
    } else if (service?.prestationType === 'classic' && service?.siteId?.name) {
      return service.siteId.name;
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

  return (
    <div style={{ marginBottom: '16px', padding: '16px', border: '1px solid #d9d9d9', borderRadius: '8px', backgroundColor: '#fff' }}>
      <Row gutter={[16, 8]}>
        <Col span={12}>
          <strong>🏢 {getSiteName(service)}</strong>
        </Col>
        <Col span={12}>
          <strong>💰 {translate('Tarif journalier')}:</strong> {moneyFormatter({ amount: service.dailyRate || 0, currency_code: currentErp?.currency })}
        </Col>
        <Col span={12}>
          <strong>🔒 {translate('Prestation')}:</strong> {getPrestationName(service)}
        </Col>
        <Col span={12}>
          <strong>👥 {translate('Nombre d\'agents')}:</strong> {service.numberOfAgents || 'N/A'}
        </Col>
        <Col span={12}>
          <strong>📅 {translate('Durée')}:</strong> {duration} {duration === 1 ? 'jour' : 'jours'}
        </Col>
        <Col span={12}>
          <strong>🎯 {translate('Total')}:</strong> 
          <span style={{ fontWeight: '700', color: '#1890ff', marginLeft: '8px' }}>
            {moneyFormatter({ amount: totalService, currency_code: currentErp?.currency })}
          </span>
        </Col>
      </Row>
    </div>
  );
};

// Ajout de la fonction mailto
function handleMailto(currentErp, entity) {
  const email = currentErp?.client?.email || '';
  const name = currentErp?.client?.name || '';
  const number = currentErp?.number || '';
  const year = currentErp?.year || '';
  let subject = '';
  let body = '';

  switch (entity) {
    case 'invoice':
      subject = `Votre facture #${number}/${year}`;
      body = `Bonjour ${name},%0D%0A%0D%0AVeuillez trouver ci-joint votre facture n°${number}/${year}.%0D%0ACordialement.`;
      break;
    case 'quote':
      subject = `Votre devis #${number}/${year}`;
      body = `Bonjour ${name},%0D%0A%0D%0AVeuillez trouver ci-joint votre devis n°${number}/${year}.%0D%0ACordialement.`;
      break;
    case 'contract':
      subject = `Votre contrat #${number}/${year}`;
      body = `Bonjour ${name},%0D%0A%0D%0AVeuillez trouver ci-joint votre contrat n°${number}/${year}.%0D%0ACordialement.`;
      break;
    case 'payment':
      subject = `Votre reçu de paiement #${number}/${year}`;
      body = `Bonjour ${name},%0D%0A%0D%0AVeuillez trouver ci-joint votre reçu de paiement n°${number}/${year}.%0D%0ACordialement.`;
      break;
    default:
      subject = 'Document';
      body = 'Bonjour,%0D%0A%0D%0AVeuillez trouver ci-joint votre document.%0D%0ACordialement.';
  }

  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}

export default function ReadServiceModern({ config, selectedService }) {
  const translate = useLanguage();
  const { entity, ENTITY_NAME } = config;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { moneyFormatter } = useMoney();

  const { result: currentResult } = useSelector(selectCurrentItem);
  const resetErp = {
    status: '',
    client: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
    subTotal: 0,
    taxTotal: 0,
    taxRate: 0,
    total: 0,
    credit: 0,
    number: 0,
    year: 0,
  };

  const [servicesList, setServicesList] = useState([]);
  const [currentErp, setCurrentErp] = useState(selectedService ?? resetErp);
  const [client, setClient] = useState({});

  useEffect(() => {
    if (currentResult) {
      console.log('=== CURRENT RESULT IN READ SERVICE ===');
      console.log('Current Result:', currentResult);
      setCurrentErp(currentResult);
    }
  }, [currentResult]);

  useEffect(() => {
    if (currentErp?.client) {
      setClient(currentErp.client);
    }
  }, [currentErp]);

  useEffect(() => {
    if (currentErp?.services) {
      setServicesList(currentErp.services);
    }
  }, [currentErp]);

  // Vérifier que currentErp existe avant de l'utiliser
  if (!currentErp || !currentErp._id) {
    console.log('=== NO ERP DATA ===');
    return <div>Chargement...</div>;
  }

  // Vérifier que les données essentielles sont présentes
  if (!currentErp.client || !currentErp.services) {
    console.log('=== INCOMPLETE ERP DATA ===');
    console.log('Client:', currentErp.client);
    console.log('Services:', currentErp.services);
    return <div>Données incomplètes...</div>;
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'payé':
        return 'green';
      case 'pending':
      case 'en attente':
        return 'orange';
      case 'unpaid':
      case 'impayé':
        return 'red';
      case 'draft':
      case 'brouillon':
        return 'blue';
      case 'sent':
      case 'envoyé':
        return 'cyan';
      default:
        return 'default';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return dayjs(date).locale('fr').format('DD/MM/YYYY');
  };

  return (
    <>
      <PageHeader
        title={`${translate(ENTITY_NAME)} #${currentErp.number || 'N/A'}/${currentErp.year || 'N/A'}`}
        subTitle={currentErp.status || 'N/A'}
        tags={[
          <Tag color={getStatusColor(currentErp.status)} key="status">
            {(() => {
              switch (currentErp.status) {
                case 'draft':
                  return 'Brouillon';
                case 'pending':
                  return 'En Attente';
                case 'sent':
                  return 'Envoyé';
                case 'unpaid':
                  return 'Impayé';
                case 'paid':
                  return 'Payé';
                default:
                  return currentErp.status;
              }
            })()}
          </Tag>,
        ]}
        extra={[
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              navigate(`/${entity.toLowerCase()}`);
            }}
            icon={<CloseCircleOutlined />}
          >
            {translate('Close')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              window.open(
                `${DOWNLOAD_BASE_URL}${entity}/${entity}-${currentErp._id}.pdf`,
                '_blank'
              );
            }}
            icon={<FilePdfOutlined />}
          >
            {translate('Download PDF')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              handleMailto(currentErp, entity);
            }}
            icon={<MailOutlined />}
          >
            {translate('Send by Email')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              dispatch(erp.convert({ entity, id: currentErp._id }));
            }}
            icon={<RetweetOutlined />}
            style={{ display: entity === 'quote' ? 'inline-block' : 'none' }}
          >
            {translate('Convert to Invoice')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              dispatch(
                erp.currentAction({
                  actionType: 'update',
                  data: currentErp,
                })
              );
              navigate(`/${entity.toLowerCase()}/update/${currentErp._id}`);
            }}
            type="primary"
            icon={<EditOutlined />}
          >
            {translate('Edit')}
          </Button>,
        ]}
        style={{
          padding: '20px 0px',
        }}
      >
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic 
              title="Status" 
              value={(() => {
                switch (currentErp.status) {
                  case 'draft':
                    return 'Brouillon';
                  case 'pending':
                    return 'En Attente';
                  case 'sent':
                    return 'Envoyé';
                  case 'unpaid':
                    return 'Impayé';
                  case 'paid':
                    return 'Payé';
                  default:
                    return currentErp.status;
                }
              })()} 
              valueStyle={{ color: getStatusColor(currentErp.status) === 'green' ? '#52c41a' : getStatusColor(currentErp.status) === 'red' ? '#ff4d4f' : getStatusColor(currentErp.status) === 'orange' ? '#fa8c16' : '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Nombre de jours"
              value={(() => {
                if (currentErp.services && currentErp.services.length > 0) {
                  // Le nombre de jours est le même pour tous les services
                  // On prend simplement le numberOfDays du premier service
                  return currentErp.services[0].numberOfDays || 0;
                }
                return 0;
              })() + ' jours'}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={translate('SubTotal')}
              value={moneyFormatter({
                amount: currentErp.subTotal,
                currency_code: currentErp.currency,
              })}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={translate('Total')}
              value={moneyFormatter({ amount: currentErp.total, currency_code: currentErp.currency })}
              valueStyle={{ color: '#fa8c16', fontSize: '20px', fontWeight: 'bold' }}
            />
          </Col>
        </Row>
      </PageHeader>
      
      <Divider dashed />
      
      {/* Informations de la facture */}
      <div style={{ marginBottom: '24px', padding: '20px', border: '2px solid #e6f7ff', borderRadius: '12px', backgroundColor: '#f6ffed' }}>
        <Title level={4} style={{ color: '#1890ff', marginBottom: '16px', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
          📋 {entity === 'quote' ? translate('Informations du devis') : translate('Informations de la facture')}
        </Title>
        
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>🔢 {translate('Numéro')}:</strong> {currentErp.number || 'N/A'}/{currentErp.year || 'N/A'}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>📅 {translate('Date')}:</strong> {formatDate(currentErp.date)}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>🏷️ {translate('Statut')}:</strong> 
              <Tag color={getStatusColor(currentErp.status)} style={{ marginLeft: '8px' }}>
                {(() => {
                  switch (currentErp.status) {
                    case 'draft':
                      return 'Brouillon';
                    case 'pending':
                      return 'En Attente';
                    case 'sent':
                      return 'Envoyé';
                    case 'unpaid':
                      return 'Impayé';
                    case 'paid':
                      return 'Payé';
                    default:
                      return currentErp.status;
                  }
                })()}
              </Tag>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>💰 {translate('Sous-total')}:</strong> {moneyFormatter({ amount: currentErp.subTotal, currency_code: currentErp.currency })}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>🧾 {translate('Taxes')}:</strong> {moneyFormatter({ amount: currentErp.taxTotal, currency_code: currentErp.currency })}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>💳 {translate('Payé')}:</strong> {moneyFormatter({ amount: currentErp.credit, currency_code: currentErp.currency })}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>📅 {translate('Date de début')}:</strong> {formatDate(currentErp.startDate)}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>📅 {translate('Date de fin')}:</strong> {formatDate(currentErp.endDate)}
            </div>
          </Col>
          <Col span={24}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>📝 {translate('Objet')}:</strong> {currentErp.object || 'N/A'}
            </div>
          </Col>
          {currentErp.notes && (
            <Col span={24}>
              <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
                <strong>📄 {translate('Notes')}:</strong> 
                <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                  {currentErp.notes}
                </div>
              </div>
            </Col>
          )}
        </Row>
      </div>

      <Divider />

      {/* Informations du client */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f6ffed' }}>
        <Title level={4} style={{ color: '#1890ff', marginBottom: '16px', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
          👥 {translate('Client')} : {client.name || 'N/A'}
        </Title>
        
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

      {/* Services du document */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f6ffed' }}>
        <Title level={4} style={{ color: '#1890ff', marginBottom: '16px', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
          🚀 {translate('Services facturés')}
        </Title>
        
        {servicesList && servicesList.length > 0 ? (
          servicesList.map((service) => (
            <Service key={service._id} service={service} currentErp={currentErp} translate={translate} />
          ))
        ) : (
          <p>{translate('Aucun service défini')}</p>
        )}
      </div>

      <Divider />

      {/* Résumé financier */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f6ffed' }}>
        <Title level={4} style={{ color: '#1890ff', marginBottom: '16px', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
          💰 {translate('Résumé financier')}
        </Title>
        
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <Row gutter={[12, 8]} style={{ marginBottom: '8px' }}>
            <Col span={12}>
              <p style={{ margin: 0, fontWeight: 'bold' }}>{translate('Sous-total')} :</p>
            </Col>
            <Col span={12}>
              <p style={{ margin: 0, textAlign: 'right' }}>
                {moneyFormatter({ amount: currentErp.subTotal, currency_code: currentErp.currency })}
              </p>
            </Col>
          </Row>

          {/* Affichage des taxes détaillées selon taxDetails */}
          {currentErp.taxDetails ? (
            <>
              {currentErp.taxDetails.tva && (
                <Row gutter={[12, 8]} style={{ marginBottom: '8px' }}>
                  <Col span={12}>
                    <p style={{ margin: 0 }}>TVA 18% :</p>
                  </Col>
                  <Col span={12}>
                    <p style={{ margin: 0, textAlign: 'right' }}>
                      {moneyFormatter({ amount: currentErp.taxDetails.tva, currency_code: currentErp.currency })}
                    </p>
                  </Col>
                </Row>
              )}
              {currentErp.taxDetails.css && (
                <Row gutter={[12, 8]} style={{ marginBottom: '8px' }}>
                  <Col span={12}>
                    <p style={{ margin: 0 }}>CSS 1% :</p>
                  </Col>
                  <Col span={12}>
                    <p style={{ margin: 0, textAlign: 'right' }}>
                      {moneyFormatter({ amount: currentErp.taxDetails.css, currency_code: currentErp.currency })}
                    </p>
                  </Col>
                </Row>
              )}
              {currentErp.taxDetails.tps && (
                <Row gutter={[12, 8]} style={{ marginBottom: '8px' }}>
                  <Col span={12}>
                    <p style={{ margin: 0 }}>TPS -{currentErp.taxRate}% :</p>
                  </Col>
                  <Col span={12}>
                    <p style={{ margin: 0, textAlign: 'right' }}>
                      -{moneyFormatter({ amount: currentErp.taxDetails.tps, currency_code: currentErp.currency })}
                    </p>
                  </Col>
                </Row>
              )}
              {currentErp.taxDetails.tax && (
                <Row gutter={[12, 8]} style={{ marginBottom: '8px' }}>
                  <Col span={12}>
                    <p style={{ margin: 0 }}>{currentErp.taxName || translate('Taxe')} ({currentErp.taxRate}%) :</p>
                  </Col>
                  <Col span={12}>
                    <p style={{ margin: 0, textAlign: 'right' }}>
                      {moneyFormatter({ amount: currentErp.taxDetails.tax, currency_code: currentErp.currency })}
                    </p>
                  </Col>
                </Row>
              )}
            </>
          ) : Number(currentErp.taxRate) === 19 ? (
            <>
              <Row gutter={[12, 8]} style={{ marginBottom: '8px' }}>
                <Col span={12}>
                  <p style={{ margin: 0 }}>TVA 18% :</p>
                </Col>
                <Col span={12}>
                  <p style={{ margin: 0, textAlign: 'right' }}>
                    {moneyFormatter({ amount: currentErp.subTotal * 0.18, currency_code: currentErp.currency })}
                  </p>
                </Col>
              </Row>
              <Row gutter={[12, 8]} style={{ marginBottom: '8px' }}>
                <Col span={12}>
                  <p style={{ margin: 0 }}>CSS 1% :</p>
                </Col>
                <Col span={12}>
                  <p style={{ margin: 0, textAlign: 'right' }}>
                    {moneyFormatter({ amount: currentErp.subTotal * 0.01, currency_code: currentErp.currency })}
                  </p>
                </Col>
              </Row>
            </>
          ) : Number(currentErp.taxRate) === 9.5 ? (
            <Row gutter={[12, 8]} style={{ marginBottom: '8px' }}>
              <Col span={12}>
                <p style={{ margin: 0 }}>TPS -9.5% :</p>
              </Col>
              <Col span={12}>
                <p style={{ margin: 0, textAlign: 'right' }}>
                  -{moneyFormatter({ amount: currentErp.subTotal * 0.095, currency_code: currentErp.currency })}
                </p>
              </Col>
            </Row>
          ) : Number(currentErp.taxRate) === 10.5 ? (
            <>
              <Row gutter={[12, 8]} style={{ marginBottom: '8px' }}>
                <Col span={12}>
                  <p style={{ margin: 0 }}>TPS -9.5% :</p>
                </Col>
                <Col span={12}>
                  <p style={{ margin: 0, textAlign: 'right' }}>
                    -{moneyFormatter({ amount: currentErp.subTotal * 0.095, currency_code: currentErp.currency })}
                  </p>
                </Col>
              </Row>
              <Row gutter={[12, 8]} style={{ marginBottom: '8px' }}>
                <Col span={12}>
                  <p style={{ margin: 0 }}>CSS 1% :</p>
                </Col>
                <Col span={12}>
                  <p style={{ margin: 0, textAlign: 'right' }}>
                    {moneyFormatter({ amount: currentErp.subTotal * 0.01, currency_code: currentErp.currency })}
                  </p>
                </Col>
              </Row>
            </>
          ) : Number(currentErp.taxRate) === 19.5 ? (
            <>
              <Row gutter={[12, 8]} style={{ marginBottom: '8px' }}>
                <Col span={12}>
                  <p style={{ margin: 0 }}>TPS -18.5% :</p>
                </Col>
                <Col span={12}>
                  <p style={{ margin: 0, textAlign: 'right' }}>
                    -{moneyFormatter({ amount: currentErp.subTotal * 0.185, currency_code: currentErp.currency })}
                  </p>
                </Col>
              </Row>
              <Row gutter={[12, 8]} style={{ marginBottom: '8px' }}>
                <Col span={12}>
                  <p style={{ margin: 0 }}>CSS 1% :</p>
                </Col>
                <Col span={12}>
                  <p style={{ margin: 0, textAlign: 'right' }}>
                    {moneyFormatter({ amount: currentErp.subTotal * 0.01, currency_code: currentErp.currency })}
                  </p>
                </Col>
              </Row>
            </>
          ) : (
            <Row gutter={[12, 8]} style={{ marginBottom: '8px' }}>
              <Col span={12}>
                <p style={{ margin: 0 }}>{translate('Total des Taxes')} :</p>
              </Col>
              <Col span={12}>
                <p style={{ margin: 0, textAlign: 'right' }}>
                  {moneyFormatter({ amount: currentErp.taxTotal, currency_code: currentErp.currency })}
                </p>
              </Col>
            </Row>
          )}

          <Divider style={{ margin: '16px 0' }} />

          <Row gutter={[12, 8]}>
            <Col span={12}>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>
                <strong>{translate('Total')}</strong> :
              </p>
            </Col>
            <Col span={12}>
              <p style={{ margin: 0, textAlign: 'right', fontWeight: 'bold', fontSize: '16px', color: '#1890ff' }}>
                <strong>
                  {(() => {
                    let finalTotal = currentErp.subTotal;
                    if (currentErp.taxName === 'TPS et CSS' || Number(currentErp.taxRate) === 10.5) {
                      // TPS et CSS : soustraire TPS, ajouter CSS
                      finalTotal = currentErp.subTotal - (currentErp.subTotal * 0.095) + (currentErp.subTotal * 0.01);
                    } else if (currentErp.taxName === 'TPS' || Number(currentErp.taxRate) === 9.5) {
                      // TPS seul : soustraire TPS
                      finalTotal = currentErp.subTotal - (currentErp.subTotal * 0.095);
                    } else if (currentErp.taxName === 'TPS CSS' || Number(currentErp.taxRate) === 19.5) {
                      // TPS CSS : soustraire TPS, ajouter CSS
                      finalTotal = currentErp.subTotal - (currentErp.subTotal * 0.185) + (currentErp.subTotal * 0.01);
                    } else if (currentErp.taxName === 'TVA et CSS' || Number(currentErp.taxRate) === 19) {
                      // TVA et CSS : ajouter TVA et CSS
                      finalTotal = currentErp.subTotal + (currentErp.subTotal * 0.18) + (currentErp.subTotal * 0.01);
                    } else if (currentErp.taxRate > 0) {
                      // Autres taxes : ajouter la taxe
                      finalTotal = currentErp.subTotal + currentErp.taxTotal;
                    }
                    return moneyFormatter({ amount: finalTotal, currency_code: currentErp.currency });
                  })()}
                </strong>
              </p>
            </Col>
          </Row>
        </div>
      </div>
    </>
  );
}
