import { lazy } from 'react';

import { Navigate } from 'react-router-dom';

const Logout = lazy(() => import('@/pages/Logout.jsx'));
const Notifications = lazy(() => import('@/pages/notifications.jsx'));

const NotFound = lazy(() => import('@/pages/NotFound.jsx'));

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Customer = lazy(() => import('@/pages/Customer'));
const Invoice = lazy(() => import('@/pages/Invoice'));
const InvoiceCreate = lazy(() => import('@/pages/Invoice/InvoiceCreate'));

const InvoiceRead = lazy(() => import('@/pages/Invoice/InvoiceRead'));
const InvoiceUpdate = lazy(() => import('@/pages/Invoice/InvoiceUpdate'));
const InvoiceRecordPayment = lazy(() => import('@/pages/Invoice/InvoiceRecordPayment'));
const Quote = lazy(() => import('@/pages/Quote/index'));
const QuoteCreate = lazy(() => import('@/pages/Quote/QuoteCreate'));
const QuoteRead = lazy(() => import('@/pages/Quote/QuoteRead'));
const QuoteUpdate = lazy(() => import('@/pages/Quote/QuoteUpdate'));
const Payment = lazy(() => import('@/pages/Payment/index'));
const PaymentRead = lazy(() => import('@/pages/Payment/PaymentRead'));
const PaymentUpdate = lazy(() => import('@/pages/Payment/PaymentUpdate'));

const Settings = lazy(() => import('@/pages/Settings/Settings'));
const PaymentMode = lazy(() => import('@/pages/PaymentMode'));
const Taxes = lazy(() => import('@/pages/Taxes'));
const ExpenseCategory = lazy(() => import('@/pages/ExpenseCategory'));
const Expense = lazy(() => import('@/pages/Expense'));
const Contract = lazy(() => import('@/pages/Contract'));
const ContractCreate = lazy(() => import('@/pages/Contract/ContractCreate'));
const ContractRead = lazy(() => import('@/pages/Contract/ContractRead'));
const ContractUpdate = lazy(() => import('@/pages/Contract/ContractUpdate'));
const Report = lazy(() => import('@/pages/Report'));
const Prestation = lazy(() => import('@/pages/Prestation'));
const Site = lazy(() => import('@/pages/Site'));
const SiteTariff = lazy(() => import('@/pages/SiteTariff'));

const Profile = lazy(() => import('@/pages/Profile'));

const About = lazy(() => import('@/pages/About'));

let routes = {
  expense: [],
  default: [
    {
      path: '/login',
      element: <Navigate to="/" />,
    },
    {
      path: '/logout',
      element: <Logout />,
    },
    {
      path: '/notifications',
      element: <Notifications />,
    },
    {
      path: '/about',
      element: <About />,
    },
    {
      path: '/',
      element: <Dashboard />,
    },
    {
      path: '/customer',
      element: <Customer />,
    },
    {
      path: '/invoice',
      element: <Invoice />,
    },
    {
      path: '/invoice/create',
      element: <InvoiceCreate />,
    },
    {
      path: '/invoice/read/:id',
      element: <InvoiceRead />,
    },
    {
      path: '/invoice/update/:id',
      element: <InvoiceUpdate />,
    },
    {
      path: '/invoice/pay/:id',
      element: <InvoiceRecordPayment />,
    },
    {
      path: '/quote',
      element: <Quote />,
    },
    {
      path: '/quote/create',
      element: <QuoteCreate />,
    },
    {
      path: '/quote/read/:id',
      element: <QuoteRead />,
    },
    {
      path: '/quote/update/:id',
      element: <QuoteUpdate />,
    },
    {
      path: '/payment',
      element: <Payment />,
    },
    {
      path: '/payment/read/:id',
      element: <PaymentRead />,
    },
    {
      path: '/payment/update/:id',
      element: <PaymentUpdate />,
    },
    {
      path: '/settings',
      element: <Settings />,
    },
    {
      path: '/settings/edit/:settingsKey',
      element: <Settings />,
    },
    {
      path: '/payment/mode',
      element: <PaymentMode />,
    },
    {
      path: '/taxes',
      element: <Taxes />,
    },
    {
      path: '/expenseCategory',
      element: <ExpenseCategory />,
    },
    {
      path: '/expense',
      element: <Expense />,
    },
    {
      path: '/contracts',
      element: <Contract />,
    },
    {
      path: '/contracts/create',
      element: <ContractCreate />,
    },
    {
      path: '/contracts/read/:id',
      element: <ContractRead />,
    },
    {
      path: '/contracts/update/:id',
      element: <ContractUpdate />,
    },
    {
      path: '/prestation',
      element: <Prestation />,
    },
    {
      path: '/site',
      element: <Site />,
    },
    {
      path: '/site-tariff',
      element: <SiteTariff />,
    },
    {
      path: '/report',
      element: <Report />,
    },
    {
      path: '/profile',
      element: <Profile />,
    },
    {
      path: '*',
      element: <NotFound />,
    }
  ]
};

export default routes;
