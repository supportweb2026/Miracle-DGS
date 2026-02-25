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

const Service = ({ service, currentErp }) => {
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

export default function ReadService({ config, selectedService }) {
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
      const { services, invoice, ...others } = currentResult;

      if (services) {
        console.log('liste des services:',services);
        setServicesList(services);
        setCurrentErp(currentResult);
      } else if (invoice.services) {
        setServicesList(invoice.services);
        setCurrentErp({ ...invoice.services, ...others, ...invoice });
      }
    }
    return () => {
      setServicesList([]);
      setCurrentErp(resetErp);
    };
  }, [currentResult]);

  useEffect(() => {
    if (currentErp?.client) {
      setClient(currentErp.client);
    }
  }, [currentErp]);

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
        <Row>
          <Statistic title="Status" value={(() => {
            switch (currentErp.status) {
              case 'draft':
                return 'Brouillon';
              case 'pending':
                return 'En Attente';
              case 'sent':
                return 'Envoyé';
              default:
                return currentErp.status;
            }
          })()}  />
          <Statistic
            title="Nombre de jours"
            value={(() => {
              if (currentErp.services && currentErp.services.length > 0) {
                return currentErp.services.reduce((total, service) => total + (service.numberOfDays || 0), 0);
              }
              return 0;
            })() + ' jours'}
            style={{
              margin: '0 32px',
            }}
          />
          <Statistic
            title={translate('SubTotal')}
            value={moneyFormatter({
              amount: currentErp.subTotal,
              currency_code: currentErp.currency,
            })}
            style={{
              margin: '0 32px',
            }}
          />
          <Statistic
            title={translate('Total')}
            value={moneyFormatter({ amount: currentErp.total, currency_code: currentErp.currency })}
            style={{
              margin: '0 32px',
            }}
          />
          <Statistic
            title={translate('Paid')}
            value={moneyFormatter({
              amount: currentErp.credit,
              currency_code: currentErp.currency,
            })}
            style={{
              margin: '0 32px',
            }}
          />
        </Row>
      </PageHeader>

      <Divider dashed />
      <Descriptions title={`Client : ${currentErp.client.name}`}>
        <Descriptions.Item label={translate('Address')}>{client.address}</Descriptions.Item>
        <Descriptions.Item label={translate('email')}>{client.email}</Descriptions.Item>
        <Descriptions.Item label={translate('Phone')}>{client.phone}</Descriptions.Item>
      </Descriptions>
      <Divider />

      <Row gutter={[12, 0]}>
        <Col className="gutter-row" span={11}>
          <p>
            <strong>{translate('Prestations')}</strong>
          </p>
        </Col>
        <Col className="gutter-row" span={4}>
          <p
            style={{
              textAlign: 'right',
            }}
          >
            <strong>{translate('Tarif journalier')}</strong>
          </p>
        </Col>
        <Col className="gutter-row" span={4}>
          <p
            style={{
              textAlign: 'right',
            }}
          >
            <strong>{translate('Durée')}</strong>
          </p>
        </Col>
        <Col className="gutter-row" span={5}>
          <p
            style={{
              textAlign: 'right',
            }}
          >
            <strong>{translate('Total')}</strong>
          </p>
        </Col>
        <Divider />
      </Row>

      {servicesList.map((service) => (
        <Service key={service._id} service={service} currentErp={currentErp} />
      ))}

      <div
        style={{
          width: '300px',
          float: 'right',
          textAlign: 'right',
          fontWeight: '700',
        }}
      >
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={12}>
            <p>{translate('Sub Total')} :</p>
          </Col>
          <Col className="gutter-row" span={12}>
            <p>
              {moneyFormatter({ amount: currentErp.subTotal, currency_code: currentErp.currency })}
            </p>
          </Col>
        </Row>

        {/* Affichage des taxes détaillées selon taxDetails */}
        {currentErp.taxDetails ? (
          <>
            {currentErp.taxDetails.tva && (
              <Row gutter={[12, -5]}>
                <Col className="gutter-row" span={12}>
                  <p>TVA 18% :</p>
                </Col>
                <Col className="gutter-row" span={12}>
                  <p>
                    {moneyFormatter({ amount: currentErp.taxDetails.tva, currency_code: currentErp.currency })}
                  </p>
                </Col>
              </Row>
            )}
            {currentErp.taxDetails.css && (
              <Row gutter={[12, -5]}>
                <Col className="gutter-row" span={12}>
                  <p>CSS 1% :</p>
                </Col>
                <Col className="gutter-row" span={12}>
                  <p>
                    {moneyFormatter({ amount: currentErp.taxDetails.css, currency_code: currentErp.currency })}
                  </p>
                </Col>
              </Row>
            )}
            {currentErp.taxDetails.tps && (
              <Row gutter={[12, -5]}>
                <Col className="gutter-row" span={12}>
                  <p>TPS -{currentErp.taxRate}% :</p>
                </Col>
                <Col className="gutter-row" span={12}>
                  <p>
                    -{moneyFormatter({ amount: currentErp.taxDetails.tps, currency_code: currentErp.currency })}
                  </p>
                </Col>
              </Row>
            )}
            {currentErp.taxDetails.tax && (
              <Row gutter={[12, -5]}>
                <Col className="gutter-row" span={12}>
                  <p>{currentErp.taxName || translate('Taxe')} ({currentErp.taxRate}%) :</p>
                </Col>
                <Col className="gutter-row" span={12}>
                  <p>
                    {moneyFormatter({ amount: currentErp.taxDetails.tax, currency_code: currentErp.currency })}
                  </p>
                </Col>
              </Row>
            )}
          </>
        ) : Number(currentErp.taxRate) === 19 ? (
          <>
            <Row gutter={[12, -5]}>
              <Col className="gutter-row" span={12}>
                <p>TVA 18% :</p>
              </Col>
              <Col className="gutter-row" span={12}>
                <p>
                  {moneyFormatter({ amount: currentErp.subTotal * 0.18, currency_code: currentErp.currency })}
                </p>
              </Col>
            </Row>
            <Row gutter={[12, -5]}>
              <Col className="gutter-row" span={12}>
                <p>CSS 1% :</p>
              </Col>
              <Col className="gutter-row" span={12}>
                <p>
                  {moneyFormatter({ amount: currentErp.subTotal * 0.01, currency_code: currentErp.currency })}
                </p>
              </Col>
            </Row>
          </>
        ) : Number(currentErp.taxRate) === 9.5 ? (
          <>
            <Row gutter={[12, -5]}>
              <Col className="gutter-row" span={12}>
                <p>TPS -9.5% :</p>
              </Col>
              <Col className="gutter-row" span={12}>
                <p>
                  -{moneyFormatter({ amount: currentErp.subTotal * 0.095, currency_code: currentErp.currency })}
                </p>
              </Col>
            </Row>
          </>
        ) : Number(currentErp.taxRate) === 10.5 ? (
          <>
            <Row gutter={[12, -5]}>
              <Col className="gutter-row" span={12}>
                <p>TPS -9.5% :</p>
              </Col>
              <Col className="gutter-row" span={12}>
                <p>
                  -{moneyFormatter({ amount: currentErp.subTotal * 0.095, currency_code: currentErp.currency })}
                </p>
              </Col>
            </Row>
            <Row gutter={[12, -5]}>
              <Col className="gutter-row" span={12}>
                <p>CSS 1% :</p>
              </Col>
              <Col className="gutter-row" span={12}>
                <p>
                  {moneyFormatter({ amount: currentErp.subTotal * 0.01, currency_code: currentErp.currency })}
                </p>
              </Col>
            </Row>
          </>
        ) : Number(currentErp.taxRate) === 19.5 ? (
          <>
            <Row gutter={[12, -5]}>
              <Col className="gutter-row" span={12}>
                <p>TPS -18.5% :</p>
              </Col>
              <Col className="gutter-row" span={12}>
                <p>
                  -{moneyFormatter({ amount: currentErp.subTotal * 0.185, currency_code: currentErp.currency })}
                </p>
              </Col>
            </Row>
            <Row gutter={[12, -5]}>
              <Col className="gutter-row" span={12}>
                <p>CSS 1% :</p>
              </Col>
              <Col className="gutter-row" span={12}>
                <p>
                  {moneyFormatter({ amount: currentErp.subTotal * 0.01, currency_code: currentErp.currency })}
                </p>
              </Col>
            </Row>
          </>
        ) : (
          <>
            <Row gutter={[12, -5]}>
              <Col className="gutter-row" span={12}>
                <p>{translate('Total des Taxes')} :</p>
              </Col>
              <Col className="gutter-row" span={12}>
                <p>
                  {moneyFormatter({ amount: currentErp.taxTotal, currency_code: currentErp.currency })}
                </p>
              </Col>
            </Row>
          </>
        )}

        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={12}>
            <p>
              <strong>{translate('Total')}</strong> :
            </p>
          </Col>
          <Col className="gutter-row" span={12}>
            <p>
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
    </>
  );
}
