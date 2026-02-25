import React from 'react';
import { Row, Col, Spin } from 'antd';
import { Column } from '@ant-design/charts';

const GraphPreviewCard = ({
  title = 'Graphique Mensuel',
  isLoading = false,
  invoiceResultTotal = 0,
  quoteResultTotal = 0,
  invoiceResultUndueTotal = 0,
}) => {
  const data = [
    { type: 'Factures', montant: invoiceResultTotal },
    { type: 'Devis', montant: quoteResultTotal },
    { type: 'Impayés', montant: invoiceResultUndueTotal },
  ];

  const colors = {
    Factures: '#007bff', // 🔵 Bleu
    Devis: '#28a745', // 🟢 Vert
    Impayés: '#ffc107', // 🟡 Jaune
  };

  const config = {
    data,
    xField: 'type',
    yField: 'montant',
    seriesField: 'type',
    colorField: 'type',
    color: ({ type }) => colors[type],

    columnWidthRatio: 0.8, // 🔥 Taille des colonnes ajustée
    maxColumnWidth: 50, // 🔥 Largeur max pour éviter des colonnes trop fines

    padding: [10, 30, 40, 10],

    xAxis: {
      label: {
        autoHide: false,
        autoRotate: false,
      },
    },
    // 🚀 Pas de modification de l'axe des ordonnées !

    legend: {
      position: 'top-left',
    },
    tooltip: {
        showMarkers: false,
        formatter: (datum) => ({
          name: datum.type,
          value: `${datum.montant.toLocaleString()} €`,
        }),
      },
  
  };

  return (
    <Row className="pad20" justify="center">
      <Col span={24} style={{ textAlign: 'center' }}>
        <h3 style={{ color: '#22075e', fontSize: 'large', marginBottom: 40, marginTop: 0 }}>
          {title}
        </h3>
        {isLoading ? (
          <div style={{ textAlign: 'center' }}>
            <Spin />
          </div>
        ) : (
          <Column {...config} />
        )}
      </Col>
    </Row>
  );
};

export default GraphPreviewCard;
