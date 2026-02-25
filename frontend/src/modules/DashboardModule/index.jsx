import { useEffect, useState } from 'react';

import { Tag, Row, Col } from 'antd';
import useLanguage from '@/locale/useLanguage';

import { useMoney } from '@/settings';

import { request } from '@/request';
import useFetch from '@/hooks/useFetch';
import useOnFetch from '@/hooks/useOnFetch';

import RecentTable from './components/RecentTable';

import SummaryCard from './components/SummaryCard';
import PreviewCard from './components/PreviewCard';
import CustomerPreviewCard from './components/CustomerPreviewCard';
import TaxSummaryCard from './components/TaxSummaryCard';

import { selectMoneyFormat } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';
import GraphPreviewCard from './components/GraphPreviewCard';  
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';  

dayjs.extend(isBetween);  

export default function DashboardModule() {
  //tz
  console.log('TTTTTTTTTTest tz ;;');
  const [total, setTotal] = useState(0);
  const [taxData, setTaxData] = useState({
    tvaCollected: 0,
    cssCollected: 0,
    tvaDeductible: 0
  });
  const [isTaxLoading, setIsTaxLoading] = useState(true);

    const getTotalExpensesForCurrentMonth = async () => {
      console.log('Appel getTotalExpensesForCurrentMonth');
    const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD');
    const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD');
  
    console.log("Début du mois:", startOfMonth);
    console.log("Fin du mois:", endOfMonth);
  
    try {
      // Effectuez une requête pour obtenir toutes les dépenses dans l'entité "expense" du mois en cours
      const response = await request.listAll({
        entity: 'expense', 
        filters: {
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      });
  
      console.log("Réponse de la requête des dépenses :", response);
  
      if (response.success && Array.isArray(response.result)) {
        // Filtrer les dépenses pour le mois en cours (au cas où la réponse contient des dépenses de différentes périodes)
        const expensesInCurrentMonth = response.result.filter((expense) => {
          const expenseDate = dayjs(expense.created); // Assurez-vous que `expense.date` existe
          console.log('expenseDate=',expenseDate);
          return expenseDate.isBetween(startOfMonth, endOfMonth, null, '[]');
        });
  
        // Calculer le total des dépenses pour ce mois
        const total = expensesInCurrentMonth.reduce((acc, expense) => acc + expense.total, 0);
  
        console.log("Dépenses du mois filtrées :", expensesInCurrentMonth);
        console.log("Total des dépenses du mois :", total);
  
        return total;
      } else {
        console.error("Aucune donnée de dépenses trouvée ou erreur de requête.");
        return 0; // Retourne 0 si aucune dépense trouvée ou en cas d'erreur
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des dépenses :", error);
      return 0; // Retourne 0 en cas d'erreur
    }
  };
  
  // Exemple d'appel de la fonction dans un useEffect ou un autre endroit de votre code
  useEffect(() => {
    const fetchTotal = async () => {
      const fetchedTotal = await getTotalExpensesForCurrentMonth();
      setTotal(fetchedTotal); // Mettre à jour l'état avec le total récupéré
      console.log("Total des dépenses du mois en cours :", fetchedTotal);
    };

    fetchTotal(); // Appel de la fonction pour récupérer le total des dépenses
  }, []);
  
  //tz
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const money_format_settings = useSelector(selectMoneyFormat);

  const getStatsData = async ({ entity, currency }) => {
    console.log("getStatsData called with:", { entity, currency });
    return await request.summary({
      entity,
      options: { currency },
    });
  
    
  };

  const {
    result: invoiceResult,
    isLoading: invoiceLoading,
    onFetch: fetchInvoicesStats,
  } = useOnFetch();

  const { result: quoteResult, isLoading: quoteLoading, onFetch: fetchQuotesStats } = useOnFetch();

  const {
    result: paymentResult,
    isLoading: paymentLoading,
    onFetch: fetchPayemntsStats,
  } = useOnFetch();

  const { result: clientResult, isLoading: clientLoading } = useFetch(() =>
    request.summary({ entity: 'client' })
  );
 const { result: expenseResult, isLoading: expenseLoading, onFetch: fetchExpensesStats } = useOnFetch();
//tizi

  useEffect(() => {
    const currency = money_format_settings.default_currency_code || null;

    if (currency) {
      fetchInvoicesStats(getStatsData({ entity: 'invoice', currency }));
      fetchQuotesStats(getStatsData({ entity: 'quote', currency }));
      fetchPayemntsStats(getStatsData({ entity: 'payment', currency }));
      //fetchExpensesStats(getStatsData({ entity: 'expense', currency })); //tizi
      
    }
  }, [money_format_settings.default_currency_code]);

  useEffect(() => {
    const fetchTaxData = async () => {
      try {
        setIsTaxLoading(true);
        
        // Récupérer les factures de l'année en cours
        const currentYear = dayjs().year();
        const invoicesResponse = await request.listAll({
          entity: 'invoice'
        });

        // Récupérer les dépenses avec listAll (qui filtre déjà removed: false)
        const expensesResponse = await request.listAll({
          entity: 'expense'
        });

        if (invoicesResponse.success && expensesResponse.success) {
          // Filtrer les factures de l'année en cours
          const invoices = invoicesResponse.result.filter(inv => 
            dayjs(inv.date).year() === currentYear
          );
          const expenses = expensesResponse.result.filter(exp =>
            dayjs(exp.created).year() === currentYear
          );

          // Calculer TVA collectée (18% des factures avec taxRate=18)
          const tvaCollected = invoices
            .filter(inv => inv.taxRate === 18)
            .reduce((sum, inv) => sum + inv.taxTotal, 0) +
            // Ajouter la TVA (18%) des factures avec taxRate=19
            invoices
              .filter(inv => inv.taxRate === 19)
              .reduce((sum, inv) => sum + (inv.taxTotal * 0.18 / 0.19), 0);

          // Calculer CSS collectée (1% des factures avec taxRate=19)
          const cssCollected = invoices
            .filter(inv => inv.taxRate === 19)
            .reduce((sum, inv) => sum + (inv.taxTotal * 0.01 / 0.19), 0);

          // Calculer TVA déductible (18% des dépenses)
          const tvaDeductible = expenses
            .reduce((sum, exp) => sum + (exp.total * 0.18), 0);

          // Calculer TPS collectée (TPS 9.5% et TPS et CSS 10.5%)
          const tpsCollected = invoices
            .filter(inv => inv.taxRate === 9.5 || inv.taxRate === 10.5)
            .reduce((sum, inv) => sum + inv.taxTotal, 0);

          setTaxData({
            tvaCollected,
            cssCollected,
            tvaDeductible,
            tpsCollected
          });
        }
      } catch (error) {
        console.error('Error fetching tax data:', error);
      } finally {
        setIsTaxLoading(false);
      }
    };

    fetchTaxData();
  }, []);

  const dataTableColumns = [
    {
      title: translate('number'),
      dataIndex: 'number',
    },
    {
      title: translate('Client'),
      dataIndex: ['client', 'name'],
    },

    {
      title: translate('Total'),
      dataIndex: 'total',
      onCell: () => {
        return {
          style: {
            textAlign: 'right',
            whiteSpace: 'nowrap',
            direction: 'ltr',
          },
        };
      },
      render: (total, record) => moneyFormatter({ amount: total, currency_code: record.currency }),
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
    },
  ];

  const entityData = [
    {
      result: invoiceResult,
      isLoading: invoiceLoading,
      entity: 'invoice',
      title: translate('Invoices'),
    },
    {
      result: quoteResult,
      isLoading: quoteLoading,
      entity: 'quote',
      title: translate('quote'),
    },
  ];

  const statisticCards = entityData.map((data, index) => {
    const { result, entity, isLoading, title } = data;

    return (
      <PreviewCard
        key={index}
        title={title}
        isLoading={isLoading}
        entity={entity}
        statistics={
          !isLoading &&
          result?.performance?.map((item) => ({
            tag: item?.status,
            color: 'blue',
            value: item?.percentage,
          }))
        }
      />
    );
  });

  if (money_format_settings) {
    return (
      <>
        <Row gutter={[14, 14]} justify="start" style={{ display: 'flex', flexWrap: 'nowrap' }}>
  <Col xs={24} sm={12} md={8} lg={22} style={{ display: 'flex', flexWrap: 'nowrap' }}>
    <SummaryCard
      title={translate('Invoices')}
      prefix={translate('This month')}
      isLoading={invoiceLoading}
      data={invoiceResult?.total}
      tagColor="blue" 
    />

    <SummaryCard
      title={translate('Quote')}
      prefix={translate('This month')}
      isLoading={quoteLoading}
      data={quoteResult?.total}
      tagColor="green"
    />
    
    <SummaryCard
      title={translate('Paid')}
      prefix={translate('This month')}
      isLoading={paymentLoading}
      data={paymentResult?.total}
      tagColor="pink"
    />
    
    <SummaryCard
      title={translate('Unpaid')}
      prefix={translate('Not Paid')}
      isLoading={invoiceLoading}
      data={invoiceResult?.total_undue}
      tagColor="yellow"
    />
  
    <SummaryCard
      title={translate('Expenses')}  
      prefix={translate('This month')}  
      isLoading={false}  
      data={total}  
      tagColor="orange"  
    />
  </Col>
</Row>

        <div className="space30"></div>
        <Row gutter={[32, 32]}>
          <Col className="gutter-row w-full" sm={{ span: 24 }} lg={{ span: 12 }}>
            <div className="whiteBox shadow pad20" style={{ height: '100%' }}>
              <h3 style={{ color: '#22075e', marginBottom: 5, padding: '0 20px 20px' }}>
                {translate('Recent Invoices')}
              </h3>
              <RecentTable entity={'invoice'} dataTableColumns={dataTableColumns} />
            </div>
          </Col>

          <Col className="gutter-row w-full" sm={{ span: 24 }} lg={{ span: 12 }}>
            <div className="whiteBox shadow pad20" style={{ height: '100%' }}>
              <h3 style={{ color: '#22075e', marginBottom: 5, padding: '0 20px 20px' }}>
                {translate('Recent Quotes')}
              </h3>
              <RecentTable entity={'quote'} dataTableColumns={dataTableColumns} />
            </div>
          </Col>
        </Row>
        <div className="space30"></div>
        <Row gutter={[32, 32]}>
          <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 24 }} lg={{ span: 18 }}>
            <div className="whiteBox shadow" style={{ height: 458 }}>
              <Row className="pad20" gutter={[0, 0]}>
                {statisticCards}
              </Row>
            </div>
          </Col>
          <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 24 }} lg={{ span: 6 }}>
            <CustomerPreviewCard
              isLoading={clientLoading}
              activeCustomer={clientResult?.active}
              newCustomer={clientResult?.new}
            />
          </Col>
        </Row>
        <div className="space30"></div>
        <Row gutter={[32, 32]}>
  <Col className="gutter-row w-full" sm={{ span: 24 }} md={{ span: 24 }} lg={{ span: 18 }}>
   {/* <div className="whiteBox shadow" style={{ height: 458 }}>
    <Row className="pad20" gutter={[0, 0]}>
        <GraphPreviewCard
          title="Graphique Mensuel"
          isLoading={invoiceLoading || quoteLoading || paymentLoading}
          invoiceResultTotal={invoiceResult?.total || 0}
          quoteResultTotal={quoteResult?.total || 0}
          invoiceResultUndueTotal={invoiceResult?.total_undue || 0}
        />
      </Row>
      
    </div> 
    */}
  </Col>
</Row>

        <div className="space30"></div>
<TaxSummaryCard 
          data={{
            ...taxData,
            paidInvoices: paymentResult?.total || 0,
            totalExpenses: total
          }} 
          isLoading={isTaxLoading} 
        />
        
      </>
    );
  } else {
    return <></>;
  }
}
