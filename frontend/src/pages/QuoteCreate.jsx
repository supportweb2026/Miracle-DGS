// Gérer le changement de client
const handleClientChange = (clientId) => {
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