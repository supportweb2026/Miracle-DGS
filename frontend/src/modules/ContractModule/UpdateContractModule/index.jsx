import NotFound from '@/components/NotFound';
import { ErpLayout } from '@/layout';
import UpdateContract from './UpdateContract';

import PageLoader from '@/components/PageLoader';
import { erp } from '@/redux/erp/actions';
import { selectReadItem } from '@/redux/erp/selectors';
import { useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

export default function UpdateContractModule({ config }) {
  const dispatch = useDispatch();
  const { id } = useParams();

  console.log('=== UPDATE CONTRACT MODULE ===');
  console.log('Config:', config);
  console.log('Contract ID:', id);

  useLayoutEffect(() => {
    console.log('=== DISPATCHING ERP READ FOR UPDATE ===');
    console.log('Entity:', config.entity);
    console.log('ID:', id);
    dispatch(erp.read({ entity: config.entity, id }));
  }, [id]);

  const { result: currentResult, isSuccess, isLoading = true } = useSelector(selectReadItem);

  console.log('=== UPDATE STATE ===');
  console.log('Current Result:', currentResult);
  console.log('Is Success:', isSuccess);
  console.log('Is Loading:', isLoading);

  useLayoutEffect(() => {
    if (currentResult) {
      console.log('=== DISPATCHING CURRENT ACTION ===');
      console.log('Action Type: update');
      console.log('Data:', currentResult);
      const data = { ...currentResult };
      dispatch(erp.currentAction({ actionType: 'update', data }));
    }
  }, [currentResult]);

  if (isLoading) {
    console.log('=== SHOWING LOADER ===');
    return (
      <ErpLayout>
        <PageLoader />
      </ErpLayout>
    );
  } else {
    console.log('=== RENDERING UPDATE VIEW ===');
    return (
      <ErpLayout>
        {isSuccess ? (
          <UpdateContract 
            config={config} 
            currentResult={currentResult}
            isSuccess={isSuccess}
          />
        ) : (
          <NotFound entity={config.entity} />
        )}
      </ErpLayout>
    );
  }
} 