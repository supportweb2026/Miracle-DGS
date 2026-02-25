import React from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import axios from 'axios';
import { request } from '@/request';
import * as XLSX from 'xlsx';

const { RangePicker } = DatePicker;

const exportToExcel = (data) => {
  console.log('fonction export to Excel');
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Factures');

  XLSX.writeFile(workbook, 'factures_clients.xlsx');
};

// Autres fonctions...




export default function ReportForm() {

  const paymentStatusOptions = [
   
    {
      value: 'paid_fully',
      label: 'Clients ayant réglé l’intégralité de leurs factures',
    },
    {
      value: 'paid_partially',
      label: 'Clients ayant partiellement réglé leurs factures',
    },
    {
      value: 'unpaid',
      label: 'Clients n’ayant pas réglé leurs factures',
    },
  ];
  async function fetchPayment(myId) {
    try {
      console.log('lecture en cours');
      const response = await request.read({ entity: 'payment', id: myId });
      const paymentDetails=response.result;
      console.log('paymentDetails:',paymentDetails);
      console.log('payment number:',paymentDetails.paymentMode.name);
      return {
        number: paymentDetails.number,
        amount: paymentDetails.amount,
        date: paymentDetails.date,
        year: new Date(paymentDetails.date).getFullYear(),
        paymentMode: paymentDetails.paymentMode.name, // Ex: 'Carte bancaire'
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du paiement:', error);
      return null;
    }
  }

  const onFinish = async (values) => {
   // const [invoicesWithClientName, setInvoicesWithClientName] = useState([]); // Suppose que les données des factures sont ici

    console.log('Form values:', values);
  
    const [startDate, endDate] = values.billingPeriod;
    const formattedStart = startDate.startOf('day');
    const formattedEnd = endDate.endOf('day');
  
    let filterOptions = {};
    let nomFile = 'Factures'; // valeur par défaut
    const today = new Date().toLocaleDateString('fr-FR'); // Format français JJ/MM/AAAA

    if (['paid_fully', 'paid_partially', 'unpaid'].includes(values.paymentStatus)) {
      const statusMap = {
        paid_fully: 'paid',
        paid_partially: 'partially',
        unpaid: 'unpaid'
      };
      const fileNameMap = {
        paid_fully: 'Factures Payées',
        paid_partially: 'Factures Partiellement Payées',
        unpaid: 'Factures Impayées'
      };
    
      filterOptions.filter = 'paymentStatus';
      filterOptions.equal = statusMap[values.paymentStatus];
      nomFile = fileNameMap[values.paymentStatus];

    }
   

  
    try {
      const response = await request.filter({
        entity: 'invoice',
        options: filterOptions,
      });
  
      // On filtre les résultats ici côté client
      const filteredInvoices = response.result.filter((invoice) => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= formattedStart.toDate() && invoiceDate <= formattedEnd.toDate();
      });
      const invoicesWithClientAndServiceNames = await Promise.all(
        filteredInvoices.map(async (invoice) => {
        // Remplacer l'ID client par son nom
        const clientName = invoice.client?.name || 'Client inconnu';
        let paymentName = '';
        let servicesNames='';
        console.log('invoice.services:',invoice.services);
        invoice.services.forEach(item => {
          console.log('item:',item.service.name);
          servicesNames+=item.service.name+"/";
        });
        
        const taxRateUp = invoice.taxRate+'%';
        console.log('id payment:',invoice.payment);
        if (values.paymentStatus !== 'unpaid') {

        const paymentDetails = await fetchPayment(invoice.payment); // Récupère les détails du paiement
        console.log('paymentDetails: fonction:',paymentDetails?.amount);
        // Remplacer les IDs des services par leurs noms
        //const servicesNames = invoice.services.map(item => item.service.name || 'Service inconnu');
        invoice.paymentNumber = paymentDetails?.number || 'Inconnu';
        invoice.paymentAmount = paymentDetails?.amount || 0;
        invoice.paymentDate = paymentDetails?.date || 'Date inconnue';
        invoice.paymentYear = paymentDetails?.year || '';
        invoice.paymentMode = paymentDetails?.paymentMode;
        }
        console.log('invoice,',invoice);
        return {
          ...invoice,
          client: clientName, // Remplacer l'ID client par le nom du client
          services: servicesNames, // Remplacer l'ID des services par leur nom
          currency: 'XAF',
          taxRate: taxRateUp,
          
        };
      })
    );
    
      
      
  
      console.log("Factures filtrées avec date :", filteredInvoices);
      console.log('Factures avec nom du client :', invoicesWithClientAndServiceNames);
     // setInvoicesWithClientName(invoicesWithClientName);
     //Traduction Intitulés en francais:
     const formatDateFR = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR');
    };
    
    const traduireStatut = (statut) => {
      switch (statut) {
        case 'draft': return 'Brouillon';
        case 'sent': return 'Envoyée';
        case 'pending': return 'En attente';
        default: return statut;
      }
    };
    
    const traduirePaiement = (status) => {
      switch (status) {
        case 'paid': return 'Payée';
        case 'partially': return 'Partiellement payée';
        case 'unpaid': return 'Non payée';
        default: return status;
      }
    };
    
    const facturesAvecIntitulesFrancais = invoicesWithClientAndServiceNames.map(invoice => ({
      "Numéro de facture": invoice.number,
      "Année": invoice.year,
      "Date de facturation": formatDateFR(invoice.date),
      "Client": invoice.client,
      "Services": invoice.services,
      "Sous-total (HT)": invoice.subTotal,
      "Taux de TVA (%)": invoice.taxRate,
      "Montant TVA": invoice.taxTotal,
      "Total TTC": invoice.total,
      "Devise": invoice.currency,
      "Crédit": invoice.credit,
      "Remise": invoice.discount,
      "Statut de paiement": traduirePaiement(invoice.paymentStatus),
      "Facture en retard": invoice.isOverdue ? "Oui" : "Non",
      //"Approuvée": invoice.approved ? "Oui" : "Non",
      "Statut": traduireStatut(invoice.status),
      //"Nom du fichier PDF": invoice.pdf || '',
      //"Fichiers attachés": Array.isArray(invoice.files) && invoice.files.length > 0 ? invoice.files.join(', ') : "Aucun",
      "Créée le": formatDateFR(invoice.created),
      "Modifiée le": formatDateFR(invoice.updated),
      ...(values.paymentStatus !== 'unpaid' && {
        "Numéro de Paiement": invoice.paymentNumber,
        "Montant du Paiement": invoice.paymentAmount,
        "Date du Paiement": formatDateFR(invoice.paymentDate),
        "Année du Paiement": invoice.paymentYear,
        "Mode de Paiement": invoice.paymentMode,
      }),
      
    }));
    
    

//Fin Traduction
     const worksheet = XLSX.utils.json_to_sheet(facturesAvecIntitulesFrancais);


     // Ajouter des styles pour les intitulés
     const range = XLSX.utils.decode_range(worksheet['!ref']); // Obtenir la plage des données (en-têtes + données)
     console.log('range:',range);
 for (let col = range.s.c; col <= range.e.c; col++) {
       const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c: col })]; // Cibler la première ligne (les en-têtes)
       if (cell) {
         cell.s = {
           fill: {
             fgColor: { rgb: "ADD8E6" }, // Couleur de fond jaune
           },
           font: {
             bold: true, // Texte en gras
             color: { rgb: "ADD8E6" }, // Couleur du texte (noir)
           },
         };
       }
     }
     
     // Ajouter un filtre automatique
     worksheet['!autofilter'] = { ref: worksheet['!ref'] };
     
     // Créer un nouveau classeur et ajouter la feuille
     const workbook = XLSX.utils.book_new();
     XLSX.utils.book_append_sheet(workbook, worksheet, 'Factures');
     
     // Générer le fichier Excel
     XLSX.writeFile(workbook, nomFile+'_'+today+'.xlsx');
     
 
     console.log('Fichier Excel généré');

    } catch (error) {
      console.error("Erreur lors de la récupération des factures :", error);
    }
  };
  
  
  
  

  return (
    <Form layout="vertical" onFinish={onFinish} style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Génération de Rapport</h2>

      <Form.Item
        label="Statut de paiement des clients"
        name="paymentStatus"
        rules={[{ required: true, message: 'Veuillez sélectionner un statut de paiement' }]}
      >
        <Select
          placeholder="Veuillez sélectionner un critère"
          options={paymentStatusOptions}
        />
      </Form.Item>

      <Form.Item
        label="Période de facturation"
        name="billingPeriod"
        rules={[{ required: true, message: 'Veuillez sélectionner une période' }]}
      >
        <RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
      </Form.Item>

      <Form.Item style={{ textAlign: 'center', marginTop: 32 }}>
        <Button type="primary" htmlType="submit" icon={<FileTextOutlined />}>
          Générer le rapport
        </Button>
      </Form.Item>
    </Form>
  );
} 
