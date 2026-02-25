import { useState, useEffect, useRef } from 'react';
import { Form, Input, InputNumber, Button, Select, Divider, Row, Col } from 'antd';

import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

import { DatePicker } from 'antd';

import AutoCompleteAsync from '@/components/AutoCompleteAsync';

import ItemRow from '@/modules/ErpPanelModule/ItemRow';

import MoneyInputFormItem from '@/components/MoneyInputFormItem';
import { selectFinanceSettings } from '@/redux/settings/selectors';
import { useDate } from '@/settings';
import useLanguage from '@/locale/useLanguage';

import calculate from '@/utils/calculate';
import { useSelector } from 'react-redux';
import SelectAsync from '@/components/SelectAsync';

import { ConfigProvider } from 'antd'; // Importer ConfigProvider
import { request } from '@/request';

import locale from 'antd/locale/fr_FR';
import dayjs from 'dayjs';

import 'dayjs/locale/fr';

dayjs.locale('fr');
//dayjs.locale('fr');

export default function InvoiceForm({ subTotal = 0, current = null, services = [], form = null  }) {
  const { last_invoice_number } = useSelector(selectFinanceSettings);

  if (last_invoice_number === undefined) {
    return <></>;
  }

  return <LoadInvoiceForm subTotal={subTotal} current={current} services={services} form={form} />;
}

function LoadInvoiceForm({ subTotal = 0, current = null, services = [], form = null  }) {
  
  console.log('🔍 LoadInvoiceForm - Props reçues:', { subTotal, current, services, form });
  
  const [servicesList, setServicesList] = useState([]);
  const formRef = form || useRef();
  
  console.log('🔍 LoadInvoiceForm - formRef:', formRef);

  const translate = useLanguage();
  const { dateFormat } = useDate();
  const { last_invoice_number } = useSelector(selectFinanceSettings);
  const [total, setTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [lastNumber, setLastNumber] = useState(() => last_invoice_number + 1);

  const handelTaxChange = (value) => {
    setTaxRate(value / 100);
  };
//
const fetchAllServices = async () => {
  console.log('fetchallservice tizi macadam');
  let allServices = [];

  try {
    console.log('appel request');
    const response = await request.list({ entity: 'service' });
    console.log('recu ^response');

    if (response.success && response.result && Array.isArray(response.result)) {
      allServices = response.result;
      console.log('recup sucess');
      console.log(allServices);
    } else {
      console.log("Aucun service trouvé.");
      return; // Sortir de la fonction si aucun service n'est trouvé
    }

    let servicesList = allServices.map(service => ({
      label: service.name,   
      value: service.tauxJournalier 
    }));

    console.log("Services sous forme de label-value:", servicesList);

    

    // Si vous voulez mettre à jour l'état service, faites-le aussi ici si nécessaire
    setServicesList(servicesList);
    console.log("Services sous forme de Map:", servicesList);

    // Retourner la Map des services
    return servicesList;
  } catch (error) {
    console.error("Erreur lors de la récupération des services :", error);
  }
};

useEffect(() => {
  // Appel de la fonction fetchAllServices qui gère déjà tout le traitement
  const getServices = async () => {
    const result = await fetchAllServices();
    if (result) {
      setServicesList(result); // Met à jour l'état avec la liste des services traitée
    }
  };
  getServices();
}, []); 

//
  useEffect(() => {
    console.log('🔍 InvoiceForm useEffect - current:', current);
    console.log('🔍 InvoiceForm useEffect - formRef:', formRef);
    
    if (current) {
      const { taxRate = 0, year, number, status } = current;
      console.log('🔍 InvoiceForm - Données extraites:', { taxRate, year, number, status });
      
      setTaxRate(taxRate / 100);
      setCurrentYear(year);
      setLastNumber(number);
      
      // Forcer la mise à jour des champs du formulaire
      if (formRef) {
        console.log('🔍 InvoiceForm - Mise à jour du formulaire avec:', {
          number: number,
          year: year,
          status: status || 'draft'
        });
        
        formRef.setFieldsValue({
          number: number,
          year: year,
          status: status || 'draft'
        });
        
        console.log('🔍 InvoiceForm - setFieldsValue appelé');
      } else {
        console.log('❌ InvoiceForm - formRef non disponible');
      }
    } else {
      console.log('❌ InvoiceForm - current est null/undefined');
    }
  }, [current, formRef]);
  useEffect(() => {
    const currentTotal = calculate.add(calculate.multiply(subTotal, taxRate), subTotal);
    console.log('currentTotal:',currentTotal);
    setTaxTotal(Number.parseFloat(calculate.multiply(subTotal, taxRate)));
    setTotal(Number.parseFloat(currentTotal));
  }, [subTotal, taxRate]);



  return (
    <ConfigProvider locale={locale}> {/* Appliquer la locale française ici tizi */} 
    <>
      <Row gutter={[12, 0]}>
        <Col className="gutter-row" span={8}>
          <Form.Item
            name="client"
            label={translate('ClientZ')}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <AutoCompleteAsync
              entity={'client'}
              displayLabels={['name']}
              searchFields={'name'}
              redirectLabel={'Add New Client'}
              withRedirect
              urlToRedirect={'/customer'}
            />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={3}>
          <Form.Item
            label={translate('number')}
            name="number"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber 
              min={1} 
              style={{ width: '100%' }} 
              onChange={(value) => console.log('🔍 Champ number changé:', value)}
            />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={3}>
          <Form.Item
            label={translate('year')}
            name="year"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              onChange={(value) => console.log('🔍 Champ year changé:', value)}
            />
          </Form.Item>
        </Col>

        <Col className="gutter-row" span={5}>
          <Form.Item
            label={translate('status')}
            name="status"
            rules={[
              {
                required: false,
              },
            ]}
          >
            <Select
              options={[
                { value: 'draft', label: translate('Draft') },
                { value: 'pending', label: translate('Pending') },
                { value: 'sent', label: translate('Sent') },
              ]}
              onChange={(value) => console.log('🔍 Champ status changé:', value)}
            ></Select>
          </Form.Item>
        </Col>

        <Col className="gutter-row" span={8}>
          <Form.Item
            name="date"
            label={translate('Date')}
            rules={[
              {
                required: true,
                type: 'object',
              },
            ]}
            initialValue={current?.date ? dayjs(current.date) : dayjs()}
          >
            <DatePicker style={{ width: '100%' }} format={dateFormat } />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={8}>
          <Form.Item
            name="startDate"
            label={translate('Date de début')}
            rules={[{ required: true, message: 'Veuillez sélectionner la date de début' }]}
            initialValue={current?.startDate ? dayjs(current.startDate) : null}
          >
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={8}>
          <Form.Item
            name="endDate"
            label={translate('Date de fin')}
            rules={[{ required: true, message: 'Veuillez sélectionner la date de fin' }]}
            initialValue={current?.endDate ? dayjs(current.endDate) : null}
          >
            <DatePicker style={{ width: '100%' }} format={dateFormat} />
          </Form.Item>
        </Col>
      </Row>
      
      <Row gutter={[12, 0]}>
        <Col className="gutter-row" span={24}>
          <Form.Item
            name="object"
            label={translate('Objet de la facture')}
            rules={[{ required: true, message: 'Veuillez saisir l\'objet de la facture' }]}
            initialValue={current?.object || ''}
          >
            <Input placeholder="Ex: Sécurisation LOCAUX TLS" />
          </Form.Item>
        </Col>
        <Col className="gutter-row" span={10}>
          <Form.Item label={translate('Note')} name="notes">
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Divider dashed />
    
         <Form.List
      name="services"
      initialValue={services}
      value={services} // Liaison avec l'état `services`
    
    
    >
      {(fields, { add, remove }) => (
        <>
          {fields.map((field) => (
            <Row gutter={[12, 12]} key={field.key}>
              {/* Champ pour le service */}
              <Col className="gutter-row" span={5}>
                <Form.Item
                  name={[field.name, 'service']}
                  label={translate('Service')}
                  rules={[{ required: true }]}
                >
                  <Select
                    value={field.value?.service || ''} // Liaison avec la valeur du service
                    >
                    <Select.Option value="⬇️ Selectionnez service ⬇️">-- Selectionnez un service --</Select.Option>
                    {servicesList.map((service) => (
                      <Select.Option key={service.label} value={service.label}>
                        {service.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
    
              {/* Champ pour le nombre de jours */}
              <Col className="gutter-row" span={4}>
                <Form.Item
                  name={[field.name, 'numberOfDays']}
                  label={translate('Nombre de jours')}
                  rules={[{ required: true, message: 'Nombre de jours requis' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={1}
                    placeholder="Jours"
                  />
                </Form.Item>
              </Col>
    
              {/* Champ pour le tarif journalier */}
              <Col className="gutter-row" span={4}>
                <Form.Item
                  name={[field.name, 'dailyRate']}
                  label={translate('Tarif journalier')}
                  rules={[{ required: true }]}
    
                >
                  <InputNumber
                    min={1}
                    style={{ width: '100%' }}
                    value={field.value?.dailyRate || 0}
                    readOnly // En lecture seule
                  />
                </Form.Item>
              </Col>
    
              {/* Champ pour le total */}
              <Col className="gutter-row" span={4}>
                <Form.Item
                  name={[field.name, 'total']}
                  label={translate('Total')}
                >
                  <MoneyInputFormItem
                    readOnly
                    value={calculateItemTotal(
                      field.value?.numberOfDays,
                      field.value?.dailyRate
                    )}
                  />
                </Form.Item>
              </Col>
    
              {/* Bouton pour supprimer un service */}
              <Col className="gutter-row" span={1}>
                {fields.length > 1 && (
                  <Button
                    icon={<MinusCircleOutlined />}
                    type="danger"
                    onClick={() => remove(field.name)} // Supprimer le service
                  />
                )}
              </Col>
            </Row>
          ))}
    
          {/* Bouton pour ajouter un service */}
          <Form.Item>
            <Button
              type="dashed"
              onClick={() => add()} // Ajouter un nouveau service
              block
              icon={<PlusOutlined />}
            >
              {translate('Ajouter un service')}
            </Button>
          </Form.Item>
        </>
      )}
    </Form.List>
      <Divider dashed />
      <div style={{ position: 'relative', width: ' 100%', float: 'right' }}>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={5}>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} block>
                {translate('Save')}
              </Button>
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={4} offset={10}>
            <p
              style={{
                paddingLeft: '12px',
                paddingTop: '5px',
                margin: 0,
                textAlign: 'right',
              }}
            >
              {translate('Sub Total')} :
            </p>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={subTotal} />
          </Col>
        </Row>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={4} offset={15}>
            <Form.Item
              name="taxRate"
              rules={[
                {
                  required: true,
                  message: "entre"
                },
              ]}
            >
              <SelectAsync
                value={taxRate}
                onChange={handelTaxChange}
                entity={'taxes'}
                outputValue={'taxValue'}
                displayLabels={['taxName']}
                withRedirect={true}
                urlToRedirect="/taxes"
                redirectLabel={translate('Add New Tax')}
                placeholder={translate('Select Tax Value')}
              />
            </Form.Item>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={taxTotal} />
          </Col>
        </Row>
        <Row gutter={[12, -5]}>
          <Col className="gutter-row" span={4} offset={15}>
            <p
              style={{
                paddingLeft: '12px',
                paddingTop: '5px',
                margin: 0,
                textAlign: 'right',
              }}
            >
              {translate('Total')} :
            </p>
          </Col>
          <Col className="gutter-row" span={5}>
            <MoneyInputFormItem readOnly value={total} />
          </Col>
        </Row>
      </div>
      
    </>
    </ConfigProvider>
  );
  
}
function calculateItemTotal(numberOfDays, dailyRate) {
  return numberOfDays > 0 ? numberOfDays * dailyRate : 0;
}
