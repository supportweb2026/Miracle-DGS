import { useState, useEffect } from 'react';
import { Form, Divider } from 'antd';
import dayjs from 'dayjs';
import { Button, Tag } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';

import { useSelector, useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';

import calculate from '@/utils/calculate';
import { generate as uniqueId } from 'shortid';
import { selectUpdatedItem } from '@/redux/erp/selectors';
import Loading from '@/components/Loading';

import { CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

import { settingsAction } from '@/redux/settings/actions';
// import { StatusTag } from '@/components/Tag';

function SaveForm({ form, translate }) {
  const handelClick = () => {
    form.submit();
  };

  return (
    <Button onClick={handelClick} type="primary" icon={<PlusOutlined />}>
      {translate('update')}
    </Button>
  );
}

export default function UpdateItem({ config, UpdateForm }) {
  const translate = useLanguage();
  let { entity } = config;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { current, isLoading, isSuccess } = useSelector(selectUpdatedItem);
  const [form] = Form.useForm();
  const [subTotal, setSubTotal] = useState(0);

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

  const [currentErp, setCurrentErp] = useState(current ?? resetErp);

  const { id } = useParams();

  const handelValuesChange = (changedValues, values) => {
    const items = values['items'];
    let subTotal = 0;

    if (items) {
      items.map((item) => {
        if (item) {
          if (item.quantity && item.price) {
            let total = calculate.multiply(item['quantity'], item['price']);
            //sub total
            subTotal = calculate.add(subTotal, total);
          }
        }
      });
      setSubTotal(subTotal);
    }
  };

  const onSubmit = (fieldsValue) => {
    let dataToUpdate = { ...fieldsValue };
    if (fieldsValue) {
      if (fieldsValue.date || fieldsValue.expiredDate) {
        dataToUpdate.date = dayjs(fieldsValue.date).format('YYYY-MM-DDTHH:mm:ss.SSSZ');
        dataToUpdate.expiredDate = dayjs(fieldsValue.expiredDate).format(
          'YYYY-MM-DDTHH:mm:ss.SSSZ'
        );
      }
      if (fieldsValue.startDate) {
        dataToUpdate.startDate = dayjs(fieldsValue.startDate).format('YYYY-MM-DD');
      }
      if (fieldsValue.endDate) {
        dataToUpdate.endDate = dayjs(fieldsValue.endDate).format('YYYY-MM-DD');
      }
      if (fieldsValue.services) {
        dataToUpdate.services = fieldsValue.services.map(service => ({
          ...service,
          startDate: dayjs(service.startDate).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          endDate: dayjs(service.endDate).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          dailyRate: service.dailyRate,
          numberOfAgents: service.numberOfAgents,
          siteTariffId: service.siteTariffId
        }));
      }
    }

    dispatch(erp.update({ entity, id, jsonData: dataToUpdate }));
  };
  useEffect(() => {
    if (isSuccess) {
      form.resetFields();
      setSubTotal(0);
      dispatch(erp.resetAction({ actionType: 'update' }));
      navigate(`/${entity.toLowerCase()}/read/${id}`);
    }
  }, [isSuccess]);

  useEffect(() => {
    console.log('🔍 UpdateItem useEffect - current:', current);
    console.log('🔍 UpdateItem useEffect - form:', form);
    
    if (current) {
      setCurrentErp(current);
      let formData = { ...current };
      
      console.log('🔍 UpdateItem - formData original:', formData);
      
      if (formData.date) {
        formData.date = dayjs(formData.date);
      }
      if (formData.startDate) {
        formData.startDate = dayjs(formData.startDate);
      }
      if (formData.endDate) {
        formData.endDate = dayjs(formData.endDate);
      }
      if (formData.expiredDate) {
        formData.expiredDate = dayjs(formData.expiredDate);
      }
      if (formData.services) {
        formData.services = formData.services.map(service => ({
          ...service,
          startDate: dayjs(service.startDate),
          endDate: dayjs(service.endDate)
        }));
      }
      if (!formData.taxRate) {
        formData.taxRate = 0;
      }

      const { subTotal } = formData;
      
      console.log('🔍 UpdateItem - formData traité:', formData);
      console.log('🔍 UpdateItem - Champs spécifiques:', {
        number: formData.number,
        year: formData.year,
        status: formData.status
      });

      form.resetFields();
      form.setFieldsValue(formData);
      setSubTotal(subTotal);
      
      console.log('🔍 UpdateItem - setFieldsValue appelé');
    } else {
      console.log('❌ UpdateItem - current est null/undefined');
    }
  }, [current]);
//status paymentstatus facture tizi
  return (
    <>
      <PageHeader
        onBack={() => {
          navigate(`/${entity.toLowerCase()}`);
        }}
        title={translate('update')}
        ghost={false}
        tags={[
          <span key="status">{currentErp.status && translate(currentErp.status)}</span>,
          currentErp.paymentStatus && (
            <>{' / '} 
            <span key="paymentStatus">
              {currentErp.paymentStatus && translate(currentErp.paymentStatus)}
            </span>
            </>
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
            {translate('Cancel')}
          </Button>,
          <SaveForm translate={translate} form={form} key={`${uniqueId()}`} />,
        ]}
        style={{
          padding: '20px 0px',
        }}
      ></PageHeader>
      <Divider dashed />
      <Loading isLoading={isLoading}>
        <Form form={form} layout="vertical" onFinish={onSubmit} onValuesChange={handelValuesChange}>
          <UpdateForm subTotal={subTotal} current={current} form={form} />
        </Form>
      </Loading>
    </>
  );
}
