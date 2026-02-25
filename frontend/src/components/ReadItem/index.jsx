import { useEffect, useState } from 'react';
import { Row, Col, Button } from 'antd';
import { useSelector } from 'react-redux';
import { MailOutlined } from '@ant-design/icons';

import dayjs from 'dayjs';
import { dataForRead } from '@/utils/dataStructure';

import { useCrudContext } from '@/context/crud';
import { selectCurrentItem } from '@/redux/crud/selectors';
import { valueByString } from '@/utils/helpers';

import useLanguage from '@/locale/useLanguage';
import { useDate } from '@/settings';

export default function ReadItem({ config }) {
  const { dateFormat } = useDate();
  let { readColumns, fields, entity } = config;
  const translate = useLanguage();
  const { result: currentResult } = useSelector(selectCurrentItem);
  const { state } = useCrudContext();
  const { isReadBoxOpen } = state;
  const [listState, setListState] = useState([]);

  if (fields) readColumns = [...dataForRead({ fields: fields, translate: translate })];
  useEffect(() => {
    const list = [];
    readColumns.map((props) => {
      console.log('props:',props);
      const propsKey = props.dataIndex;
      const propsTitle = props.title;
      const isDate = props.isDate || false;
      let value = valueByString(currentResult, propsKey);
      console.log('value valeur:',value);
      value = isDate ? dayjs(value).format(dateFormat) : value;
      console.log('La valeur est un objet pour', propsKey, ':', JSON.stringify(value, null, 2));
      console.log(`Type de value pour ${propsKey}:`, typeof value, value);

      if (props.render && typeof props.render === 'function') {
        console.log(`Valeur avant render (${propsKey}):`, value);
      
        // Si value est une string qui représente un JSON, on la reconvertit en objet
        if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
          try {
            value = JSON.parse(value);
          } catch (error) {
            console.error(`Erreur lors du parsing de ${propsKey}:`, error);
          }
        }
      
        //value = props.render(value, currentResult);
        value = value != null ? props.render(value, currentResult) : 'N/A';

        console.log(`Valeur après render (${propsKey}):`, value);
      }
      
      if (typeof value === 'object' && value !== null) {
        console.warn(`Attention: ${propsKey} est encore un objet, extraction de ses champs...`);
        
        // EXTRAIRE "name" par défaut si disponible
        value = value.name ?? JSON.stringify(value); // Fallback en JSON
      }
      
      

      list.push({ propsKey, label: propsTitle, value: value });
    });
    setListState(list);
  }, [currentResult]);

  const show = isReadBoxOpen ? { display: 'block', opacity: 1 } : { display: 'none', opacity: 0 };

  // On retire la ligne 'contacts' de la liste principale
  const itemsList = listState
    .filter(item => item.propsKey !== 'contacts')
    .map((item) => {
      return (
        <Row key={item.propsKey} gutter={12}>
          <Col className="gutter-row" span={8}>
            <p>{item.label}</p>
          </Col>
          <Col className="gutter-row" span={2}>
            <p> : </p>
          </Col>
          <Col className="gutter-row" span={14}>
            <p>{item.value}</p>
          </Col>
        </Row>
      );
    });

  // Amélioration affichage contacts (array)
  let contactsBlock = null;
  if (currentResult && Array.isArray(currentResult.contacts) && currentResult.contacts.length > 0) {
    // Filtrer les contacts à afficher : au moins un champ renseigné (tel, mail, poste)
    const filteredContacts = currentResult.contacts.slice(0, 5).filter(
      c => (c && (c.tel || c.mail || c.poste))
    );
    if (filteredContacts.length > 0) {
      contactsBlock = (
        <div style={{ marginBottom: 16 }}>
          <b>Contacts :</b>
          {filteredContacts.map((c, i) => {
            // Afficher le nom du contact si présent
            const contactName = c.nom || c.name || `Contact ${i + 1}`;
            return (
              <div key={i} style={{
                border: '1px solid #eee',
                borderRadius: 6,
                padding: 8,
                margin: '8px 0',
                background: '#fafbfc',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}>
                <b>{contactName}</b><br />
                <div><b>Tél :</b> {c.tel || <span style={{ color: '#bbb' }}>-</span>}</div>
                <div><b>Email :</b> {c.mail || <span style={{ color: '#bbb' }}>-</span>}</div>
                <div><b>Poste :</b> {c.poste || <span style={{ color: '#bbb' }}>-</span>}</div>
              </div>
            );
          })}
        </div>
      );
    }
  }

  // Fonction mailto pour contrat
  function handleMailtoContract() {
    const email = currentResult?.client?.email || '';
    const name = currentResult?.client?.name || '';
    const number = currentResult?.number || '';
    const year = currentResult?.year || '';
    const subject = `Votre contrat #${number}/${year}`;
    const body = `Bonjour ${name},%0D%0A%0D%0AVeuillez trouver ci-joint votre contrat n°${number}/${year}.%0D%0ACordialement.`;
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  return <div style={show}>
    {/* Bouton mailto pour contrat uniquement */}
    {entity === 'contract' && (
      <Button
        icon={<MailOutlined />}
        style={{ marginBottom: 16 }}
        onClick={handleMailtoContract}
      >
        Envoyer par e-mail
      </Button>
    )}
    {itemsList}
    {contactsBlock}
  </div>;
}
