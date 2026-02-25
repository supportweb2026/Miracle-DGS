import { Card, Row, Col, Statistic, Spin, Divider } from 'antd';
import { useMoney } from '@/settings';
import { selectMoneyFormat } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';

export default function TaxSummaryCard({ data, isLoading }) {
  const { moneyFormatter } = useMoney();
  const money_format_settings = useSelector(selectMoneyFormat);

  if (isLoading) {
    return (
      <Card style={{ marginBottom: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <Spin />
        </div>
      </Card>
    );
  }

  // Calculer le chiffre d'affaires net (factures payées - dépenses)
  const netRevenue = (data?.paidInvoices || 0) - (data?.totalExpenses || 0);

  return (
    <>
      <Card title="Résumé Fiscal" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Statistic
              title="TVA Collectée"
              value={data?.tvaCollected || 0}
              formatter={(value) => moneyFormatter({
                amount: value,
                currency_code: money_format_settings?.default_currency_code
              })}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="CSS Collectée"
              value={data?.cssCollected || 0}
              formatter={(value) => moneyFormatter({
                amount: value,
                currency_code: money_format_settings?.default_currency_code
              })}
              valueStyle={{ color: '#cf1322' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="TVA Déductible"
              value={data?.tvaDeductible || 0}
              formatter={(value) => moneyFormatter({
                amount: value,
                currency_code: money_format_settings?.default_currency_code
              })}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="TPS Collectée"
              value={data?.tpsCollected || 0}
              formatter={(value) => moneyFormatter({
                amount: value,
                currency_code: money_format_settings?.default_currency_code
              })}
              valueStyle={{ color: '#ff9900' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Chiffre d'affaires net simplifié */}
      <Card 
        style={{ 
          marginBottom: 16,
          background: 'white',
          border: '1px solid #d9d9d9',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col span={24} style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ 
                color: '#22075e', 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: 500
              }}>
                Chiffre d'Affaires Net
              </h2>
              <p style={{ 
                color: '#666', 
                margin: '8px 0 0 0', 
                fontSize: '14px'
              }}>
                Ce mois-ci
              </p>
            </div>
            
            <div style={{ 
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ 
                fontSize: '42px', 
                fontWeight: 'bold', 
                color: '#1890ff',
                lineHeight: 1.2,
                marginBottom: '8px'
              }}>
                {moneyFormatter({
                  amount: netRevenue,
                  currency_code: 'XAF'
                })}
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </>
  );
} 