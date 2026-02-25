import { ErpLayout } from '@/layout';
import CreateService from '@/modules/ErpPanelModule/CreateService';
import InvoiceForm from '@/modules/InvoiceModule/Forms/InvoiceForm';

export default function CreateInvoiceModule({ config }) {
  return (
    <ErpLayout>
      <CreateService config={config} CreateForm={InvoiceForm} />
    </ErpLayout>
  );
}
