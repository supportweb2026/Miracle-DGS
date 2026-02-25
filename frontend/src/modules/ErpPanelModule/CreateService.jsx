import { useState, useEffect } from 'react';
import { Button, Tag, Form, Divider } from 'antd';
import { PageHeader } from '@ant-design/pro-layout';
import { useSelector, useDispatch } from 'react-redux';
import useLanguage from '@/locale/useLanguage';
import { settingsAction } from '@/redux/settings/actions';
import { erp } from '@/redux/erp/actions';
import { selectCreatedItem } from '@/redux/erp/selectors';
import calculate from '@/utils/calculate';
import { generate as uniqueId } from 'shortid';
import Loading from '@/components/Loading';
import { ArrowLeftOutlined, CloseCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { request } from '@/request';

function SaveForm({ form }) {
    console.log('log0001');
 
  const translate = useLanguage();
  const handelClick = () => {
    console.log('log001');
     

    form.submit();
  };

  return (
    <Button onClick={handelClick} type="primary" icon={<PlusOutlined />}>
      {translate('Save')}
    </Button>
  );
}

export default function CreateService({ config, CreateForm }) {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  console.log('CreateService...')

  useEffect(() => {
    dispatch(settingsAction.list({ entity: 'setting' }));
  }, []);

  let { entity } = config;

  const { isLoading, isSuccess, result } = useSelector(selectCreatedItem);
  const [form] = Form.useForm();
  const [subTotal, setSubTotal] = useState(0);
  const [offerSubTotal, setOfferSubTotal] = useState(0);
  const [servicesList, setServicesList] = useState([]);
  const [services, setServices] = useState([]); // L'état pour les services
  const [service, setService] = useState([]); // L'état pour les services
  const [dailyRate, setdailyRate] = useState([]); // L'état pour les services

//FETCH ALL services
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
      return; 
    }

    let servicesList = allServices.map(service => ({
      label: service.name,   
      value: service.tauxJournalier 
    }));

    console.log("Services sous forme de label-value:", servicesList);
    setServicesList(servicesList);
    console.log("Services sous forme de Map:", servicesList);
    return servicesList;
  } catch (error) {
    console.error("Erreur lors de la récupération des services :", error);
  }
};

useEffect(() => {
  // Appel fetchAllServices 
  const getServices = async () => {
    const result = await fetchAllServices();
    if (result) {
      setServicesList(result); 
    }
  };
  getServices();
}, []); 

//END FETCH ALL
const handelValuesChange = (changedValues, values) => {
  const services = values['services']; // Récupérer les services à partir des valeurs du formulaire
  let subTotal = 0;
  console.log('services CREATE SERVICE:', services);
  console.log('changedValues:', changedValues);
  console.log('values:', values);

  if (services) {
    // Copie des services pour éviter de modifier directement l'objet d'état
    const updatedServices = services.map((service,index) => {
      if (service) {
        console.log('index createservice',index);
        // Calcul du total pour chaque service basé sur la durée et le tarif journalier
       // if (service.dailyRate || service.startDate || service.endDate) {
          console.log('service createservice name', service.service);
          const serviceValue = Object.values(servicesList.reduce((acc, { label, value }) => ({ ...acc, [label]: value }), {}))[servicesList.findIndex(serviceItem => serviceItem.label === service.service)];
          console.log('before createservice');
          const duration = dayjs(service.endDate || '1970-01-01').diff(dayjs(service.startDate || '1970-01-01'), 'day');
          const totalService = duration > 0 ? service.dailyRate * duration : 0;

          // Mise à jour de `dailyRate` avec la valeur correspondante de `servicesList`
         // setdailyRate(dailyRate);
          service.dailyRate = serviceValue;
          service.total=totalService;
          const updatedService = {
            ...service,  // Garder toutes les autres propriétés
            dailyRate: serviceValue,  // Mettre à jour le tarif journalier avec `serviceValue`
            total: totalService,  // Mettre à jour le total calculé
          };
          
          return {
            ...service,  // Garder toutes les autres propriétés
            total: totalService,  // Ajouter le total calculé pour ce service
          };
       // }
      }
      return service; // Retourner le service tel quel si aucune condition n'est remplie
    });

    // Calcul du sous-total de tous les services
    updatedServices.forEach((service) => {
      if (service && service.total) {
        subTotal += service.total; // Ajouter chaque total au sous-total
        console.log('subtotal',subTotal);
      }
    });

    // Mise à jour de l'état `subTotal` avec la somme des totaux des services
    setSubTotal(subTotal);
  }
};


  useEffect(() => {
    if (isSuccess) {
      form.resetFields();
      dispatch(erp.resetAction({ actionType: 'create' }));
      setSubTotal(0);
      setOfferSubTotal(0);
      setdailyRate(0);
      navigate(`/${entity.toLowerCase()}/read/${result._id}`);
    }
  }, [isSuccess]);

  const onSubmit = (fieldsValue) => {
    console.log('🚀 ~ onSubmit ~ fieldsValue:', fieldsValue);
    if (fieldsValue) {
      if (fieldsValue.services) {
        let newList = [...fieldsValue.services];
        newList.map((service) => {
          // Recalcul du total pour chaque service en fonction du dailyRate et des dates
          if (service.dailyRate && service.startDate && service.endDate) {
            const duration = dayjs(service.endDate).diff(dayjs(service.startDate), 'day');
            service.total = duration > 0 ? service.dailyRate * duration : 0; 
          }
        });
        fieldsValue = {
          ...fieldsValue,
          services: newList,
        };
      }
    }
    dispatch(erp.create({ entity, jsonData: fieldsValue }));
  };

  return (
    <>
      <PageHeader
        onBack={() => {
          navigate(`/${entity.toLowerCase()}`);
        }}
        backIcon={<ArrowLeftOutlined />}
        title={translate('New')}
        ghost={false}
        tags={<Tag>{translate('Draft')}</Tag>}
        extra={[
          <Button
            key={`${uniqueId()}`}
            onClick={() => navigate(`/${entity.toLowerCase()}`)}
            icon={<CloseCircleOutlined />}
          >
            {translate('Cancel')}
          </Button>,
          <SaveForm form={form} key={`${uniqueId()}`} />,
        ]}
        style={{
          padding: '20px 0px',
        }}
      ></PageHeader>
      <Divider dashed />
      <Loading isLoading={isLoading}>
        <Form form={form} layout="vertical" onFinish={onSubmit} onValuesChange={handelValuesChange}>
          <CreateForm subTotal={subTotal} offerTotal={offerSubTotal} />
        </Form>
      </Loading>
    </>
  );
}
