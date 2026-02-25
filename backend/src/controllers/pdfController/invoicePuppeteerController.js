const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { loadSettings } = require('../../middlewares/settings');
const useLanguage = require('../../locale/useLanguage');

// Charger les modèles nécessaires
const Invoice = require('../../models/appModels/Invoice');
const Taxes = require('../../models/appModels/Taxes');

// Fonction pour sauvegarder les logs dans un fichier .txt
const saveLogsToFile = (logs, invoiceId) => {
    try {
        const logsDir = path.join(__dirname, '../../../logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const logFileName = `invoice_puppeteer_logs_${invoiceId}_${timestamp}.txt`;
        const logFilePath = path.join(logsDir, logFileName);
        
        fs.writeFileSync(logFilePath, logs, 'utf8');
        console.log(`Logs sauvegardés dans: ${logFilePath}`);
        console.log(`📁 Chemin complet: ${path.resolve(logFilePath)}`);
        return logFilePath;
    } catch (error) {
        console.error('❌ Erreur sauvegarde logs:', error.message);
        return null;
    }
};

// Fonction pour générer le HTML de la facture
const generateInvoiceHTML = async (invoiceData, settings, logoBase64) => {
    const translate = useLanguage('fr');
    
    // Déclarer les variables pour les taxes
    let tva = 0;
    let tps = 0;
    let css = 0;
    let taxType = 'TVA et CSS'; // Valeur par défaut

    // Fonction de formatage monétaire EXACT comme dans l'image (avec espaces)
    const formatMoney = (amount) => {
        if (typeof amount !== 'number') return '0';
        return amount.toLocaleString('fr-FR', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).replace(/,/g, ' ') + ' XAF';
    };
    
    // Calculer les détails des taxes - SIMPLIFIÉ POUR 2 CAS SEULEMENT
    let taxDetails = invoiceData.taxDetails || {};
    let taxTotal = invoiceData.taxTotal || 0;
    let subTotal = invoiceData.subTotal || 0;
    let total = invoiceData.total || 0;

    // LOGS DÉTAILLÉS POUR DEBUG
    console.log('🧮 CALCUL TAXES - Données reçues:');
    console.log('  - taxName:', invoiceData.taxName);
    console.log('  - taxRate:', invoiceData.taxRate);
    console.log('  - subTotal:', subTotal);
    console.log('  - taxDetails existant:', taxDetails);
    console.log('  - taxTotal existant:', taxTotal);
    console.log('  - total existant:', total);

    // Déterminer le type de taxe à partir du taxRate
    if (invoiceData.taxRate === 10.5) {
        taxType = 'TPS et CSS';
        tps = subTotal * 0.095;
        css = subTotal * 0.01;
    } else if (invoiceData.taxRate === 19) {
        taxType = 'TVA et CSS';
        tva = subTotal * 0.18;
        css = subTotal * 0.01;
    }
    console.log('🎯 Type de taxe déterminé:', taxType, '(basé sur taxRate:', invoiceData.taxRate, ')');

    // Si taxDetails est null, recalculer
    if (!taxDetails || Object.keys(taxDetails).length === 0) {
        console.log('🔄 Recalcul des taxes...');
        
        if (taxType === 'TVA et CSS') {
            tva = subTotal * 0.18;
            css = subTotal * 0.01;
            taxTotal = tva + css;
            taxDetails = { tva, css };
            console.log('✅ TVA et CSS calculées:', { tva, css, taxTotal });
        } else if (taxType === 'TPS et CSS') {
            tps = subTotal * 0.095;
            css = subTotal * 0.01;
            taxTotal = css - tps; // CSS - TPS (différence nette négative)
            taxDetails = { tps, css };
            console.log('✅ TPS et CSS calculées:', { tps, css, taxTotal });
        }
    }

    // Calculer le total final selon le type de taxe
    if (taxType === 'TPS et CSS') {
        total = subTotal + taxTotal; // Utiliser taxTotal calculé (CSS - TPS)
        console.log('💰 Total TPS et CSS:', total);
    } else if (taxType === 'TVA et CSS') {
        total = subTotal + taxTotal; // Utiliser taxTotal calculé (TVA + CSS)
        console.log('💰 Total TVA et CSS:', total);
    } else {
        total = subTotal + taxTotal;
        console.log('💰 Total par défaut:', total);
    }

    // LOGS FINAUX
    console.log('📊 RÉSULTAT FINAL:');
    console.log('  - TaxType utilisé:', taxType);
    console.log('  - SubTotal:', subTotal);
    console.log('  - TaxDetails:', taxDetails);
    console.log('  - TaxTotal:', taxTotal);
    console.log('  - Total final:', total);
    
    // Préparer les données des services pour la boucle {{#each PRESTATIONS}}
    let prestationsData = [];
    if (invoiceData.services && invoiceData.services.length > 0) {
        prestationsData = invoiceData.services.map((service, index) => {
            let prestationName = 'Prestation';
            
            // Gérer les deux types de services
            if (service.prestationType === 'site_specific' && service.siteTariffId?.prestation?.name) {
                prestationName = service.siteTariffId.prestation.name;
            } else if (service.prestationType === 'classic' && service.prestationId?.name) {
                prestationName = service.prestationId.name;
            } else if (service.siteTariffId?.prestation?.name) {
                // Fallback pour les anciens services
                prestationName = service.siteTariffId.prestation.name;
            } else if (service.prestationId?.name) {
                // Fallback pour les anciens services
                prestationName = service.prestationId.name;
            }
            
            const dailyRate = service.dailyRate || 0;
            const numberOfAgents = service.numberOfAgents || 0;
            const numberOfDays = service.numberOfDays || 0;
            const lineTotal = dailyRate * numberOfDays * numberOfAgents;
            
            return {
                designation: prestationName,
                mois_jours: numberOfDays,
                qte_agents: numberOfAgents,
                prix_unitaire: formatMoney(dailyRate).replace(' XAF', ''),
                montant: formatMoney(lineTotal).replace(' XAF', '')
            };
        });
    }
    
    // Log des données des prestations pour debug
    console.log('📋 DONNÉES PRESTATIONS PRÉPARÉES:');
    console.log('Nombre de prestations:', prestationsData.length);
    prestationsData.forEach((prestation, index) => {
        console.log(`Prestation ${index + 1}:`, prestation);
    });
    
    // Les détails des taxes sont maintenant gérés directement dans les placeholders du template
    
    // Lire le template HTML
    const templatePath = path.join(__dirname, 'FACTURE.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    // Remplacer les champs variables avec les bons placeholders
    htmlTemplate = htmlTemplate
        .replace(/\{\{LOGO_BASE64\}\}/g, `data:image/png;base64,${logoBase64}`)
        .replace(/\{\{INVOICE_NUMBER\}\}/g, (() => {
            const invoiceNumber = invoiceData.number;
            const invoiceYear = new Date(invoiceData.date).getFullYear();
            const yearShort = invoiceYear.toString().slice(-2); // 2 derniers chiffres
            return `N°${invoiceNumber}/${yearShort}`;
        })())
        .replace(/\{\{CLIENT_NAME\}\}/g, (() => {
            const clientName = invoiceData.client?.name || 'N/A';
            const country = invoiceData.client?.country;
            const contractStartDate = invoiceData.contract?.startDate;
            
            if (clientName === 'N/A' || !country || !contractStartDate) {
                return clientName;
            }
            
            // Si le pays est GA, ajouter /LBV/GA + 2 derniers chiffres de l'année
            if (country === 'GA') {
                const year = new Date(contractStartDate).getFullYear();
                const yearShort = year.toString().slice(-2); // 2 derniers chiffres
                return `${clientName}/LBV/GA/${yearShort}`;
            }
            
            return clientName;
        })())
        .replace(/\{\{CLIENT_ADDRESS\}\}/g, invoiceData.client?.address || 'Adresse non renseignée')
        .replace(/\{\{CLIENT_PHONE\}\}/g, (() => {
            const phone = invoiceData.client?.contacts?.[0]?.tel || 'N/A';
            if (phone === 'N/A') return phone;
            // Formater le numéro avec espace après l'indicatif (ex: +216 98738672)
            return phone.replace(/^(\+\d{3})(\d+)$/, '$1 $2');
        })())
        .replace(/\{\{DATE_RANGE\}\}/g, (() => {
            if (invoiceData.startDate && invoiceData.endDate) {
                const startDate = moment(invoiceData.startDate).format('DD');
                const endDate = moment(invoiceData.endDate).format('DD');
                const month = moment(invoiceData.startDate).locale('fr').format('MMMM').toUpperCase();
                const year = moment(invoiceData.startDate).format('YYYY');
                return `${startDate} AU ${endDate} ${month} ${year}`;
            }
            return '01 AU 31 AOUT 2025'; // Valeur par défaut
        })())
        .replace(/\{\{OBJECT\}\}/g, `OBJET : ${invoiceData.object}`)
        .replace(/\{\{SUBTOTAL_AMOUNT\}\}/g, formatMoney(subTotal).replace(' XAF', ''))
        .replace(/\{\{CSS_AMOUNT\}\}/g, formatMoney(css).replace(' XAF', ''))
        .replace(/\{\{TAX_LABEL\}\}/g, taxType === 'TVA et CSS' ? 'TVA 18%' : 'TPS-9,5%')
        .replace(/\{\{TAX_LABEL_AMOUNT\}\}/g, taxType === 'TVA et CSS' 
            ? formatMoney(tva).replace(' XAF', '') 
            : `(${formatMoney(tps).replace(' XAF', '')})`)
        .replace(/\{\{TPS_AMOUNT\}\}/g, taxType === 'TVA et CSS' 
            ? formatMoney(tva).replace(' XAF', '') 
            : `(${formatMoney(tps).replace(' XAF', '')})`)
        .replace(/\{\{TOTAL_AMOUNT\}\}/g, formatMoney(total).replace(' XAF', ''))
        // Remplacer la boucle {{#each PRESTATIONS}} par les données des services
        .replace('{{#each PRESTATIONS}}', prestationsData.map(prestation => `
    <tr>
        <td style="border-left: 1px solid #000000; border-right: 1px solid #000000" height="19" align="left" valign=middle data-sheets-value="{ &quot;1&quot;: 2, &quot;2&quot;: &quot;&quot;}"><br></td>
        <td style="border-left: 1px solid #000000; border-right: 1px solid #000000" align="left" valign=middle data-sheets-value="{ &quot;1&quot;: 2, &quot;2&quot;: &quot;${prestation.designation}&quot;}">${prestation.designation}</td>
        <td align="right" valign=middle data-sheets-value="{ &quot;1&quot;: 2, &quot;2&quot;: &quot;${prestation.mois_jours}&quot;}">${prestation.mois_jours}</td>
        <td style="border-left: 1px solid #000000; border-right: 1px solid #000000" align="right" valign=middle data-sheets-value="{ &quot;1&quot;: 2, &quot;2&quot;: &quot;${prestation.qte_agents}&quot;}">${prestation.qte_agents}</td>
        <td style="border-left: 1px solid #000000" align="right" valign=middle data-sheets-value="{ &quot;1&quot;: 2, &quot;2&quot;: &quot;${prestation.prix_unitaire}&quot;}">${prestation.prix_unitaire}</td>
        <td style="border-left: 1px solid #000000; border-right: 1px solid #000000" align="right" valign=middle data-sheets-value="{ &quot;1&quot;: 2, &quot;2&quot;: &quot;${prestation.montant}&quot;}">${prestation.montant}</td>
    </tr>
        `).join(''))
        .replace('{{/each}}', `
    <tr>
        <td style="border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000" height="19" align="left" valign=middle data-sheets-value="{ &quot;1&quot;: 2, &quot;2&quot;: &quot;&quot;}"><br></td>
        <td style="border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000" align="left" valign=middle data-sheets-value="{ &quot;1&quot;: 2, &quot;2&quot;: &quot;&quot;}"><br></td>
        <td style="border-bottom: 1px solid #000000" align="left" valign=middle data-sheets-value="{ &quot;1&quot;: 2, &quot;2&quot;: &quot;&quot;}"><br></td>
        <td style="border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000" align="left" valign=middle data-sheets-value="{ &quot;1&quot;: 2, &quot;2&quot;: &quot;&quot;}"><br></td>
        <td style="border-bottom: 1px solid #000000; border-left: 1px solid #000000" align="left" valign=middle data-sheets-value="{ &quot;1&quot;: 2, &quot;2&quot;: &quot;&quot;}"><br></td>
        <td style="border-bottom: 1px solid #000000; border-left: 1px solid #000000; border-right: 1px solid #000000" align="right" valign=middle data-sheets-value="{ &quot;1&quot;: 2, &quot;2&quot;: &quot;&quot;}"><br></td>
    </tr>`)
        // Remplacer les placeholders individuels restants par des valeurs vides
        .replace(/\{\{order_number\}\}/g, '')
        .replace(/\{\{designation\}\}/g, '')
        .replace(/\{\{mois_jours\}\}/g, '')
        .replace(/\{\{qte_agents\}\}/g, '')
        .replace(/\{\{prix_unitaire\}\}/g, '')
        .replace(/\{\{montant\}\}/g, '');
    
    return htmlTemplate;
};

// Fonction principale pour générer le PDF de facture
const generateInvoicePDF = async (req, res) => {
    let debugLogs = '';
    let invoiceId = 'unknown';
    
    try {
        console.log('🚨 DÉBUT GÉNÉRATION PDF FACTURE - Étape 1: Analyse des données reçues');
        
        // Logs détaillés des données reçues
        debugLogs += '=== DÉBUT GÉNÉRATION PDF FACTURE ===\n';
        debugLogs += `Timestamp: ${moment().format('YYYY-MM-DD HH:mm:ss')}\n\n`;
        
        // Analyser req.params
        debugLogs += '--- REQ.PARAMS ---\n';
        debugLogs += `req.params: ${JSON.stringify(req.params, null, 2)}\n`;
        if (req.params && req.params.id) {
            invoiceId = req.params.id;
            debugLogs += `ID facture trouvé: ${invoiceId}\n`;
        } else {
            debugLogs += '❌ Aucun ID trouvé dans req.params\n';
        }
        
        // Analyser req.query
        debugLogs += '\n--- REQ.QUERY ---\n';
        debugLogs += `req.query: ${JSON.stringify(req.query, null, 2)}\n`;
        
        // Analyser req.body
        debugLogs += '\n--- REQ.BODY ---\n';
        debugLogs += `req.body: ${JSON.stringify(req.body, null, 2)}\n`;
        
        // Analyser req.invoiceData (si existe)
        debugLogs += '\n--- REQ.INVOICEDATA ---\n';
        debugLogs += `req.invoiceData: ${JSON.stringify(req.invoiceData, null, 2)}\n`;
        
        // Analyser req (structure complète)
        debugLogs += '\n--- REQ STRUCTURE ---\n';
        debugLogs += `req keys: ${Object.keys(req).join(', ')}\n`;
        debugLogs += `req.method: ${req.method}\n`;
        debugLogs += `req.url: ${req.url}\n`;
        
        console.log('📊 Données reçues analysées');
        
        // Essayer de récupérer les données de facture de différentes sources
        let invoice = null;
        
        // Source 1: req.body.invoiceData
        if (req.body && req.body.invoiceData) {
            invoice = req.body.invoiceData;
            debugLogs += '\n✅ Données trouvées dans req.body.invoiceData\n';
        }
        // Source 2: req.invoiceData
        else if (req.invoiceData) {
            invoice = req.invoiceData;
            debugLogs += '\n✅ Données trouvées dans req.invoiceData\n';
        }
        // Source 3: req.body (si c'est directement la facture)
        else if (req.body && req.body._id) {
            invoice = req.body;
            debugLogs += '\n✅ Données trouvées directement dans req.body\n';
        }
        // Source 4: Fallback - récupérer depuis la DB
        else {
            debugLogs += '\n⚠️ Aucune donnée trouvée, tentative de récupération depuis la DB\n';
            if (invoiceId && invoiceId !== 'unknown') {
                invoice = await Invoice.findOne({ _id: invoiceId, removed: false })
                    .populate('client')
                    .populate('contract')
                    .populate({
                        path: 'services.siteTariffId',
                        populate: {
                            path: 'prestation',
                            model: 'Prestation'
                        }
                    })
                    .exec();
                
                if (invoice) {
                    debugLogs += '✅ Données récupérées depuis la DB avec populate\n';
                } else {
                    debugLogs += '❌ Aucune facture trouvée dans la DB\n';
                }
            }
        }
        
        // Logs des données de facture trouvées
        debugLogs += '\n--- DONNÉES FACTURE TROUVÉES ---\n';
        if (invoice) {
            debugLogs += `Facture ID: ${invoice._id}\n`;
            debugLogs += `Numéro: ${invoice.number}\n`;
            debugLogs += `Date: ${invoice.date}\n`;
            debugLogs += `Client country: ${invoice.client.country}\n`;
            debugLogs += `Client contacts: ${invoice.client.contacts}\n`;
            debugLogs += `Client: ${invoice.client ? invoice.client.name : 'Non défini'}\n`;
            debugLogs += `Contract date: ${invoice.contract ? invoice.contract.startDate : 'Non défini'}\n`;
            debugLogs += `Services: ${invoice.services ? invoice.services.length : 0}\n`;
            debugLogs += `SubTotal: ${invoice.subTotal}\n`;
            debugLogs += `Total: ${invoice.total}\n`;
            debugLogs += `TaxName: ${invoice.taxName}\n`;
            debugLogs += `TaxRate: ${invoice.taxRate}\n`;
            debugLogs += `TaxDetails: ${JSON.stringify(invoice.taxDetails)}\n`;
            debugLogs += `TaxTotal: ${invoice.taxTotal}\n`;
            
            // Détails des services
            if (invoice.services && invoice.services.length > 0) {
                debugLogs += '\n--- DÉTAILS SERVICES ---\n';
                invoice.services.forEach((service, index) => {
                    debugLogs += `Service ${index + 1}:\n`;
                    debugLogs += `  - Type: ${service.prestationType || 'legacy'}\n`;
                    
                    // Gérer les deux types de services pour l'affichage
                    if (service.prestationType === 'site_specific') {
                    debugLogs += `  - Prestation: ${service.siteTariffId?.prestation?.name || 'Non défini'}\n`;
                    } else if (service.prestationType === 'classic') {
                        debugLogs += `  - Prestation: ${service.prestationId?.name || 'Non défini'}\n`;
                    } else {
                        // Fallback pour les anciens services
                        debugLogs += `  - Prestation: ${service.siteTariffId?.prestation?.name || service.prestationId?.name || 'Non défini'}\n`;
                    }
                    
                    debugLogs += `  - DailyRate: ${service.dailyRate}\n`;
                    debugLogs += `  - NumberOfAgents: ${service.numberOfAgents}\n`;
                    debugLogs += `  - NumberOfDays: ${service.numberOfDays}\n`;
                    debugLogs += `  - Total: ${service.total}\n`;
                });
            }
        } else {
            debugLogs += '❌ AUCUNE DONNÉE DE FACTURE TROUVÉE\n';
        }
        
        if (!invoice) {
            debugLogs += '\n❌ ERREUR: Aucune donnée de facture disponible\n';
            saveLogsToFile(debugLogs, invoiceId);
            return res.status(404).json({
                success: false,
                message: 'Données de facture non trouvées'
            });
        }
        
        console.log('✅ Données de facture validées');
        
        // Charger les paramètres (optionnel pour le moment)
        let settings = {};
        try {
            settings = await loadSettings();
            debugLogs += '\n✅ Paramètres chargés\n';
        } catch (error) {
            console.log('Settings non disponibles, utilisation des valeurs par défaut');
            debugLogs += `\n⚠️ Settings non disponibles: ${error.message}\n`;
            settings = {
                company_name: 'DGS Gabon',
                company_address: 'Feu rouge centre médico centre ville',
                company_phone: '+241 11 76 02 03/77 13 10 56',
                company_email: 'secretariat@dgs-gabon.com'
            };
        }
        
        // Charger le logo comme dans le contrat PDF
        let logoBase64 = '';
        try {
            // Essayer d'abord le chemin du contrat PDF
            const logoPath = path.join(__dirname, '../../public/uploads/setting/company-logo.png');
            if (fs.existsSync(logoPath)) {
                logoBase64 = fs.readFileSync(logoPath, 'base64');
                debugLogs += '\n✅ Logo chargé depuis company-logo.png\n';
            } else {
                // Fallback vers logo.png
                const logoPath2 = path.join(__dirname, '../../../public/uploads/logo.png');
                if (fs.existsSync(logoPath2)) {
                    logoBase64 = fs.readFileSync(logoPath2, 'base64');
                    debugLogs += '\n✅ Logo chargé depuis logo.png\n';
                } else {
                    debugLogs += `\n⚠️ Aucun logo trouvé aux chemins:\n- ${logoPath}\n- ${logoPath2}\n`;
                }
            }
        } catch (error) {
            debugLogs += `\n❌ Erreur logo: ${error.message}\n`;
        }
        
        debugLogs += '\n--- DEBUG LOGO ---\n';
        debugLogs += `LogoBase64 length: ${logoBase64.length}\n`;
        debugLogs += `LogoBase64 preview: ${logoBase64.substring(0, 50)}...\n`;
        debugLogs += `LogoBase64 starts with: ${logoBase64.startsWith('data:') ? 'YES' : 'NO'}\n`;
        debugLogs += '--- FIN DEBUG LOGO ---\n';

        console.log(' Génération du HTML...');
        
        // Générer le HTML
        const html = await generateInvoiceHTML(invoice, settings, logoBase64);
        
        debugLogs += '\n✅ HTML généré\n';
        
        // Ajouter les logs de debug HTML à debugLogs
        debugLogs += '\n--- DEBUG HTML ---\n';
        debugLogs += `Template contient {{LOGO_BASE64}}: ${html.includes('{{LOGO_BASE64}}')}\n`;
        debugLogs += `Template contient data:image: ${html.includes('data:image')}\n`;
        debugLogs += `LogoBase64 starts with data: ${logoBase64.startsWith('data:')}\n`;
        debugLogs += '--- FIN DEBUG HTML ---\n';
        
        console.log('🔍 DEBUG HTML - LogoBase64 dans le template:');
        console.log('Template contient {{LOGO_BASE64}}:', html.includes('{{LOGO_BASE64}}'));
        console.log('Template contient data:image:', html.includes('data:image'));

        console.log(' Lancement de Puppeteer...');
        
        // Lancer Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        debugLogs += '\n✅ Puppeteer lancé et page chargée\n';
        
        // Générer le PDF avec marges optimisées pour tenir sur une page
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '5mm',    // Réduit de 10mm à 5mm
                right: '10mm', // Réduit de 15mm à 10mm
                bottom: '5mm', // Réduit de 10mm à 5mm
                left: '10mm'   // Réduit de 15mm à 10mm
            },
            displayHeaderFooter: false
        });
        
        await browser.close();
        
        debugLogs += '\n✅ PDF généré\n';
        
        // Sauvegarder le PDF avec le nom attendu par le handler
        const fileName = `Facture-${invoice._id}.pdf`;
        const filePath = path.join(__dirname, '../../../public/download/invoice', fileName);
        
        // Créer le dossier s'il n'existe pas
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, pdf);
        
        debugLogs += `\n✅ PDF sauvegardé: ${filePath}\n`;
        
        // Mettre à jour la facture avec le chemin du PDF
        await Invoice.findByIdAndUpdate(invoiceId, { pdf: fileName });
        
        debugLogs += '\n✅ Facture mise à jour en base\n';
        debugLogs += '\n--- VALEURS CALCULÉES POUR LE PDF ---\n';
        debugLogs += `TaxRate: ${invoice.taxRate}%\n`;
        debugLogs += `SubTotal: ${invoice.subTotal} XAF\n`;

        if (invoice.taxRate === 10.5) {
            const tps = invoice.subTotal * 0.095;
            const css = invoice.subTotal * 0.01;
            const totalCalculé = invoice.subTotal - tps + css;
            
            debugLogs += `Type: TPS et CSS\n`;
            debugLogs += `TPS (9.5%): ${tps} XAF\n`;
            debugLogs += `CSS (1%): ${css} XAF\n`;
            debugLogs += `Total calculé: ${totalCalculé} XAF\n`;
            debugLogs += `Total en base: ${invoice.total} XAF\n`;
            
        } else if (invoice.taxRate === 19) {
            const tva = invoice.subTotal * 0.18;
            const css = invoice.subTotal * 0.01;
            const totalCalculé = invoice.subTotal + tva + css;
            
            debugLogs += `Type: TVA et CSS\n`;
            debugLogs += `TVA (18%): ${tva} XAF\n`;
            debugLogs += `CSS (1%): ${css} XAF\n`;
            debugLogs += `Total calculé: ${totalCalculé} XAF\n`;
            debugLogs += `Total en base: ${invoice.total} XAF\n`;
        }

        debugLogs += '--- FIN VALEURS CALCULÉES ---\n';
        debugLogs += '\n=== FIN GÉNÉRATION PDF FACTURE ===\n';
        
        console.log(`PDF facture généré: ${filePath}`);
        
        // Sauvegarder les logs
        saveLogsToFile(debugLogs, invoiceId);
        
        return res.json({
            success: true,
            message: 'PDF généré avec succès',
            fileName: fileName,
            filePath: filePath
        });
        
    } catch (error) {
        console.error('Erreur génération PDF facture:', error);
        
        debugLogs += `\n❌ ERREUR: ${error.message}\n`;
        debugLogs += `Stack: ${error.stack}\n`;
        debugLogs += '\n=== FIN GÉNÉRATION PDF FACTURE (ERREUR) ===\n';
        
        // Sauvegarder les logs d'erreur
        saveLogsToFile(debugLogs, invoiceId);
        
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du PDF',
            error: error.message
        });
    }
};

module.exports = {
    generateInvoicePDF,
    generateInvoiceHTML
}; 