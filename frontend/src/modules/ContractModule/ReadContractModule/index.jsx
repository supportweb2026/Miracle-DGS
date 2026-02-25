import NotFound from '@/components/NotFound';
import { ErpLayout } from '@/layout';
import ReadContract from './ReadContract';

import PageLoader from '@/components/PageLoader';
import { erp } from '@/redux/erp/actions';
import { selectReadItem } from '@/redux/erp/selectors';
import { useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useParams } from 'react-router-dom';

export default function ReadContractModule({ config }) {
  const dispatch = useDispatch();
  const { id } = useParams();

  console.log('=== READ CONTRACT MODULE ===');
  console.log('Config:', config);
  console.log('Contract ID:', id);

  useLayoutEffect(() => {
    console.log('=== DISPATCHING ERP READ ===');
    console.log('Entity:', config.entity);
    console.log('ID:', id);
    dispatch(erp.read({ entity: config.entity, id }));
  }, [id]);

  const { result: currentResult, isSuccess, isLoading = true } = useSelector(selectReadItem);

  console.log('=== READ STATE ===');
  console.log('Current Result:', currentResult);
  console.log('Is Success:', isSuccess);
  console.log('Is Loading:', isLoading);

  if (isLoading) {
    console.log('=== SHOWING LOADER ===');
    return (
      <ErpLayout>
        <PageLoader />
      </ErpLayout>
    );
  } else {
    console.log('=== RENDERING READ VIEW ===');
    return (
      <ErpLayout>
        {isSuccess ? (
          <ReadContract config={config} selectedContract={currentResult} />
        ) : (
          <NotFound entity={config.entity} />
        )}
      </ErpLayout>
    );
  }
} 