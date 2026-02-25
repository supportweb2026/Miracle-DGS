import { Form, Button, message } from 'antd';
import { useDispatch } from 'react-redux';
import { settingsAction } from '@/redux/settings/actions';
import NewUserForm from './UserCreateForm';
import useLanguage from '@/locale/useLanguage';

export default function UserCreateModule() {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const onSubmit = async (fieldsValue) => {
    console.log('🚀 ~ onSubmit ~ fieldsValue:', fieldsValue);
    
    try {
      // Convertir les données du formulaire au format attendu par updateManySetting
      const settings = [
        { settingKey: 'firstName', settingValue: fieldsValue.name },
        { settingKey: 'lastName', settingValue: fieldsValue.surname },
        { settingKey: 'email', settingValue: fieldsValue.email },
        { settingKey: 'password', settingValue: fieldsValue.password },
        { settingKey: 'confirmPassword', settingValue: fieldsValue.confirmPassword },
        { settingKey: 'role', settingValue: fieldsValue.role }
      ];

      // Utiliser la route setting/updateManySetting qui gère la création d'utilisateur
      const result = await dispatch(settingsAction.updateMany({ 
        entity: 'setting', 
        jsonData: { settings } 
      }));
      
      if (result.success) {
        message.success('Utilisateur créé avec succès');
        form.resetFields();
      } else {
        message.error(result.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      message.error('Erreur lors de la création de l\'utilisateur');
    }
  };

  return (
    <div>
      <h2>{translate("Ajouter un utilisateur")}</h2>
      <Form
        form={form}
        onFinish={onSubmit}
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        layout="vertical"
      >
        <NewUserForm />
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {translate('Créer l\'utilisateur')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
} 