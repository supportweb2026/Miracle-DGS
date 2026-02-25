import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons';  
import { useSelector } from 'react-redux';
import { selectCurrentAdmin } from '@/redux/auth/selectors';  
import { request } from '@/request'; 


//const { exec } = require('child_process');

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);  
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);

  const currentAdmin = useSelector(selectCurrentAdmin);
  console.log('currentAdmin=', currentAdmin._id);

  const fetchNotifications = async () => {
    if (currentAdmin) {
      console.log('oui currentAdmin',);
      try {
        const response = await request.listAll({
          entity: 'notification',
          options: {
            user: currentAdmin._id, 
          }
        });
        console.log('response=', response);
        const fetchedNotifications = Array.isArray(response.result) ? response.result : [];
        console.log('fetchedNotifications=', fetchedNotifications);
        const notificationsForCurrentAdmin = fetchedNotifications
          .map(notification => {
            console.log('user=', notification.user); // Vérif valeurs de "user" pour le débogageiez les
            console.log('currentAdmin:', currentAdmin._id);
            console.log('user=currentAdmin?', notification.user === currentAdmin._id);
            return notification;
          })
          .filter(notification => notification.user === currentAdmin._id);
        console.log('notificationsForCurrentAdmin=', notificationsForCurrentAdmin);
        setNotifications(notificationsForCurrentAdmin); 
      } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        setNotifications([]);  // En cas d'erreur, on vide les notifications
      }
    }
  };

  
  useEffect(() => {
    console.log('use effec fetch');
    fetchNotifications();
  }, [currentAdmin]);

  // Fonction pour supprimer une notification
  const deleteNotification = async (id) => {
    try {
      await request.delete({ entity: 'notifications', id });
      setNotifications(notifications.filter((notification) => notification.id !== id)); // Filtrer la notification supprimée
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
    }
  };

  // Fonction pour gérer le clic sur une notification et défiler jusqu'à l'élément
  // Fonction pour gérer le clic sur une notification et défiler jusqu'à l'élément
const handleNotificationClick = (id) => {
  // Si la notification est déjà sélectionnée, la désélectionner
  setSelectedNotificationId(prevId => prevId === id ? null : id);

  // Faire défiler la page jusqu'à la notification sélectionnée
  const element = document.getElementById(`notif-${id}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
const openPreFilledEmail = (email, name) => {
  const subject = encodeURIComponent("Rappel : Expiration de votre contrat");
  const body = encodeURIComponent(`Bonjour ${name},

Nous souhaitons vous rappeler que votre contrat arrive bientôt à expiration.
N'hésitez pas à nous contacter pour le renouveler et éviter toute interruption de service.

Cordialement,
Votre équipe DGS
Centre médicaux
Libreville, Gabon
dgsgabon2.0@gmail.com
+247 074 80 87 81
www.dgs-gabon.com`);

  const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
  window.location.href = mailtoLink;
};
const openInvoiceReminderEmail = (email, name, invoiceNumber, invoiceDate) => {
  const subject = encodeURIComponent("Rappel : Facture impayée - Relance de paiement");
  
  // Formater la date de création de manière lisible
  const formattedInvoiceDate = new Date(invoiceDate).toLocaleDateString('fr-FR');

  const body = encodeURIComponent(`Bonjour ${name},

Nous souhaitons vous rappeler que la facture n°${invoiceNumber} a été créée le ${formattedInvoiceDate} et reste impayée.
Nous vous prions de bien vouloir procéder au règlement dans les plus brefs délais afin d'éviter toute interruption de service.

Pour toute question, n'hésitez pas à nous contacter.

Cordialement,
Votre équipe DGS
Centre médicaux
Libreville, Gabon
dgsgabon2.0@gmail.com
+247 074 80 87 81
www.dgs-gabon.com`);

  const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
  window.location.href = mailtoLink;
};




  // Fonction de relance pour la notification (vous pouvez l'adapter à vos besoins)
  const relaunchNotification = async (id, type) => {
    try {
      console.log('=== DÉBUT RELANCE NOTIFICATION ===');
      console.log(`ID: ${id}, Type: ${type}`);
      
      if (type === 'Contract') {
        console.log('Traitement d\'une notification de contrat');
        const response = await request.read({
          entity: 'contract',
          id: id,
        });
        console.log('Réponse API contrat:', response);

        if (!response?.result) {
          console.error('ERREUR: Pas de données de contrat trouvées');
          return;
        }

        const client = response.result.client;
        console.log('Données client:', client);

        if (!client?.email || !client?.name) {
          console.error('ERREUR: Informations client manquantes');
          console.log('Email présent:', !!client?.email);
          console.log('Nom présent:', !!client?.name);
          return;
        }

        console.log('Préparation de l\'email pour le contrat');
        const email = client.email;
        const name = client.name;
        console.log('Données email:', { email, name });
        openPreFilledEmail(email, name);
      }
      else if (type === 'Invoice') {
        console.log('Traitement d\'une notification de facture');
        const response = await request.read({
          entity: 'invoice',
          id: id,
        });
        console.log('Réponse API facture:', response);

        if (!response?.result) {
          console.error('ERREUR: Pas de données de facture trouvées');
          return;
        }

        const client = response.result.client;
        console.log('Données client:', client);

        if (!client?.email || !client?.name) {
          console.error('ERREUR: Informations client manquantes');
          console.log('Email présent:', !!client?.email);
          console.log('Nom présent:', !!client?.name);
          return;
        }

        console.log('Préparation de l\'email pour la facture');
        const email = client.email;
        const name = client.name;
        const invoiceNumber = response.result.number;
        const invoiceDate = response.result.date;
        console.log('Données facture:', { email, name, invoiceNumber, invoiceDate });

        if (!invoiceNumber || !invoiceDate) {
          console.error('ERREUR: Informations de facture manquantes');
          console.log('Numéro présente:', !!invoiceNumber);
          console.log('Date présente:', !!invoiceDate);
          return;
        }

        openInvoiceReminderEmail(email, name, invoiceNumber, invoiceDate);
      }
      console.log('=== FIN RELANCE NOTIFICATION ===');
    } catch (error) {
      console.error('ERREUR CRITIQUE lors de la relance:', error);
      console.error('Stack trace:', error.stack);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        <p style={styles.title}>Notifications</p>
        <Button type="text" shape="circle" style={styles.clearBtn}>
          <DeleteOutlined />
        </Button>
      </div>
      <div style={styles.notificationList}>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              id={`notif-${notification.id}`} // Ajoute un id unique pour chaque notification
              key={notification.id}
              style={styles.notificationItem}
              onClick={() => handleNotificationClick(notification.id)}
            >
              <Button type="text" style={styles.notificationBtn}>
                <span>{notification.message}</span>
              </Button>
              <Button
                type="text"
                style={styles.deleteBtn}
                shape="circle"
                onClick={(e) => {
                  e.stopPropagation(); // Empêche le clic de déclencher le défilement
                  deleteNotification(notification.id); // Suppression de la notification
                }}
              >
                <DeleteOutlined />
              </Button>
              {selectedNotificationId === notification.id && (
                <div style={styles.notificationDetail}>
                  <p>{notification.detail}</p>
                  <Button
                    type="primary"
                    style={styles.relaunchBtn}
                    onClick={(e) => {
                      e.stopPropagation();  // Empêche le clic de déclencher le défilement
                      relaunchNotification(notification.relatedId, notification.relatedType); // Relance la notification
                    }}
                  >
                    <ReloadOutlined /> Relancer
                  </Button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>Aucune notification disponible.</p>  // Message à afficher si aucune notification n'est disponible
        )}
      </div>
    </div>
  );
};

// Styles object
const styles = {
  pageContainer: {
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    backgroundColor: '#fff',
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  title: {
    marginLeft: '10px',
    fontSize: '24px',
    color: '#333',
    fontWeight: 'bold',
  },
  clearBtn: {
    marginLeft: 'auto',
    fontSize: '20px',
    color: '#ff4d4f',
  },
  notificationList: {
    marginTop: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  notificationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 20px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    alignItems: 'center', // Pour centrer le contenu sur l'axe vertical
  },
  notificationBtn: {
    fontSize: '16px',
    color: '#333',
    flex: 1,
    textAlign: 'left',
  },
  deleteBtn: {
    fontSize: '18px',
    color: '#ff4d4f',
  },
  notificationDetail: {
    marginTop: '10px',
    padding: '10px 20px', // Padding ajusté pour plus de lisibilité
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#555',
    width: '100%', // Pour que le texte prenne toute la largeur disponible
    display: 'block', // Force le texte à occuper une nouvelle ligne
    marginLeft: 0, // Aucune marge à gauche pour aligner le texte
    paddingLeft: '20px', // Assurer que l'alignement commence sous le texte de la notification
  },
  relaunchBtn: {
    marginTop: '10px',
    backgroundColor: '#4CAF50', // Une couleur verte pour le bouton de relance
    color: 'white',
    borderRadius: '4px',
    padding: '5px 10px',
  },
};

export default NotificationsPage;
