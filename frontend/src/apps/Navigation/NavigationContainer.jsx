import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Drawer, Layout, Menu } from 'antd';
import axios from 'axios';

import { useAppContext } from '@/context/appContext';
import useLanguage from '@/locale/useLanguage';
import logoIcon from '@/style/images/dgs.jpg';
import logoText from '@/style/images/logo_miracle_text.jpg';
import useResponsive from '@/hooks/useResponsive';
import { useSelector } from 'react-redux';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import {
  SettingOutlined,
  CustomerServiceOutlined,
  ContainerOutlined,
  FileSyncOutlined,
  DashboardOutlined,
  TagOutlined,
  TagsOutlined,
  UserOutlined,
  CreditCardOutlined,
  MenuOutlined,
  FileOutlined,
  ShopOutlined,
  FilterOutlined,
  WalletOutlined,
  ReconciliationOutlined,
  DollarCircleOutlined,
  AppstoreAddOutlined,
  AppstoreOutlined,
  PayCircleOutlined,
  FileSearchOutlined,
  EnvironmentOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  BuildOutlined,
  SecurityScanOutlined,
  HomeOutlined,
  TeamOutlined,
  ToolOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

export default function Navigation() {
  const { isMobile } = useResponsive();

  return isMobile ? <MobileSidebar /> : <Sidebar collapsible={false} />;
}

function Sidebar({ collapsible, isMobile = false }) {
  let location = useLocation();
  const currentAdmin = useSelector(selectCurrentAdmin);

  const { state: stateApp, appContextAction } = useAppContext();
  const { isNavMenuClose } = stateApp;
  const { navMenu } = appContextAction;
  const [showLogoApp, setLogoApp] = useState(isNavMenuClose);
  const [currentPath, setCurrentPath] = useState(location.pathname.slice(1));

  const translate = useLanguage();
  const navigate = useNavigate();

  // Fonction pour filtrer les menus selon l'utilisateur
  const getFilteredItems = () => {
    const allItems = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: <Link to={'/'}>{translate('dashboard')}</Link>,
      },
      {
        key: 'customer',
        icon: <CustomerServiceOutlined />,
        label: <Link to={'/customer'}>{translate('customers')}</Link>,
      },
      {
        key: 'Contracts',
        label: <Link to={'/contracts'}>{'Contrats'}</Link>,
        icon: <FileSearchOutlined />,
      },
      {
        key: 'invoice',
        icon: <ContainerOutlined />,
        label: <Link to={'/invoice'}>{translate('invoices')}</Link>,
      },
      {
        key: 'quote',
        icon: <FileSyncOutlined />,
        label: <Link to={'/quote'}>{translate('quote')}</Link>,
      },
      {
        key: 'site-tariff',
        icon: <DollarCircleOutlined />,
        label: <Link to={'/site-tariff'}>{translate('Tarifs par site')}</Link>,
      },
      {
        key: 'Prestation',
        icon: <AppstoreOutlined />,
        label: <Link to={'/prestation'}>{translate('Prestations')}</Link>,
      },
      {
        key: 'Site',
        label: <Link to={'/site'}>{'Sites'}</Link>,
        icon: <HomeOutlined />,
      },
      {
        key: 'payment',
        icon: <CreditCardOutlined />,
        label: <Link to={'/payment'}>{translate('payments')}</Link>,
      },
      {
        key: 'paymentMode',
        label: <Link to={'/payment/mode'}>{translate('payments_mode')}</Link>,
        icon: <WalletOutlined />,
      },
      {
        key: 'taxes',
        label: <Link to={'/taxes'}>{translate('taxes')}</Link>,
        icon: <ShopOutlined />,
      },
      {
        key: 'expense',
        label: <Link to={'/expense'}>{translate('Dépenses')}</Link>,
        icon: <DollarCircleOutlined />,
      },
      {
        key: 'ExpenseCategory',
        label: <Link to={'/expenseCategory'}>{'Catégorie de dépenses'}</Link>,
        icon: <AppstoreAddOutlined />,
      },
      {
        key: 'Report',
        label: <Link to={'/report'}>{'Rapport'}</Link>,
        icon: <BarChartOutlined />,
      },
      {
        key: 'hr',
        label: 'Espace RH',
        icon: <TeamOutlined />,
        onClick: () => {
          handleRedirect('https://gestionrh.up.railway.app/espace_rh_dashboard.php?api_token=MON_TOKEN_SUPER_SECRET');
        },
      },
      {
        key: 'rp',
        label: 'Espace RP',
        icon: <UserOutlined />,
        onClick: () => {
          handleRedirect('https://gestionrh.up.railway.app/espace_rp_dashboard.php?api_token=MON_TOKEN_SUPER_SECRET');
        },
      },
      {
        key: 'equipements',
        label: 'Gestion des équipements',
        icon: <ToolOutlined />,
        onClick: () => {
          handleRedirect('https://gestionrh.up.railway.app/espace_eq_dashboard.php?api_token=MON_TOKEN_SUPER_SECRET');
        },
      },
      {
        key: 'generalSettings',
        label: <Link to={'/settings'}>{translate('settings')}</Link>,
        icon: <SettingOutlined />,
      },
    ];

    // Si c'est l'utilisateur test@gmail.com, filtrer les menus (sans Dashboard)
    if (currentAdmin?.email === 'test@gmail.com') {
      return allItems.filter(item => {
        const allowedKeys = ['quote', 'expense', 'ExpenseCategory', 'Report', 'rp'];
        return allowedKeys.includes(item.key);
      });
    }

    // Si c'est l'utilisateur johana.legala@crmiracle.net, filtrer les menus
    if (currentAdmin?.email === 'johana.legala@crmiracle.net') {
      return allItems.filter(item => {
        const allowedKeys = ['quote', 'expense', 'ExpenseCategory', 'Report', 'rp'];
        return allowedKeys.includes(item.key);
      });
    }

    // Pour tous les autres utilisateurs, retourner tous les menus
    return allItems;
  };

  const items = getFilteredItems();

  useEffect(() => {
    if (location)
      if (currentPath !== location.pathname) {
        if (location.pathname === '/') {
          setCurrentPath('dashboard');
        } else setCurrentPath(location.pathname.slice(1));
      }
  }, [location, currentPath]);

  useEffect(() => {
    if (isNavMenuClose) {
      setLogoApp(isNavMenuClose);
    }

    const timer = setTimeout(() => {
      if (!isNavMenuClose) {
        setLogoApp(isNavMenuClose);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isNavMenuClose]);

  const onCollapse = () => {
    navMenu.collapse();
  };

  return (
    <Sider
      collapsible={collapsible}
      collapsed={collapsible ? isNavMenuClose : collapsible}
      onCollapse={onCollapse}
      className="navigation"
      width={256}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: isMobile ? 'absolute' : 'relative',
        bottom: '20px',
        ...(!isMobile && {
          ['left']: '20px',
          top: '20px',
        }),
      }}
      theme={'light'}
    >
      <div
        className="logo"
        onClick={() => navigate('/')}
        style={{
          cursor: 'pointer',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '48px',
          width: '100%',
          borderRadius: '8px',
          boxSizing: 'border-box',
          margin: '5px 0',
          padding: '0 4px'
        }}
      >
        <img
          src={logoIcon}
          alt="Logo"
          style={{
            height: '38px',
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
            marginRight: '6px',
            bottom: '-1200px'
          }}
        />
        {!showLogoApp && (
          <img
            src={logoText}
            alt="Logo texte"
            style={{
              height: '120px',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
              background: '#fff',
              borderRadius: '4px',
               marginLeft: '-100px'
            }}
          />
        )}
      </div>

      <Menu
        items={items}
        mode="inline"
        theme={'light'}
        selectedKeys={[currentPath]}
        style={{
          width: 256,
        }}
      />
    </Sider>
  );
}

function MobileSidebar() {
  const [visible, setVisible] = useState(false);
  const showDrawer = () => {
    setVisible(true);
  };
  const onClose = () => {
    setVisible(false);
  };

  return (
    <>
      <Button
        type="text"
        size="large"
        onClick={showDrawer}
        className="mobile-sidebar-btn"
        style={{ ['marginLeft']: 25 }}
      >
        <MenuOutlined style={{ fontSize: 18 }} />
      </Button>
      <Drawer
        width={250}
        placement={'left'}
        closable={false}
        onClose={onClose}
        open={visible}
      >
        <Sidebar collapsible={false} isMobile={true} />
      </Drawer>
    </>
  );
}

const handleRedirect = (url) => {
  window.open(url, '_blank');
};