export const fields = {
  name: {
    type: 'string',
  },
  country: {
    type: 'country',
    // color: 'red',
  },
  address: {
    type: 'string',
  },
  contacts: {
    type: 'array',
    label: 'Contacts',
    itemFields: {
      tel: { type: 'phone', label: 'Téléphone' },
      mail: { type: 'email', label: 'Email' },
      poste: { type: 'string', label: 'Poste' },
    },
    maxItems: 5,
    disableForTable: true,
  },
};
