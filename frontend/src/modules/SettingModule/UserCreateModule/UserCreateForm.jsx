import { Form, Input, Select } from 'antd';
import useLanguage from '@/locale/useLanguage';

const { Option } = Select;

export default function UserCreateForm() {
  const translate = useLanguage();

  return (
    <>
      <Form.Item
        label={translate('Nom')}
        name="name"
        rules={[{ required: true, message: translate('Veuillez entrer le nom.') }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label={translate('Prénom')}
        name="surname"
        rules={[{ required: true, message: translate('Veuillez entrer le prénom.') }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label={translate('Email')}
        name="email"
        rules={[
          { required: true, message: translate('Veuillez entrer un email.') },
          { type: 'email', message: translate('Email non valide.') },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label={translate('Rôle')}
        name="role"
        rules={[{ required: true, message: translate('Veuillez sélectionner un rôle.') }]}
      >
        <Select placeholder={translate('Sélectionner un rôle')}>
          <Option value="admin">{translate('Admin')}</Option>
          <Option value="manager">{translate('Manager')}</Option>
          <Option value="employee">{translate('Employee')}</Option>
          <Option value="create_only">{translate('Create Only')}</Option>
          <Option value="read_only">{translate('Read Only')}</Option>
        </Select>
      </Form.Item>

      <Form.Item
        label={translate('Mot de passe')}
        name="password"
        rules={[
          { required: true, message: translate('Veuillez entrer un mot de passe.') },
          { min: 6, message: translate('Le mot de passe doit contenir au moins 6 caractères.') },
        ]}
        hasFeedback
      >
        <Input.Password />
      </Form.Item>

      <Form.Item
        label={translate('Confirmer le mot de passe')}
        name="confirmPassword"
        dependencies={['password']}
        hasFeedback
        rules={[
          { required: true, message: translate('Veuillez confirmer le mot de passe.') },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Les mots de passe ne correspondent pas !'));
            },
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>
    </>
  );
} 