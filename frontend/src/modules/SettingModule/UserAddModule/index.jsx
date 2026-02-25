import SetingsSection from '../components/SetingsSection';
import UpdateSettingModule from '../components/UpdateSettingModule';
import NewUserForm from './UserAddForm';
import useLanguage from '@/locale/useLanguage';

export default function NewUserModule({ config }) {
  const translate = useLanguage();

  return (
    <UpdateSettingModule config={config}>
      <SetingsSection
        title={translate("Ajouter un utilisateur")}
       // description={translate("......")}
      >
        <NewUserForm />
      </SetingsSection>
    </UpdateSettingModule>
  );
}
