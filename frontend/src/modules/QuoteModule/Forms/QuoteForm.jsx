import { useState, useEffect, useRef } from 'react';
import { Form, Input, InputNumber, Button, Select, Divider, Row, Col } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { DatePicker } from 'antd';
import MoneyInputFormItem from '@/components/MoneyInputFormItem';
import { selectFinanceSettings } from '@/redux/settings/selectors';
import { useDate } from '@/settings';
import useLanguage from '@/locale/useLanguage';
import calculate from '@/utils/calculate';
import { useSelector } from 'react-redux';
import SelectAsync from '@/components/SelectAsync';
import { ConfigProvider } from 'antd'; 
import locale from 'antd/locale/fr_FR';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { request } from '@/request';
import { createPath } from 'react-router-dom';


//dayjs.locale('fr');

export default function QuoteForm({ subTotal = 0, current = null,
  services = [] }

 ) {
//dayjs.extend(isValid);
const validDate = dayjs('2025-04-01');
console.log('Valid date:', validDate.isValid()); 
  const { last_quote_number } = useSelector(selectFinanceSettings);

  if (last_quote_number === undefined) {
    return <></>;
  }

  return <LoadQuoteForm subTotal={subTotal} current={current} services={services} />;
}

function LoadQuoteForm({ subTotal = 0, current = null, 
  services = [] }
   ) {
  const [form] = Form.useForm();

  
  
const [servicesList, setServicesList] = useState([]);

const translate = useLanguage();
  const { dateFormat } = useDate();
  const { last_quote_number } = useSelector(selectFinanceSettings);
  const [lastNumber, setLastNumber] = useState(() => last_quote_number + 1);

  const [total, setTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxTotal, setTaxTotal] = useState(0);
  const [allTotal, setAllTotal] = useState(0);
  const [dailyRate, setdailyRate] = useState(0);
  const [serviceSelected, setserviceSelected] = useState(0);
  const [serviceName, setserviceName] = useState(0);
  
  // État local pour les services
  const [localServices, setLocalServices] = useState(services.length > 0 ? services : [{ service: '', numberOfDays: 1, dailyRate: 0, total: 0 }]);
  
  // Fonction pour gérer le changement du nombre de jours
  const handleNumberOfDaysChange = (value, fieldName) => {
    const updatedServices = localServices.map((service, i) => {
      if (i === fieldName) {
        const numberOfDays = value || 0;
        const dailyRate = service.dailyRate || 0;
        const total = numberOfDays * dailyRate;
        return { ...service, numberOfDays, total };
      }
      return service;
    });
    setLocalServices(updatedServices);
  };
  
  // Fonction pour gérer le changement de service
  const handleServiceChange = (value, fieldName) => {
    const selectedService = servicesList.find(service => service.label === value);
    if (selectedService) {
      const updatedServices = localServices.map((service, i) => {
        if (i === fieldName) {
          const dailyRate = selectedService.value || 0;
          const numberOfDays = service.numberOfDays || 1;
          const total = numberOfDays * dailyRate;
          return { ...service, service: value, dailyRate, total };
        }
        return service;
      });
      setLocalServices(updatedServices);
    }
  };
  
   const addService = () => {
    setLocalServices([...localServices, { service: '', numberOfDays: 1, dailyRate: 0, total: 0 }]);
  };

  // Fonction pour supprimer un service
  const removeService = (index) => {
    const updatedServices = localServices.filter((_, i) => i !== index);
    setLocalServices(updatedServices);
  };

  // Fonction pour mettre à jour un service spécifique
  const updateService = (index, field, value) => {
    const updatedServices = localServices.map((service, i) =>
      i === index ? { ...service, [field]: value } : service
    );
    setLocalServices(updatedServices);
  };


  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
    
  
    useEffect(() => {
      if (current) {
        const { taxRate = 0, year, number } = current;
        setTaxRate(taxRate / 100);
        setCurrentYear(year);
        setLastNumber(number);
      }
    }, [current]);
    useEffect(() => {
      const currentTotal = calculate.add(calculate.multiply(allTotal, taxRate), allTotal);
      setTaxTotal(Number.parseFloat(calculate.multiply(allTotal, taxRate)));
      setTotal(Number.parseFloat(currentTotal));
      
      //setTotal(1989);
    }, [allTotal, taxRate]);
 

  //Fonction pour récupérer la liste des services
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
  }, []); // Le tableau vide [] signifie que ce useEffect s'exécute seulement au montage du composant

  // Calculer le total global quand les services changent
  useEffect(() => {
    const newTotal = localServices.reduce((total, service) => {
      const numberOfDays = service.numberOfDays || 0;
      const dailyRate = service.dailyRate || 0;
      return total + (numberOfDays * dailyRate);
    }, 0);
    setAllTotal(newTotal);
  }, [localServices]);

  console.log('map useffect:', servicesList);
  const handelTaxChange = (value) => {
    setTaxRate(value / 100);
  };
 //fonction handlesubmit


 //fin fonciton
 /* 
  const handleDateChange = (value, dateString, field) => {
    console.log('fonction handleDateChange');
    //const services = form.getFieldValue('services');
    const service = services[field.name];  // Le service actuel modifié
  
    // Mettre à jour la date de début ou de fin en fonction du champ modifié (startDate ou endDate)
    const updatedService = {
      ...service,
      [field.name]: value,  // Met à jour la date correspondant à startDate ou endDate
    };
  
    // Recalculer le total si les deux dates (startDate et endDate) sont présentes
    let totaldevis = 0;
    if (updatedService.startDate && updatedService.endDate) {
      console.log('updatedservice');
const duration = (dayjs(updatedService.endDate).isValid() && dayjs(updatedService.startDate).isValid()) 
  ? dayjs(updatedService.endDate).diff(dayjs(updatedService.startDate), 'day') 
  : 0;      totaldevis = duration > 0 ? updatedService.dailyRate * duration : 0;  // Calcul du total
      console.log('total:',totaldevis);
    }
  //
    console.log('calcul du total');
    let newTotal = 0;
  
    // Calculer le total global en ajoutant les totaux de chaque service
    services.forEach(service => {
      if (service.startDate && service.endDate) {
        const duration = dayjs(service.endDate).diff(dayjs(service.startDate), 'day');
        const totalService = duration > 0 ? service.dailyRate * duration : 0;  // Calcul du total du service
        console.log('service.dailyRate:',service.dailyRate);
  
        newTotal += totalService;  // Ajouter ce total au total global
      }
    });
  console.log('total new:',newTotal);
  setAllTotal(newTotal);
  //
    // Mettre à jour les champs dans le formulaire, y compris le total
   
  };*/
  
  
/*

  const handleServiceChange = (value, fieldIndex) => {
    const serviceLabel = value; // La nouvelle valeur du service sélectionné
    console.log('serviceLabel:', serviceLabel, " fieldIndex:",fieldIndex);
    const serviceValue = Object.values(servicesList.reduce((acc, { label, value }) => ({ ...acc, [label]: value }), {}))[servicesList.findIndex(service => service.label === serviceLabel)];
    console.log('serviceValue=',serviceValue);
    // Récupérer le service actuel que l'on souhaite modifier
    const service = services[fieldIndex.name];
    console.log('service=',service);
    // Calculer le total en fonction des dates et du taux journalier
    //const startDate = service.startDate;
    //const endDate = service.endDate;
    
    let totalDevis = 0;
    if (startDate && endDate) {
      const duration = dayjs(endDate).diff(dayjs(startDate), 'day');
      totalDevis = duration > 0 ? serviceLabel * duration : 0;  // Calcul du total
    }

    // Mettre à jour l'état des services
    const updatedServices = [...services];
    console.log('updatedServices avant mise à jour:',updatedServices);
    updatedServices[fieldIndex.name] = {
      ...updatedServices[fieldIndex.name], // Conserver les autres valeurs du service
      service: serviceLabel,           // Mettre à jour le service sélectionné
      dailyRate: serviceValue,         // Mettre à jour le taux journalier
      total: totalDevis,               // Mettre à jour le total calculé
    };
    console.log('updatedServices après msie à  jour:',updatedServices);
    // Mise à jour de l'état `services`
    setServices(updatedServices);
  };
  
  
  useEffect(() => {
    console.log('Services mis à jour:', services);
  }, [services]);
  
  */
//console.log('sortie du handleservicechange:',services);


  useEffect(() => {
    if (current) {
      const { taxRate = 0, year, number } = current;
      setTaxRate(taxRate / 100);
      setCurrentYear(year);
      setLastNumber(number);
    }
  }, [current]);

  
  
 

 

  return (
    <ConfigProvider locale={locale}>
      <>
        <Row gutter={[12, 0]}>
          {/* Prospect */}
          <Col className="gutter-row" span={8}>
            <Form.Item
              name="prospect"
              label={translate('Prospect')}
              rules={[{ required: true, message: 'Veuillez saisir le nom du prospect' }]}
            >
              <Input placeholder="Nom du prospect" />
            </Form.Item>
          </Col>

          {/* Adresse Prospect */}
          <Col className="gutter-row" span={8}>
            <Form.Item
              name="prospectAddress"
              label="Adresse Prospect"
              rules={[{ required: false }]}
            >
              <Input placeholder="Adresse du prospect" />
            </Form.Item>
          </Col>

          {/* Téléphone Prospect */}
          <Col className="gutter-row" span={8}>
            <Form.Item
              name="prospectPhone"
              label="Téléphone Prospect"
              rules={[{ required: false }]}
            >
              <Input placeholder="Téléphone du prospect" />
            </Form.Item>
          </Col>

          {/* Numéro */}
          <Col className="gutter-row" span={5}>
            <Form.Item
              label={translate('number')}
              name="number"
              initialValue={lastNumber}
              rules={[{ required: true }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          {/* Année */}
          <Col className="gutter-row" span={5}>
            <Form.Item
              label={translate('year')}
              name="year"
              initialValue={currentYear}
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>

          {/* Statut */}
          <Col className="gutter-row" span={6}>
            <Form.Item
              label={translate('status')}
              name="status"
              initialValue={'draft'}
            >
              <Select
                options={[
                  { value: 'draft', label: translate('Draft') },
                  { value: 'pending', label: translate('Pending') },
                  { value: 'sent', label: translate('Sent') },
                  { value: 'accepted', label: translate('Accepted') },
                  { value: 'declined', label: translate('Declined') },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[12, 0]}>
          {/* Date */}
          <Col className="gutter-row" span={8}>
            <Form.Item
              name="date"
              label={translate('Date')}
              initialValue={dayjs()}
              rules={[{ required: true, type: 'object' }]}
            >
              <DatePicker style={{ width: '100%' }} format={dateFormat} />
            </Form.Item>
          </Col>

          {/* Date d'expiration */}
          <Col className="gutter-row" span={8}>
            <Form.Item
              name="expiredDate"
              label={translate('Expire Date')}
              initialValue={dayjs().add(30, 'days')}
              rules={[{ required: true, type: 'object' }]}
            >
              <DatePicker style={{ width: '100%' }} format={dateFormat} />
            </Form.Item>
          </Col>

          {/* Note */}
          <Col className="gutter-row" span={8}>
            <Form.Item label={translate('Note')} name="notes">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Divider dashed />

        {/* Services */}
        <Form.List
          name="services"
          initialValue={localServices}
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
                        onChange={(value) => handleServiceChange(value, field.name)}
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
                        onChange={(value) => handleNumberOfDaysChange(value, field.name)}
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
              <Form.Item>
                <Button type="dashed" onClick={() => add({ service: '', numberOfDays: 1, dailyRate: 0, total: 0 })} block icon={<PlusOutlined />}>
                  {translate('Add Service')}
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Divider dashed />

        {/* Totaux et Taxes */}
        <div style={{ position: 'relative', width: '100%', float: 'right', marginTop: '20px' }}>
          <Row gutter={[12, -5]}>
            <Col className="gutter-row" span={4} offset={15}>
              <p style={{ paddingLeft: '12px', paddingTop: '5px', margin: 0, textAlign: 'right', fontWeight: 'bold' }}>
                {translate('Sub Total')} :
              </p>
            </Col>
            <Col className="gutter-row" span={5}>
              <MoneyInputFormItem readOnly value={allTotal} />
            </Col>
          </Row>

          <Row gutter={[12, -5]} style={{ marginTop: '10px' }}>
            <Col className="gutter-row" span={4} offset={15}>
              <Form.Item
                name="taxRate"
                rules={[{ required: true, message: "Sélectionnez une taxe" }]}
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

          <Row gutter={[12, -5]} style={{ marginTop: '10px' }}>
            <Col className="gutter-row" span={4} offset={15}>
              <p style={{ paddingLeft: '12px', paddingTop: '5px', margin: 0, textAlign: 'right', fontWeight: 'bold' }}>
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
