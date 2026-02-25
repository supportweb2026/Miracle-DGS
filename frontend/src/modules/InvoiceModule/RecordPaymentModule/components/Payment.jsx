import { useState, useEffect } from 'react';

import { Button, Row, Col, Descriptions, Tag, Divider } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { FileTextOutlined, CloseCircleOutlined } from '@ant-design/icons';

import { generate as uniqueId } from 'shortid';

import { useMoney } from '@/settings';

import RecordPayment from './RecordPayment';
import useLanguage from '@/locale/useLanguage';

import { useNavigate } from 'react-router-dom';

console.log('=== PAYMENT COMPONENT LOADED ===');

export default function Payment({ config, currentItem }) {
  console.log('=== PAYMENT COMPONENT RENDER ===');
  console.log('Config:', config);
  console.log('Current Item:', currentItem);

  const translate = useLanguage();
  const { entity, ENTITY_NAME } = config;

  const money = useMoney();
  const navigate = useNavigate();

  const [currentErp, setCurrentErp] = useState(currentItem);
  console.log('Initial currentErp:', currentErp);

  useEffect(() => {
    console.log('=== PAYMENT EFFECT ===');
    console.log('Current Item in effect:', currentItem);
    const controller = new AbortController();
    if (currentItem) {
      const { invoice, _id, ...others } = currentItem;
      console.log('Setting currentErp with:', { ...others, ...invoice, _id });
      setCurrentErp({ ...others, ...invoice, _id });
    }
    return () => controller.abort();
  }, [currentItem]);

  const [client, setClient] = useState({});

  useEffect(() => {
    console.log('=== CLIENT EFFECT ===');
    console.log('Current ERP in client effect:', currentErp);
    if (currentErp?.client) {
      console.log('Setting client with:', currentErp.client);
      setClient(currentErp.client);
    }
  }, [currentErp]);

  const handleShowInvoice = () => {
    console.log('=== SHOW INVOICE CLICKED ===');
    console.log('Current ERP:', currentErp);
    console.log('Current ERP ID:', currentErp?._id);
    console.log('Current ERP Invoice:', currentErp?.invoice);
    console.log('Current ERP Invoice ID:', currentErp?.invoice?._id);

    if (!currentErp?._id) {
      console.error('No current ERP ID found');
      return;
    }

    try {
      console.log('Attempting to navigate to invoice page');
      navigate(`/invoice/read/${currentErp._id}`);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  // Ajout d'un log pour vérifier le rendu du bouton
  console.log('=== RENDERING PAYMENT COMPONENT ===');
  console.log('Button disabled state:', !currentErp?._id);
  console.log('Current ERP for button:', currentErp);

  return (
    <>
      <Row gutter={[12, 12]}>
        <Col
          className="gutter-row"
          xs={{ span: 24 }}
          sm={{ span: 24 }}
          md={{ span: 24 }}
          lg={{ span: 20, push: 2 }}
        >
          <PageHeader
            onBack={() => navigate(`/${entity.toLowerCase()}`)}
            title={`Enregistrement paiement pour ${ENTITY_NAME} # ${currentErp?.number}/${
              currentErp?.year || ''
            }`}
            ghost={false}
            tags={<span>{currentErp?.paymentStatus && " " && translate(currentErp.paymentStatus)}</span>}
            extra={[
              <Button
                key={`${uniqueId()}`}
                onClick={() => {
                  console.log('=== CLIC SUR CANCEL ===');
                  navigate(`/${entity.toLowerCase()}`);
                }}
                icon={<CloseCircleOutlined />}
              >
                {translate('Cancel')}
              </Button>,
              <Button
                key={`${uniqueId()}`}
                onClick={handleShowInvoice}
                icon={<FileTextOutlined />}
                disabled={!currentErp?._id}
              >
                {translate('Show Invoice')}
              </Button>,
            ]}
            style={{
              padding: '20px 0px',
            }}
          ></PageHeader>
          <Divider dashed />
        </Col>
      </Row>
      <Row gutter={[12, 12]}>
        <Col
          className="gutter-row"
          xs={{ span: 24, order: 2 }}
          sm={{ span: 24, order: 2 }}
          md={{ span: 10, order: 2, push: 2 }}
          lg={{ span: 10, order: 2, push: 4 }}
        >
          <div className="space50"></div>
          <Descriptions title={`${translate('Client')}  : ${currentErp.client.name}`} column={1}>
            <Descriptions.Item label={translate('email')}>{client.email}</Descriptions.Item>
            <Descriptions.Item label={translate('phone')}>{client.phone}</Descriptions.Item>
            <Divider dashed />
            <Descriptions.Item label={translate('payment status')}>
            </Descriptions.Item>
            <Descriptions.Item label={translate('sub total')}>
              {money.moneyFormatter({
                amount: currentErp.subTotal,
                currency_code: currentErp.currency,
              })}
            </Descriptions.Item>
            <Descriptions.Item label={translate('total')}>
              {money.moneyFormatter({
                amount: currentErp.total,
                currency_code: currentErp.currency,
              })}
            </Descriptions.Item>
            <Descriptions.Item label={translate('discount')}>
              {money.moneyFormatter({
                amount: currentErp.discount,
                currency_code: currentErp.currency,
              })}
            </Descriptions.Item>
            <Descriptions.Item label={translate('Paid')}>
              {money.moneyFormatter({
                amount: currentErp.credit,
                currency_code: currentErp.currency,
              })}
            </Descriptions.Item>
          </Descriptions>
        </Col>

        <Col
          className="gutter-row"
          xs={{ span: 24, order: 1 }}
          sm={{ span: 24, order: 1 }}
          md={{ span: 12, order: 1 }}
          lg={{ span: 10, order: 1, push: 2 }}
        >
          <RecordPayment config={config} />
        </Col>
      </Row>
    </>
  );
}
