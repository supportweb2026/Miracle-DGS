import React from 'react';
import { Descriptions, Divider } from 'antd';

const ViewService= ({ selectedItem, config }) => {
  // Exemple de contenu que vous pourriez avoir dans selectedItem
  const { name, description, price, serviceDate } = selectedItem;

  return (
    <div>
      <Divider dashed />
      <Descriptions title={`Service: ${name}`} column={1}>
        <Descriptions.Item label="Description">{description}</Descriptions.Item>
        <Descriptions.Item label="Price">{price}</Descriptions.Item>
        <Descriptions.Item label="Service Date">{serviceDate}</Descriptions.Item>
      </Descriptions>
      <Divider />
    </div>
  );
};

export default ViewService;
