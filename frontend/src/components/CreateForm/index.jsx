import { useState, useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { crud } from '@/redux/crud/actions';
import { useCrudContext } from '@/context/crud';
import { selectCreatedItem } from '@/redux/crud/selectors';

import useLanguage from '@/locale/useLanguage';

import { Button, Form, message } from 'antd';
import Loading from '@/components/Loading';
import { request } from '@/request';


export default function CreateForm({ config, formElements, withUpload = false }) {
  console.log('fonction createForm...',formElements);
  let { entity } = config;
  const dispatch = useDispatch();
  const { isLoading, isSuccess } = useSelector(selectCreatedItem);
  const { crudContextAction } = useCrudContext();
  const { panel, collapsedBox, readBox } = crudContextAction;
  const [form] = Form.useForm();
  const translate = useLanguage();
  const [servicesList, setServicesList] = useState([]);
  const [dailyRate, setDailyRate] = useState(15);
  

  
  const onSubmit = async (fieldsValue) => {
    console.log('Initial fieldsValue=', fieldsValue);

    if (entity === 'contract' && fieldsValue.services && fieldsValue.services.length > 0) {
      try {
        let hasError = false;
        let services = [];

        for (let service of fieldsValue.services) {
          console.log('🔍 CreateForm - Processing service:', service);
          console.log('🔍 CreateForm - Structure du service:', JSON.stringify(service, null, 2));
          
          try {
            // APPROCHE OPTIMISÉE : Récupérer seulement les tarifs pour ce site spécifique
            console.log('🔍 CreateForm - Appel API pour récupérer les tarifs du site:', service.selectedSite);
            const response = await request.list({ 
              entity: 'siteTariff',
              filter: 'site',
              equal: service.selectedSite
            });
            console.log('🔍 CreateForm - Réponse API filtrée:', response);
            console.log('🔍 CreateForm - Type de réponse:', typeof response);
            console.log('🔍 CreateForm - Status:', response?.success);
            console.log('🔍 CreateForm - Résultats:', response?.result);
            console.log('🔍 CreateForm - Nombre de résultats:', response?.result?.length);

            if (response && response.success && response.result && Array.isArray(response.result)) {
              console.log('🔍 CreateForm - API réussie, tarifs déjà filtrés par site...');
              
              // Les tarifs sont déjà filtrés par l'API
              const siteTariffs = response.result;
              
              console.log('🔍 CreateForm - Tarifs trouvés pour ce site:', siteTariffs);
              console.log('🔍 CreateForm - Nombre de tarifs pour ce site:', siteTariffs.length);
              
              if (siteTariffs.length > 0) {
                // Traiter TOUTES les prestations du service (pas seulement la première)
                for (let prestation of service.prestations) {
                  // Trouver le tarif correspondant à cette prestation ET à ce site
                  const tariffData = siteTariffs.find(tariff => 
                    tariff.prestation && tariff.prestation._id === prestation.prestation &&
                    tariff.site && tariff.site._id === service.selectedSite
                  );
                  
                  console.log('🔍 CreateForm - Tarif trouvé pour la prestation:', prestation.prestation, 'et le site:', service.site);
                  console.log('🔍 CreateForm - Tarif trouvé:', tariffData);

                  if (tariffData) {
                    console.log('🔍 CreateForm - Construction du service...');
                    
                    const newService = {
                      siteTariffId: tariffData._id,
                      numberOfAgents: Number(prestation.numberOfAgents),
                      ...(tariffData.useCustomValues ? {
                        dailyRate: Number(tariffData.customDailyRate),
                        hourlyRate: Number(tariffData.customHourlyRate),
                        duration: Number(tariffData.customDuration)
                      } : {
                        dailyRate: Number(tariffData.prestation.baseDailyRate),
                        hourlyRate: Number(tariffData.prestation.baseHourlyRate),
                        duration: Number(tariffData.prestation.baseDuration)
                      })
                    };
                    
                    services.push(newService);
                    console.log('🔍 CreateForm - Service ajouté:', newService);
                  } else {
                    hasError = true;
                    console.error('🔍 CreateForm - ERREUR: Aucun tarif trouvé pour cette prestation et ce site');
                    console.error('🔍 CreateForm - Prestation recherchée:', prestation.prestation);
                    console.error('🔍 CreateForm - Site recherché:', service.selectedSite);
                    message.error(`Création impossible : Aucun Tarif Défini pour la prestation sélectionnée dans ce site`);
                    return;
                  }
                }
              } else {
                hasError = true;
                console.error('🔍 CreateForm - ERREUR: Aucun tarif trouvé pour ce site');
                message.error(`Création impossible : Aucun Tarif Défini pour ce site`);
                return;
              }
            } else {
              hasError = true;
              console.error('🔍 CreateForm - ERREUR: Réponse API invalide');
              console.error('🔍 CreateForm - Réponse reçue:', response);
              message.error(`Création impossible : Erreur de l'API`);
              return;
            }
          } catch (error) {
            hasError = true;
            console.error('🔍 CreateForm - ERREUR lors de l\'appel API:', error);
            console.error('🔍 CreateForm - Stack trace:', error.stack);
            message.error(`Création impossible : Erreur de connexion`);
            return;
          }
        }

        if (!hasError) {
          const finalData = {
            ...fieldsValue,
            services: services
          };

          if (finalData.file && withUpload) {
            finalData.file = finalData.file[0].originFileObj;
          }

          console.log('Final data to submit:', finalData);
          console.log('CreateForm - AVANT LOGS JSON - finalData:', finalData);
          console.log('CreateForm - Status envoye:', finalData.status);
          console.log('CreateForm - Services envoyes:', finalData.services);
          console.log('CreateForm - Donnees completes JSON:', JSON.stringify(finalData, null, 2));
          console.log('CreateForm - JSON ENVOYE AU BACKEND:', JSON.stringify(finalData));
          dispatch(crud.create({ entity, jsonData: finalData, withUpload }));
        }
      } catch (error) {
        console.error('Error fetching tariff data:', error);
        message.error('Une erreur est survenue lors de la récupération des tarifs. Veuillez réessayer ou contacter l\'administrateur si le problème persiste.');
      }
    } else {
      if (fieldsValue.file && withUpload) {
        fieldsValue.file = fieldsValue.file[0].originFileObj;
      }
      dispatch(crud.create({ entity, jsonData: fieldsValue, withUpload }));
    }
  };

  const fetchAllServices = async () => {
    console.log('fetchallservice tizi macadam createform');
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
    const getServices = async () => {
      const result = await fetchAllServices();
      if (result) {
        setServicesList(result);
        console.log(result);
      }
    };
    getServices();
  }, []);

  useEffect(() => {
    console.log('use effect entity:',entity);
    if (entity === 'contract') {
      console.log('nous somme dans le if contract dailyrate:',dailyRate);
      form.setFieldsValue({ dailyRate: dailyRate });
      
    }
  }, [dailyRate, entity, form]);

  // Exemple de fonction qui met à jour dailyRate (à utiliser dans ton Select par exemple)
  const handelValuesChange = (selectedValue) => {
    console.log('appel dans createform',entity,' services:',servicesList, 'selectedValue:',selectedValue);
    const label = typeof selectedValue === 'object' && selectedValue !== null
    ? selectedValue.serviceType 
    : selectedValue;
    const selectedService = servicesList.find(service => service.label === selectedValue.serviceType);
    //const selectedService = Object.values(servicesList.reduce((acc, { label, value }) => ({ ...acc, [label]: value }), {}))[servicesList.findIndex(serviceItem => serviceItem.label === service.service)];

    console.log('selectedService: createform', selectedService);
    console.log('createform select entity:', entity, 'srv:', selectedService);
    if (selectedService && entity === 'contract') {
      setDailyRate(selectedService.value);
      console.log('value dailyrate: createform', selectedService.value);
      form.setFieldsValue({ dailyRate });
    }
  };
  useEffect(() => {
    if (isSuccess) {
      readBox.open();
      collapsedBox.open();
      panel.open();
      form.resetFields();
      dispatch(crud.resetAction({ actionType: 'create' }));
      dispatch(crud.list({ entity }));
    }
  }, [isSuccess]);

  const handleServiceChange = async (id) => {
    try {
      const tariffData = await request.read({ entity: 'siteTariff', id });
      if (tariffData) {
        const serviceData = {
          siteTariffId: id,
          numberOfAgents: 1,
          ...(tariffData.result.useCustomValues ? {
            dailyRate: Number(tariffData.result.customDailyRate),
            hourlyRate: Number(tariffData.result.customHourlyRate),
            duration: Number(tariffData.result.customDuration)
          } : {
            dailyRate: Number(tariffData.result.prestation.dailyRate),
            hourlyRate: Number(tariffData.result.prestation.hourlyRate),
            duration: Number(tariffData.result.prestation.duration)
          })
        };
        return serviceData;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du tarif:', error);
    }
  };

  return (
    <Loading isLoading={isLoading}>
      <Form form={form} layout="vertical" onFinish={onSubmit} onValuesChange ={handelValuesChange} >
        {formElements}
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {translate('Submit')}
          </Button>
        </Form.Item>
      </Form>
    </Loading>
  );
}
