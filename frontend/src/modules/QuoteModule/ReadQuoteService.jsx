import { useState, useEffect } from 'react';
import { Divider, Typography, Table, Tag, Button, Row, Col, Descriptions, Statistic } from 'antd';
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

const Service = ({ service, currentErp }) => {
  const { moneyFormatter } = useMoney();
  const { dateFormat } = useDate();
  const translate = useLanguage();
  
  // Fonction pour formater les dates
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return dayjs(date).format(dateFormat);
  };

  const columns = [
    {
      title: translate('Service'),
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: translate('Nombre d\'agents'),
      dataIndex: 'numberOfAgents',
      key: 'numberOfAgents',
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: translate('Nombre de jours'),
      dataIndex: 'numberOfDays',
      key: 'numberOfDays',
      render: (value) => <Tag color="green">{value || 1} {value === 1 ? 'jour' : 'jours'}</Tag>,
    },
    {
      title: translate('Taux journalier'),
      dataIndex: 'dailyRate',
      key: 'dailyRate',
      render: (value) => moneyFormatter({ amount: value, currency_code: currentErp.currency }),
    },
    {
      title: translate('Date de début'),
      dataIndex: 'startDate',
      key: 'startDate',
      render: (value) => formatDate(value),
    },
    {
      title: translate('Date de fin'),
      dataIndex: 'endDate',
      key: 'endDate',
      render: (value) => formatDate(value),
    },
    {
      title: translate('Total'),
      dataIndex: 'total',
      key: 'total',
      render: (value) => (
        <strong style={{ color: '#52c41a' }}>
          {moneyFormatter({ amount: value, currency_code: currentErp.currency })}
        </strong>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={service}
      pagination={false}
      rowKey="_id"
      size="middle"
      style={{ marginTop: '16px' }}
    />
  );
};

const handleMailto = (currentErp, entity) => {
  const name = currentErp.prospect || '';
  const email = currentErp.prospectEmail || '';
  const number = currentErp.number || '';
  const year = currentErp?.year || '';
  let subject = '';
  let body = '';

  switch (entity) {
    case 'quote':
      subject = `Votre devis #${number}/${year}`;
      body = `Bonjour ${name},%0D%0A%0D%0AVeuillez trouver ci-joint votre devis n°${number}/${year}.%0D%0ACordialement.`;
      break;
    default:
      subject = 'Document';
      body = 'Bonjour,%0D%0A%0D%0AVeuillez trouver ci-joint votre document.%0D%0ACordialement.';
  }

  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
};

export default function ReadQuoteService({ config, selectedService }) {
  const translate = useLanguage();
  const { entity, ENTITY_NAME } = config;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { moneyFormatter } = useMoney();
  const { dateFormat } = useDate();
  
  // Fonction pour formater les dates
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return dayjs(date).format(dateFormat);
  };

  const { result: currentResult } = useSelector(selectCurrentItem);
  const resetErp = {
    status: '',
    prospect: '',
    prospectAddress: '',
    prospectPhone: '',
    prospectEmail: '',
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

  useEffect(() => {
    if (currentResult) {
      console.log('=== CURRENT RESULT IN READ QUOTE SERVICE ===');
      console.log('Current Result:', currentResult);
      setCurrentErp(currentResult);
    }
  }, [currentResult]);


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
  if (!currentErp.prospect || !currentErp.services) {
    console.log('=== INCOMPLETE ERP DATA ===');
    console.log('Prospect:', currentErp.prospect);
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
        return 'purple';
      case 'approved':
      case 'approuvé':
        return 'green';
      case 'rejected':
      case 'rejeté':
        return 'red';
      default:
        return 'default';
    }
  };

  return (
    <>
      <PageHeader
        onBack={() => {
          navigate(`/${entity.toLowerCase()}`);
        }}
        title={`${ENTITY_NAME} # ${currentErp.number}/${currentErp.year || ''}`}
        ghost={false}
        tags={[
          <span key="status">{currentErp.status && translate(currentErp.status)}</span>,
          currentErp.paymentStatus && (
            <span key="paymentStatus">
              {' '}
              {currentErp.paymentStatus && translate(currentErp.paymentStatus)}
            </span>
          ),
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
              navigate(`/${entity.toLowerCase()}/update/${currentErp._id}`);
            }}
            icon={<EditOutlined />}
            type="primary"
          >
            {translate('Edit')}
          </Button>,
        ]}
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
                  case 'approved':
                    return 'Approuvé';
                  case 'rejected':
                    return 'Rejeté';
                  default:
                    return currentErp.status;
                }
              })()} 
              valueStyle={{ color: getStatusColor(currentErp.status) === 'green' ? '#52c41a' : getStatusColor(currentErp.status) === 'red' ? '#ff4d4f' : getStatusColor(currentErp.status) === 'orange' ? '#fa8c16' : '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Nombre d'agents total"
              value={(() => {
                if (currentErp.services && currentErp.services.length > 0) {
                  return currentErp.services.reduce((total, service) => total + (service.numberOfAgents || 0), 0);
                }
                return 0;
              })()}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Nombre de jours"
              value={(() => {
                if (currentErp.services && currentErp.services.length > 0) {
                  // Prendre le numberOfDays du premier service (ils sont tous identiques)
                  const numberOfDays = currentErp.services[0]?.numberOfDays || 1;
                  return `${numberOfDays} ${numberOfDays === 1 ? 'jour' : 'jours'}`;
                }
                return '1 jour';
              })()}
              valueStyle={{ color: '#52c41a' }}
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
      
      {/* Informations du devis */}
      <div style={{ marginBottom: '24px', padding: '20px', border: '2px solid #e6f7ff', borderRadius: '12px', backgroundColor: '#f6ffed' }}>
        <Title level={4} style={{ color: '#1890ff', marginBottom: '16px', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
          📋 {translate('Informations du devis')}
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
                    case 'approved':
                      return 'Approuvé';
                    case 'rejected':
                      return 'Rejeté';
                    default:
                      return currentErp.status;
                  }
                })()}
              </Tag>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>📅 {translate('Date d\'expiration')}:</strong> {formatDate(currentErp.expiredDate)}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>💰 {translate('Taxe')}:</strong> {(() => {
                if (currentErp.taxRate === 10.5) return 'TPS et CSS';
                if (currentErp.taxRate === 19) return 'TVA et CSS';
                if (currentErp.taxRate === 9.5) return 'TPS';
                if (currentErp.taxRate === 18) return 'TVA 18%';
                return `Taxe ${currentErp.taxRate}%`;
              })()}
            </div>
          </Col>
          <Col span={8}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>💵 {translate('Devise')}:</strong> {currentErp.currency || 'XAF'}
            </div>
          </Col>
        </Row>
      </div>

      <Divider />

      {/* Informations du prospect */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f6ffed' }}>
        <Title level={4} style={{ color: '#1890ff', marginBottom: '16px', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
          👤 {translate('Informations du prospect')}
        </Title>
        
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>🏢 {translate('Nom')}:</strong> {currentErp.prospect || 'N/A'}
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>📧 {translate('Email')}:</strong> {currentErp.prospectEmail || 'N/A'}
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>📞 {translate('Téléphone')}:</strong> {currentErp.prospectPhone || 'N/A'}
            </div>
          </Col>
          <Col span={12}>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              <strong>📍 {translate('Adresse')}:</strong> {currentErp.prospectAddress || 'N/A'}
            </div>
          </Col>
        </Row>
      </div>

      <Divider />

      {/* Services du devis */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f6ffed' }}>
        <Title level={4} style={{ color: '#1890ff', marginBottom: '16px', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
          🚀 {translate('Services du devis')}
        </Title>
        
        <Service service={servicesList} currentErp={currentErp} />
      </div>

      <Divider />

      {/* Résumé financier */}
      <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f6ffed' }}>
        <Title level={4} style={{ color: '#1890ff', marginBottom: '16px', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
          💰 {translate('Résumé financier')}
        </Title>
        
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Statistic
              title={translate('Sous-total')}
              value={moneyFormatter({ amount: currentErp.subTotal, currency_code: currentErp.currency })}
              valueStyle={{ color: '#52c41a', fontSize: '18px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={`${translate('Taxe')} (${(() => {
                if (currentErp.taxRate === 10.5) return 'TPS et CSS';
                if (currentErp.taxRate === 19) return 'TVA et CSS';
                if (currentErp.taxRate === 9.5) return 'TPS';
                if (currentErp.taxRate === 18) return 'TVA 18%';
                return `Taxe ${currentErp.taxRate}%`;
              })()})`}
              value={moneyFormatter({ amount: currentErp.taxTotal, currency_code: currentErp.currency })}
              valueStyle={{ color: '#52c41a', fontSize: '18px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={translate('Total')}
              value={moneyFormatter({ amount: currentErp.total, currency_code: currentErp.currency })}
              valueStyle={{ color: '#fa8c16', fontSize: '24px', fontWeight: 'bold' }}
            />
          </Col>
        </Row>
        
        {/* Détails des taxes */}
        {currentErp.taxDetails && Object.keys(currentErp.taxDetails).length > 0 && (
          <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
            <Title level={5} style={{ color: '#1890ff', marginBottom: '12px' }}>
              📊 {translate('Détails des taxes')}
            </Title>
            <Row gutter={[16, 16]}>
              {Object.entries(currentErp.taxDetails).map(([key, value]) => (
                <Col span={8} key={key}>
                  <div style={{ textAlign: 'center', padding: '8px' }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                      {(() => {
                        switch (key.toLowerCase()) {
                          case 'tps':
                            return 'TPS (Taxe Prestation de service)';
                          case 'css':
                            return 'CSS (Contribution Sociale de Solidarité)';
                          case 'tva':
                            return 'TVA (Taxe sur la Valeur Ajoutée)';
                          default:
                            return key.toUpperCase();
                        }
                      })()}
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                      {moneyFormatter({ amount: value, currency_code: currentErp.currency })}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </div>

      {/* Notes */}
      {currentErp.notes && (
        <>
          <Divider />
          <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f6ffed' }}>
            <Title level={4} style={{ color: '#1890ff', marginBottom: '16px', borderBottom: '2px solid #1890ff', paddingBottom: '8px' }}>
              📝 {translate('Notes')}
            </Title>
            <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
              {currentErp.notes}
            </div>
          </div>
        </>
      )}
    </>
  );
}
