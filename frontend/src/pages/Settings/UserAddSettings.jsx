import useLanguage from '@/locale/useLanguage';
import UserCreateModule from '@/modules/SettingModule/UserCreateModule';

export default function UserAddSettings() {
  const translate = useLanguage();

  return <UserCreateModule />;
}
