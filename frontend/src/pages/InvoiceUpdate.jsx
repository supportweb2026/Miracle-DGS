import React, { useState } from 'react';

const InvoiceUpdate = () => {
  const [clients, setClients] = useState([]);
  const [allContracts, setAllContracts] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);

  // Gérer le changement de client
  const handleClientChange = (clientId) => {
    const client = clients.find(c => c._id === clientId);
    setSelectedClient(client);
    const contractsForClient = allContracts.filter(contract => {
      if (!contract.client) {
        console.warn('Contrat sans client:', contract);
        return false;
      }
      if (typeof contract.client === 'string') {
        const match = contract.client === clientId;
        if (match) console.log('Contrat match string:', contract);
        return match;
      }
      if (typeof contract.client === 'object' && contract.client && contract.client._id) {
        const match = contract.client._id === clientId;
        if (match) console.log('Contrat match object:', contract);
        return match;
      }
      console.warn('Contrat client format inattendu:', contract.client, contract);
      return false;
    });
    setFilteredContracts(contractsForClient);
    form.setFieldsValue({ 
      contract: undefined, 
      services: [] 
    });
    setSelectedContract(null);
    setAvailableServices([]);
  };

  return (
    <div>
      {/* Rest of the component code */}
    </div>
  );
};

export default InvoiceUpdate; 