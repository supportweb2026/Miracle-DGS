const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { loadSettings } = require('../../middlewares/settings');
const useLanguage = require('../../locale/useLanguage');
const { useMoney } = require('../../settings');

// Charger le modèle Contract pour éviter l'erreur de schéma
const Contract = require('../../models/appModels/Contract');

// Fonction pour sauvegarder les logs dans un fichier .txt
const saveLogsToFile = (logs, contractId) => {
    try {
        const logsDir = path.join(__dirname, '../../../logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const filename = `puppeteer_logs_${contractId}_${timestamp}.txt`;
        const filepath = path.join(logsDir, filename);
        
        fs.writeFileSync(filepath, logs, 'utf8');
        console.log(`📝 Logs sauvegardés dans: ${filepath}`);
        console.log(`📁 Chemin complet: ${path.resolve(filepath)}`);
        return filepath;
    } catch (error) {
        console.error('❌ Erreur sauvegarde logs:', error.message);
        return null;
    }
};

// Configuration Puppeteer
const puppeteerOptions = {
  headless: true, // Mode headless pour serveur
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--disable-gpu',
    '--disable-web-security',
    '--disable-features=VizDisplayCompositor'
  ]
};

// Fonction de formatage de date
const formatDate = (date) => {
  if (!date) return '';
  return moment(date).format('DD/MM/YYYY');
};

// Fonction de formatage monétaire
const formatMoney = (amount) => {
  if (!amount && amount !== 0) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2
  }).format(amount);
};

// Fonction de traduction
const translate = (key) => {
  const translations = {
    'Total': 'Total',
    'Subtotal': 'Sous-total',
    'Tax': 'Taxe',
    'No items': 'Aucun article'
  };
  return translations[key] || key;
};

// Template HTML moderne pour les contrats
const generateContractHTML = (model, settings, helpers, logoBase64) => {
  // Vérifier et fournir des valeurs par défaut pour helpers
  if (!helpers) {
    console.log('⚠️ Helpers non fournis, utilisation des valeurs par défaut');
    helpers = {
      dateFormat: (date) => {
        if (!date) return '';
        return moment(date).format('DD/MM/YYYY');
      },
      moneyFormatter: (amount) => {
        if (!amount && amount !== 0) return '0,00 €';
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2
        }).format(amount);
      },
      translate: (key) => key,
      moment: moment
    };
  }
  
  const { dateFormat, moneyFormatter, translate, moment } = helpers;
  
  // Fonction pour formater les montants en XAF
  const formatXAF = (amount) => {
    if (!amount && amount !== 0) return '0 XAF';
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,  // Pas de décimales
      maximumFractionDigits: 0,  // Pas de décimales
    }).format(amount);
    return `${formatted} XAF`;
  };

  // Debug des données reçues
  console.log('🔍 DEBUG - Données du contrat reçues:');
  console.log('Model:', JSON.stringify(model, null, 2));
  console.log('Settings:', JSON.stringify(settings, null, 2));
  console.log('Services:', model.services ? JSON.stringify(model.services, null, 2) : 'Aucun service');
  
  // Encoder l'image en base64
  let logoDebugInfo = '';
  
  try {
      logoDebugInfo += ` Chemin du logo: ${logoBase64}\n`;
      logoDebugInfo += `🔍 Vérification existence fichier...\n`;
      
      if (logoBase64) {
          logoDebugInfo += `📍 Fichier logo trouvé\n`;
          logoDebugInfo += `📍 Logo encodé en base64: ${logoBase64.length} caractères\n`;
          logoDebugInfo += `🔍 Début base64: ${logoBase64.substring(0, 50)}...\n`;
      } else {
          logoDebugInfo += `❌ Fichier logo non trouvé à: ${logoBase64}\n`;
      }
  } catch (error) {
      logoDebugInfo += `❌ Erreur lecture logo: ${error.message}\n`;
      logoDebugInfo += `❌ Stack trace: ${error.stack}\n`;
  }

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrat - ${settings.company_name}</title>
    <!-- CSS EXTERNE SUPPRIMÉ - Utilisation uniquement de styles inline -->
</head>
<body style="width: 100%; margin: 0; padding: 0; background: #fff; font-family: Arial, sans-serif; font-size: 8px; color: #222; position: relative; min-height: 297mm;">
    
    <!-- Header ultra-compact avec logo et titre -->
    <div style="width: 100%; margin-bottom: 0;">
        <!-- Logo en haut à gauche - CSS inline pur -->
        <div style="width: 200px; height: 80px; margin: 20px 0 0 20px; text-align: left; display: inline-block;">
            <img src="data:image/png;base64,${logoBase64}" 
                 style="width: 100%; height: 100%; object-fit: contain; display: block;" />
        </div>
        
        <!-- Espace pour séparer logo et titre -->
        <div style="height: 10px; display: block;"></div>
        
        <!-- Titre centré - bien séparé du logo -->
        <div style="text-align: center; margin: 0; padding: 0;">
            <h1 style="font-size: 20px; color: #1a365d; margin: 20px 0 15px 0; padding: 15px; background: linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%); border-radius: 8px; border: 1px solid #e2e8f0;">CONTRAT DE PRESTATION DE SERVICES</h1>
        </div>
    </div>
    
    <div style="margin: 0; padding: 0;">
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h2 style="background: linear-gradient(90deg, #1a365d 0%, #2d3748 100%); color: white; padding: 8px 15px; margin: 25px 0 15px 0; border-radius: 5px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Préambule</h2>
            <p style="line-height: 1.6; margin-bottom: 15px; text-align: justify; padding: 0; margin-top: 5px; font-size: 12px;">
                Le présent contrat a pour objet de définir les termes et conditions dans lesquelles la société ${settings.company_name} s'engage à fournir des services de sécurité, incluant la mise à disposition d'agents de sécurité confirmés, pour le client, dans le cadre de la protection de ses biens, de ses installations et de ses employés.
            </p>
            
            <h2 style="background: linear-gradient(90deg, #1a365d 0%, #2d3748 100%); color: white; padding: 8px 15px; margin: 25px 0 15px 0; border-radius: 5px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">1. Description des Services Fournis</h2>
            <p style="font-size: 12px;">Les services suivants seront fournis :</p>
            
            ${model.services && model.services.length ? 
                (() => {
                    const servicesBySite = {};
                    model.services.forEach(service => {
                        let siteId, siteName;
                        
                        if (service.prestationType === 'classic') {
                            // Cas classic : site et prestationId séparés
                            siteId = service.site && service.site._id || 'unknown';
                            siteName = service.site && service.site.name || 'Site non défini';
                        } else if (service.prestationType === 'site_specific') {
                            // Cas site_specific : siteTariffId contient tout
                            siteId = service.siteTariffId && service.siteTariffId.site && service.siteTariffId.site._id || 'unknown';
                            siteName = service.siteTariffId && service.siteTariffId.site && service.siteTariffId.site.name || 'Site non défini';
                        } else {
                            siteId = 'unknown';
                            siteName = 'Type inconnu';
                        }
                        
                        if (!servicesBySite[siteId]) servicesBySite[siteId] = { name: siteName, services: [] };
                        servicesBySite[siteId].services.push(service);
                    });
                    
                    return Object.values(servicesBySite).map(siteData => `
                        <div style="margin: 30px 0; padding: 15px 0;">
                            <h3 style="color: #1a365d; font-size: 16px; margin-bottom: 20px; font-weight: 600;">
                                  Site : ${siteData.name}
                            </h3>
                            
                            ${siteData.services.map(service => {
    // DEBUG: Logs détaillés pour chaque service
    const debugInfo = `
=== DEBUG DESCRIPTION SERVICE ===
Service Type: ${service.prestationType}
Classic Check: ${service.prestationType === 'classic'}
PrestationId Present: ${!!service.prestationId}
PrestationId Description: ${service.prestationId ? service.prestationId.description : 'ABSENT'}
SiteTariffId Present: ${!!service.siteTariffId}
SiteTariffId Prestation Present: ${!!(service.siteTariffId && service.siteTariffId.prestation)}
SiteTariffId Description: ${service.siteTariffId && service.siteTariffId.prestation ? service.siteTariffId.prestation.description : 'ABSENT'}
Condition Classic: ${service.prestationType === 'classic' ? (service.prestationId && service.prestationId.description) : 'N/A'}
Condition SiteSpecific: ${service.prestationType !== 'classic' ? (service.siteTariffId && service.siteTariffId.prestation && service.siteTariffId.prestation.description) : 'N/A'}
Final Condition: ${(service.prestationType === 'classic' ? (service.prestationId && service.prestationId.description) : (service.siteTariffId && service.siteTariffId.prestation && service.siteTariffId.prestation.description))}
=== FIN DEBUG DESCRIPTION ===
`;
    
    return `
        <div style="margin: 20px 0; padding: 10px 0; page-break-inside: avoid;">
            <div style="font-weight: 600; color: #1a365d; margin-bottom: 15px; font-size: 12px;">
                ✓ ${service.prestationType === 'classic' ? 
                    (service.prestationId && service.prestationId.name || 'Prestation non définie') : 
                    (service.siteTariffId && service.siteTariffId.prestation && service.siteTariffId.prestation.name || 'Prestation non définie')}
            </div>
            
            ${(service.prestationType === 'classic' ? 
                (service.prestationId && service.prestationId.description) : 
                (service.siteTariffId && service.siteTariffId.prestation && service.siteTariffId.prestation.description)) ? `
                <div style="margin-top: 15px; padding: 10px 0; page-break-inside: avoid;">
                    <div style="font-size: 12px; color: #4a5568; line-height: 1.5;">${service.prestationType === 'classic' ? 
                        service.prestationId.description : 
                        service.siteTariffId.prestation.description}</div>
                </div>
            ` : '<div style="margin-top: 15px; padding: 10px 0; color: #856404; font-size: 12px; page-break-inside: avoid;">Aucune description disponible</div>'}
            
            <!-- DEBUG INFO (caché) -->
            <div style="display: none;">${debugInfo}</div>
        </div>
    `;
}).join('')}
                        </div>
                    `).join('');
                })() : 
                '<p>Aucun service défini</p>'
            }
            
            <h2 style="background: linear-gradient(90deg, #1a365d 0%, #2d3748 100%); color: white; padding: 8px 15px; margin: 25px 0 15px 0; border-radius: 5px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">2. Conditions financières</h2>
            <p style="font-size: 12px;">La présente prestation fait l'objet d'une facturation basée sur les tarifs suivants :</p>
            
            ${model.services && model.services.length ? 
                (() => {
                    const servicesBySite = {};
                    
                    // DEBUG: Logs détaillés pour le regroupement par site
                    let debugRegroupement = `
=== DEBUG REGROUPEMENT CONDITIONS FINANCIÈRES ===
Nombre total de services: ${model.services.length}
`;
                    
                    model.services.forEach((service, index) => {
                        let siteId, siteName;
                        if (service.prestationType === 'classic') {
                            siteId = service.site && service.site._id || 'unknown';
                            siteName = service.site && service.site.name || 'Site non défini';
                        } else if (service.prestationType === 'site_specific') {
                            siteId = service.siteTariffId && service.siteTariffId.site && service.siteTariffId.site._id || 'unknown';
                            siteName = service.siteTariffId && service.siteTariffId.site && service.siteTariffId.site.name || 'Site non défini';
                        } else {
                            siteId = 'unknown';
                            siteName = 'Type inconnu';
                        }
                        
                        debugRegroupement += `
Service ${index}:
- Type: ${service.prestationType}
- Site ID: ${siteId}
- Site Name: ${siteName}
- Prestation: ${service.prestationType === 'classic' ? 
    (service.prestationId && service.prestationId.name || 'N/A') : 
    (service.siteTariffId && service.siteTariffId.prestation && service.siteTariffId.prestation.name || 'N/A')}
`;
                        
                        if (!servicesBySite[siteId]) servicesBySite[siteId] = { name: siteName, services: [] };
                        servicesBySite[siteId].services.push(service);
                    });
                    
                    debugRegroupement += `
=== SITES FINAUX ===
Nombre de sites: ${Object.keys(servicesBySite).length}
`;
                    
                    Object.keys(servicesBySite).forEach(siteId => {
                        const siteData = servicesBySite[siteId];
                        debugRegroupement += `
Site ID: ${siteId}
Site Name: ${siteData.name}
Nombre de services: ${siteData.services.length}
`;
                    });
                    
                    debugRegroupement += `=== FIN DEBUG REGROUPEMENT ===
`;
                    
                    return `
                        <!-- DEBUG INFO (caché) -->
                        <div style="display: none;">${debugRegroupement}</div>
                        
                        ${Object.values(servicesBySite).map(siteData => `
                            <div style="margin: 30px 0; padding: 15px 0;">
                                <h3 style="color: #1a365d; font-size: 16px; margin-bottom: 20px; font-weight: 600;">
                                      Site : ${siteData.name}
                                </h3>
                                
                                ${siteData.services.map(service => `
                                    <div style="margin: 20px 0; padding: 10px 0; page-break-inside: avoid;">
                                        <div style="font-weight: 600; color: #1a365d; margin-bottom: 15px; font-size: 12px;">
                                            ✓ ${service.prestationType === 'classic' ? 
                                                (service.prestationId && service.prestationId.name || 'Prestation non définie') : 
                                                (service.siteTariffId && service.siteTariffId.prestation && service.siteTariffId.prestation.name || 'Prestation non définie')}
                                        </div>
                                        
                                        <div style="margin: 20px 0; page-break-inside: avoid;">
                                            <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                                                <thead>
                                                    <tr style="background: #f8fafc;">
                                                        <th style="padding: 12px; text-align: left; font-size: 10px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Tarif journalier unitaire</th>
                                                        <th style="padding: 12px; text-align: center; font-size: 10px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Nombre d'agents</th>
                                                        <th style="padding: 12px; text-align: right; font-size: 10px; color: #64748b; font-weight: 600; border-bottom: 2px solid #e2e8f0;">Total journalier</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td style="padding: 12px; font-size: 11px; color: #1a365d; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${formatXAF(service.dailyRate)}</td>
                                                        <td style="padding: 12px; text-align: center; font-size: 11px; color: #1a365d; font-weight: 600; border-bottom: 1px solid #f1f5f9;">${service.numberOfAgents || 1}</td>
                                                        <td style="padding: 12px; text-align: right; font-size: 11px; color: #1a365d; font-weight: 700; border-bottom: 1px solid #f1f5f9;">${formatXAF(service.dailyRate * (service.numberOfAgents || 1))}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `).join('')}
                    `;
                })() : 
                '<p>Aucun service défini</p>'
            }
            
            <p style="font-size: 12px;">La facturation interviendra mensuellement, sur la base du nombre de jours effectivement prestés au cours de la période contractuelle définie, conformément aux termes du présent contrat.</p>
            
            <h2 style="background: linear-gradient(90deg, #1a365d 0%, #2d3748 100%); color: white; padding: 8px 15px; margin: 25px 0 15px 0; border-radius: 5px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">3. Durée du contrat</h2>
            <p style="font-size: 12px;">Le présent contrat est établi pour une durée allant du <strong>${dateFormat(model.startDate)}</strong> au <strong>${dateFormat(model.endDate)}</strong>, à compter de la date de signature des deux parties. Il sera reconduit tacitement sauf dénonciation par l'une des parties au moins 30 jours avant son terme.</p>
            
            <h2 style="background: linear-gradient(90deg, #1a365d 0%, #2d3748 100%); color: white; padding: 8px 15px; margin: 25px 0 15px 0; border-radius: 5px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">4. Obligations du Prestataire</h2>
            <p style="font-size: 12px;"><strong>${settings.company_name}</strong> s'engage à fournir des agents de sécurité qualifiés, certifiés, et dotés de l'équipement nécessaire à la bonne exécution des prestations. Les agents assureront leur présence sur le site selon les horaires convenus, et veilleront activement à la sécurité des biens et des personnes. Le Prestataire s'engage à remettre un rapport mensuel détaillant les interventions, actions et incidents éventuels survenus durant la période de service. En cas de manquement à ses obligations (telle que l'absence d'un agent ou la défaillance d'un équipement), <strong>${settings.company_name}</strong> prendra les mesures correctives nécessaires.</p>
            
            <h2 style="background: linear-gradient(90deg, #1a365d 0%, #2d3748 100%); color: white; padding: 8px 15px; margin: 25px 0 15px 0; border-radius: 5px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">5. Obligations du client</h2>
            <p style="font-size: 12px;">Le Client fournira à <strong>${settings.company_name}</strong> l'accès complet et sécurisé à toutes les zones devant être surveillées. Le Client mettra en place les infrastructures nécessaires à la sécurité des agents (sanitaires, points d'eau, etc.). Le Client s'engage à effectuer les paiements dans les délais impartis.</p>
            
            <h2 style="background: linear-gradient(90deg, #1a365d 0%, #2d3748 100%); color: white; padding: 8px 15px; margin: 25px 0 15px 0; border-radius: 5px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">6. Résiliation du contrat</h2>
            <p style="font-size: 12px;">Le Client peut résilier le contrat à tout moment avec un préavis de 30 jours par écrit, sans pénalité, sauf en cas de violation des termes du contrat.</p>
            <p style="font-size: 12px;"><strong>${settings.company_name}</strong> peut résilier ce contrat en cas de non-paiement par le Client ou en cas de comportement non professionnel du Client, après une mise en demeure de 30 jours.</p>
            
            <h2 style="background: linear-gradient(90deg, #1a365d 0%, #2d3748 100%); color: white; padding: 8px 15px; margin: 25px 0 15px 0; border-radius: 5px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">7. Confidentialité</h2>
            <p style="font-size: 12px;"><strong>${settings.company_name}</strong> et <strong>${model.client ? model.client.name : 'Le Client'}</strong> s'engagent à maintenir la confidentialité de toutes les informations sensibles échangées durant la durée du contrat, notamment les informations relatives à la sécurité, aux employés et à l'activité de l'entreprise.</p>
            
            <div style="background: linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%); padding: 25px; border-radius: 8px; margin: 30px 0; border: 1px solid #e2e8f0; page-break-inside: avoid;">
                <h2 style="background: linear-gradient(90deg, #1a365d 0%, #2d3748 100%); color: white; padding: 8px 15px; margin: 25px 0 15px 0; border-radius: 5px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Signature des parties</h2>
                <p style="font-size: 12px;">Fait à Libreville, le ${moment().format('DD/MM/YYYY')}.</p>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 20px;">
                    <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <div style="font-weight: 700; color: #1a365d; margin-bottom: 15px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">POUR LE CLIENT</div>
                        <div style="margin-bottom: 15px; font-size: 12px; color: #4a5568; line-height: 1.4;">
                            ${model.client ? model.client.name : 'Le Client'}<br>
                            Représenté par : ${model.representativeName || 'Le Représentant'}
                        </div>
                        <div style="width: 180px; height: 60px; border: 2px dashed #cbd5e0; margin: 15px auto; border-radius: 4px; background: #f7fafc; display: flex; align-items: center; justify-content: center; color: #a0aec0; font-size: 8px;">Signature</div>
                        <div style="font-size: 12px; color: #718096; line-height: 1.3;">
                            (Signature précédée de la mention "Lu et approuvé")<br>
                            Le : ${moment().format('DD/MM/YYYY')}
                        </div>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <div style="font-weight: 700; color: #1a365d; margin-bottom: 15px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">POUR ${settings.company_name}</div>
                        <div style="margin-bottom: 15px; font-size: 12px; color: #4a5568; line-height: 1.4;">
                            Direction Générale de la Sécurité<br>
                            Représenté par : Le Directeur Général
                        </div>
                        <div style="width: 180px; height: 60px; border: 2px dashed #cbd5e0; margin: 15px auto; border-radius: 4px; background: #f7fafc; display: flex; align-items: center; justify-content: center; color: #a0aec0; font-size: 8px;">Signature</div>
                        <div style="font-size: 12px; color: #718096; line-height: 1.3;">
                            (Signature et cachet)<br>
                            Le : ${moment().format('DD/MM/YYYY')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Espace minimal avant le footer -->
    <div style="height: 30px; margin-bottom: 50px;"></div>
</div>
</div>

</body>
</html>`;
};

// Fonction principale de génération PDF avec Puppeteer
exports.generateContractPdfWithPuppeteer = async (contractData, targetLocation) => {
  let browser;
  
  try {
    console.log('🚨 DÉBUT GÉNÉRATION PUPPETEER - Étape 1: Lancement du navigateur');
    
    // Lancer le navigateur Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('✅ Navigateur lancé - Étape 2: Création de la page');
    
    // Créer une nouvelle page
    const page = await browser.newPage();
    
    console.log('✅ Page créée - Étape 3: Configuration de la page');
    
    // Configurer la page
    await page.setViewport({ width: 1200, height: 800 });
    
    console.log('✅ Page configurée - Étape 4: Chargement des paramètres');
    
    // Charger les paramètres de l'application AVANT de générer le HTML
    const settings = await loadSettings();
    
    console.log('✅ Paramètres chargés - Étape 5: Préparation des helpers');
    
    // Préparer les helpers
    const moneyHelper = useMoney({
      settings: {
        currency_symbol: 'XAF',  // Au lieu de '€'
        currency_position: 'after',  // Après le montant
        decimal_sep: ',',  // Virgule pour les décimales
        thousand_sep: ' ',  // Espace pour les milliers
        cent_precision: 2,  // 2 décimales
        zero_format: false,
      },
    });

    const helpers = {
      dateFormat: (date) => {
        if (!date) return '';
        return moment(date).format(settings.date_format || 'DD/MM/YYYY');
      },
      moneyFormatter: moneyHelper.moneyFormatter,
      translate,
      moment
    };
    
    console.log('✅ Helpers préparés - Étape 6: Génération du contenu HTML');
    
    // Encoder l'image en base64
    const logoPath = path.join(__dirname, '../../public/uploads/setting/company-logo.png');
    let logoBase64 = '';
    let logoDebugInfo = '';

    try {
        logoDebugInfo += ` Chemin du logo: ${logoPath}\n`;
        logoDebugInfo += `🔍 Vérification existence fichier...\n`;
        
        if (fs.existsSync(logoPath)) {
            logoDebugInfo += `📍 Fichier logo trouvé\n`;
            logoBase64 = fs.readFileSync(logoPath, 'base64');
            logoDebugInfo += `📍 Logo encodé en base64: ${logoBase64.length} caractères\n`;
            logoDebugInfo += `🔍 Début base64: ${logoBase64.substring(0, 50)}...\n`;
        } else {
            logoDebugInfo += `❌ Fichier logo non trouvé à: ${logoPath}\n`;
        }
    } catch (error) {
        logoDebugInfo += `❌ Erreur lecture logo: ${error.message}\n`;
        logoDebugInfo += `❌ Stack trace: ${error.stack}\n`;
    }

    // Préparer le contenu HTML avec TOUS les paramètres
    const htmlContent = generateContractHTML(contractData, settings, helpers, logoBase64);
    
    console.log('✅ HTML préparé - Étape 7: Définition du contenu de la page');
    
    // Définir le contenu de la page avec un timeout plus court
    try {
      // Vérifier que setContent est disponible
      if (typeof page.setContent !== 'function') {
        throw new Error('page.setContent n\'est pas disponible dans cette version de Puppeteer');
      }
      
      await page.setContent(htmlContent, { 
        waitUntil: 'domcontentloaded', // Plus rapide que 'networkidle0'
        timeout: 10000 // 10 secondes au lieu de 30
      });
      console.log('✅ Contenu défini - Étape 8: Génération du PDF');
      
      // DEBUG MASSIF: Vérifier le positionnement du footer
      console.log(' DEBUG MASSIF - Vérification complète du positionnement...');
      
      // Vérifier les dimensions de la page
      const pageDimensions = await page.evaluate(() => {
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          documentHeight: document.body.scrollHeight,
          documentWidth: document.body.scrollWidth,
          screenWidth: screen.width,
          screenHeight: screen.height,
          devicePixelRatio: window.devicePixelRatio,
          scrollTop: window.pageYOffset,
          scrollLeft: window.pageXOffset
        };
      });
      console.log('📏 Dimensions complètes de la page:', pageDimensions);
      
      // Vérifier TOUS les footers
      const allFooters = await page.evaluate(() => {
        const footers = document.querySelectorAll('div[style*="page-break-inside: avoid"]');
        const footerData = [];
        footers.forEach((footer, index) => {
          const rect = footer.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(footer);
          footerData.push({
            index: index,
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
            height: rect.height,
            visible: rect.top >= 0 && rect.bottom <= window.innerHeight,
            position: computedStyle.position,
            display: computedStyle.display,
            zIndex: computedStyle.zIndex,
            backgroundColor: computedStyle.backgroundColor,
            color: computedStyle.color,
            fontSize: computedStyle.fontSize,
            textAlign: computedStyle.textAlign,
            padding: computedStyle.padding,
            margin: computedStyle.margin,
            border: computedStyle.border,
            boxSizing: computedStyle.boxSizing,
            overflow: computedStyle.overflow,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity
          });
        });
        return footerData;
      });
      console.log(' Tous les footers détectés:', allFooters);
      
      // Vérifier la position de CHAQUE ligne du footer
      const footerLines = await page.evaluate(() => {
        const footer = document.querySelector('div[style*="page-break-inside: avoid"]');
        if (footer) {
          const lines = footer.querySelectorAll('div');
          return Array.from(lines).map((line, index) => {
            const rect = line.getBoundingClientRect();
            return {
              lineNumber: index + 1,
              text: line.textContent.substring(0, 50) + '...',
              top: rect.top,
              bottom: rect.bottom,
              height: rect.height,
              left: rect.left,
              right: rect.right,
              width: rect.width
            };
          });
        }
        return [];
      });
      console.log('📝 Position des 3 lignes du footer:', footerLines);
      
      // DEBUG: Vérifier le logo
      const logoInfo = await page.evaluate(() => {
        const logo = document.querySelector('img[alt="Logo"]');
        if (logo) {
          const rect = logo.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(logo);
          return {
            found: true,
            src: logo.src,
            alt: logo.alt,
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            visible: rect.width > 0 && rect.height > 0,
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            naturalWidth: logo.naturalWidth,
            naturalHeight: logo.naturalHeight,
            complete: logo.complete,
            loading: logo.loading,
            error: logo.error ? logo.error.message : null
          };
        }
        return { found: false };
      });
      
      // Vérifier le nombre de pages
      const pageCount = await page.evaluate(() => {
        const pages = document.querySelectorAll('[style*="page-break"]');
        return pages.length;
      });
      
      // Enregistrer les logs de debug MASSIFS dans le fichier
      const debugLogs = `
=== DEBUG PUPPETEER MASSIF - ${new Date().toISOString()} ===
${logoDebugInfo}

=== DEBUG COMPARAISON MODEL vs CONTRACTDATA ===
Model services: ${contractData.services ? contractData.services.length : 'UNDEFINED'}
ContractData services: ${contractData.services ? contractData.services.length : 'UNDEFINED'}

Model services details:
${contractData.services ? contractData.services.map((s, i) => `
Service ${i}: ${s.prestationType} - Site: ${s.site ? s.site.name : 'N/A'} - Prestation: ${s.prestationType === 'classic' ? (s.prestationId ? s.prestationId.name : 'N/A') : 'N/A'}
`).join('') : 'CONTRACTDATA SERVICES UNDEFINED'}

ContractData services details:
${contractData.services ? contractData.services.map((s, i) => `
Service ${i}: ${s.prestationType} - Site: ${s.site ? s.site.name : 'N/A'} - Prestation: ${s.prestationType === 'classic' ? (s.prestationId ? s.prestationId.name : 'N/A') : 'N/A'}
`).join('') : 'CONTRACTDATA SERVICES UNDEFINED'}
=== FIN COMPARAISON ===

=== DEBUG REGROUPEMENT CONDITIONS FINANCIÈRES ===
${contractData.services && contractData.services.length ? (() => {
    const servicesBySite = {};
    let debugRegroupement = `
Nombre total de services: ${contractData.services.length}
`;
    
    contractData.services.forEach((service, index) => {
        let siteId, siteName;
        if (service.prestationType === 'classic') {
            siteId = service.site && service.site._id || 'unknown';
            siteName = service.site && service.site.name || 'Site non défini';
        } else if (service.prestationType === 'site_specific') {
            siteId = service.siteTariffId && service.siteTariffId.site && service.siteTariffId.site._id || 'unknown';
            siteName = service.siteTariffId && service.siteTariffId.site && service.siteTariffId.site.name || 'Site non défini';
        } else {
            siteId = 'unknown';
            siteName = 'Type inconnu';
        }
        
        debugRegroupement += `
Service ${index}:
- Type: ${service.prestationType}
- Site ID: ${siteId}
- Site Name: ${siteName}
- Prestation: ${service.prestationType === 'classic' ? 
    (service.prestationId && service.prestationId.name || 'N/A') : 
    (service.siteTariffId && service.siteTariffId.prestation && service.siteTariffId.prestation.name || 'N/A')}
`;
        
        if (!servicesBySite[siteId]) servicesBySite[siteId] = { name: siteName, services: [] };
        servicesBySite[siteId].services.push(service);
    });
    
    debugRegroupement += `
=== SITES FINAUX CONDITIONS FINANCIÈRES ===
Nombre de sites: ${Object.keys(servicesBySite).length}
`;
    
    Object.keys(servicesBySite).forEach(siteId => {
        const siteData = servicesBySite[siteId];
        debugRegroupement += `
Site ID: ${siteId}
Site Name: ${siteData.name}
Nombre de services: ${siteData.services.length}
Services détaillés:
${siteData.services.map((s, idx) => `
  Service ${idx}:
  - Type: ${s.prestationType}
  - Prestation: ${s.prestationType === 'classic' ? 
      (s.prestationId && s.prestationId.name || 'N/A') : 
      (s.siteTariffId && s.siteTariffId.prestation && s.siteTariffId.prestation.name || 'N/A')}
  - Tarif: ${s.dailyRate || 'NON DÉFINI'}
  - Agents: ${s.numberOfAgents || 'NON DÉFINI'}
`).join('')}
`;
    });
    
    return debugRegroupement;
})() : 'AUCUN SERVICE DANS CONTRACTDATA.SERVICES'}

Dimensions complètes de la page: ${JSON.stringify(pageDimensions, null, 2)}
Tous les footers détectés: ${JSON.stringify(allFooters, null, 2)}
Position des 3 lignes du footer: ${JSON.stringify(footerLines, null, 2)}
Informations du logo: ${JSON.stringify(logoInfo, null, 2)}
Nombre de pages: ${pageCount}
Contenu HTML généré: ${htmlContent.length} caractères

=== PROTECTION DES ZONES APPLIQUÉE ===
✅ Zones de services par site: page-break-inside: avoid
✅ Zones de tarifs par site: page-break-inside: avoid  
✅ Sections 3,4,5,6,7: page-break-before: avoid
✅ Zone de signature: page-break-inside: avoid
✅ Espace réservé footer: margin-bottom: 100px

=== DEBUG LOGO ===
URL du logo: https://www.crmiracle.net/public/uploads/setting/company-logo.png
Logo trouvé: ${logoInfo.found}
Logo visible: ${logoInfo.visible}
Logo chargé: ${logoInfo.complete}
Erreur logo: ${logoInfo.error || 'Aucune'}
Dimensions logo: ${logoInfo.width}x${logoInfo.height}
Position logo: top=${logoInfo.top}, left=${logoInfo.left}
=== FIN DEBUG MASSIF ===
`;
      saveLogsToFile(debugLogs, 'toto');
      
    } catch (setContentError) {
      console.error('🚨 ERREUR lors de setContent:', setContentError.message);
      throw setContentError; // Arrêter ici, ne pas continuer
    }
    
    // Vérifier que la page est toujours valide avant de continuer
    if (!page || typeof page.isClosed === 'function' && page.isClosed()) {
      throw new Error('Page fermée ou invalide après setContent');
    }
    
    // Vérifier que page.pdf est disponible
    if (typeof page.pdf !== 'function') {
      throw new Error('page.pdf n\'est pas disponible dans cette version de Puppeteer');
    }
    
    // Générer le PDF avec footer natif
    try {
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>', // Header vide pour supprimer la date
        footerTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 9px; color: #1a365d; text-align: center; width: 100%; padding: 10px 0; opacity: 0.9; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased;">
            <div style="margin: 3px 0; font-weight: 600; line-height: 1.3;">DACLIN GUARDIAN SECURITY. SARL AU CAPITAL DE 2 000 000 FCFA. SIEGE SOCIAL CENTRE-VILLE (FEU ROUGE CENTRE MEDICO) 2641 LIBREVILLE</div>
            <div style="margin: 3px 0; font-weight: 600; line-height: 1.3;">NUMERO RCCM : GA-LBV 01 2021 B1 00297 – NIF XXXXXXXXX</div>
            <div style="margin: 3px 0; font-weight: 600; line-height: 1.3;">CONTACTS : 077131056 / 011760203 / 074808781 – DIRECTION@DGS-GABON.COM – WWW.DGS-GABON.COM</div>
          </div>
        `,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '25mm', // Plus d'espace pour éviter le chevauchement
          left: '10mm'
        }
      });
      
      console.log('✅ PDF généré avec succès:', pdfBuffer.length, 'bytes');
      
      // Sauvegarder le PDF
      fs.writeFileSync(targetLocation, pdfBuffer);
      
      console.log(`✅ PDF sauvegardé: ${targetLocation}`);
      return true;
      
    } catch (pdfError) {
      console.error('🚨 ERREUR lors de la génération PDF:', pdfError.message);
      throw pdfError;
    }
    
  } catch (outerError) {
    console.log('🚨 ERREUR EXTERNE CAPTURÉE:', outerError.message);
    console.log('🚨 STACK TRACE:', outerError.stack);
    console.log('🚨 Le code s\'arrête à cause de cette erreur !');
    throw outerError; // Relancer l'erreur pour qu'elle soit gérée par l'appelant
  } finally {
    // Fermer le navigateur proprement
    if (browser) {
      try {
        await browser.close();
        console.log('✅ Navigateur fermé proprement');
      } catch (closeError) {
        console.error('⚠️ Erreur lors de la fermeture du navigateur:', closeError.message);
      }
    }
  }
};

// Fonction principale qui utilise UNIQUEMENT Puppeteer
exports.generateContractPdf = async (contractData, targetLocation) => {
  try {
    // Utiliser UNIQUEMENT Puppeteer
    console.log('🚨 GÉNÉRATION PDF AVEC PUPPETEER UNIQUEMENT - Pas de fallback !');
    console.log('📊 Données du contrat reçues:', {
      services: contractData.services ? contractData.services.length : 0,
      client: contractData.client ? contractData.client.name : 'Non défini',
      startDate: contractData.startDate ? new Date(contractData.startDate).toLocaleDateString() : 'Non définie'
    });
    
    console.log('🎯 Démarrage de la génération Puppeteer...');
    const result = await exports.generateContractPdfWithPuppeteer(contractData, targetLocation);
    console.log('✅ Puppeteer a réussi !');
    return result;
    
  } catch (puppeteerError) {
    console.error('🚨 ERREUR CRITIQUE AVEC PUPPETEER:');
    console.error('📝 Message d\'erreur:', puppeteerError.message);
    console.error('📚 Stack trace:', puppeteerError.stack);
    console.error('🔍 Type d\'erreur:', puppeteerError.name);
    console.error('📊 Erreur complète:', JSON.stringify(puppeteerError, null, 2));
    
    throw puppeteerError;
  }
}; 