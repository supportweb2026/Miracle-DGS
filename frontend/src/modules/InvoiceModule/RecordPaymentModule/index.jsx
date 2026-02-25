import { ErpLayout } from '@/layout';

import PageLoader from '@/components/PageLoader';
import { erp } from '@/redux/erp/actions';
import { selectItemById, selectCurrentItem, selectRecordPaymentItem } from '@/redux/erp/selectors';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import Payment from './components/Payment';

console.log('=== RECORD PAYMENT MODULE LOADED ===');

export default function RecordPaymentModule({ config }) {
  console.log('=== RECORD PAYMENT MODULE RENDER ===');
  console.log('Config:', config);

  const dispatch = useDispatch();
  const { id } = useParams();
  console.log('ID from params:', id);

  let item = useSelector(selectItemById(id));
  console.log('Item from selector:', item);

  useEffect(() => {
    console.log('=== EFFECT 1 ===');
    console.log('Item:', item);
    if (item) {
      console.log('Dispatching currentItem with data:', item);
      dispatch(erp.currentItem({ data: item }));
    } else {
      console.log('Dispatching read with entity:', config.entity, 'and id:', id);
      dispatch(erp.read({ entity: config.entity, id }));
    }
  }, [item, id]);

  const { result: currentResult } = useSelector(selectCurrentItem);
  console.log('Current Result from selector:', currentResult);
  item = currentResult;

  useEffect(() => {
    console.log('=== EFFECT 2 ===');
    console.log('Dispatching currentAction with item:', item);
    dispatch(erp.currentAction({ actionType: 'recordPayment', data: item }));
  }, [item]);

  console.log('=== RENDERING RECORD PAYMENT MODULE ===');
  console.log('Item for Payment component:', item);
  console.log('Current Result for Payment component:', currentResult);

  return (
    <ErpLayout>
      {item ? (
        <Payment config={config} currentItem={currentResult} />
      ) : (
        <PageLoader />
      )}
    </ErpLayout>
  );
}
