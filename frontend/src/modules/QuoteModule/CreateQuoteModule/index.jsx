import { ErpLayout } from '@/layout';
import CreateService from '@/modules/ErpPanelModule/CreateService';
import QuoteForm from '@/modules/QuoteModule/Forms/QuoteForm';

export default function CreateQuoteModule({ config }) {
  console.log('CreateQuoteModule...');
  return (
    <ErpLayout>
      <CreateService config={config} CreateForm={QuoteForm} />
    </ErpLayout>
  );
}
