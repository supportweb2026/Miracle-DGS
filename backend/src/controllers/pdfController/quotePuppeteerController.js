const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { loadSettings } = require('../../middlewares/settings');
const useLanguage = require('../../locale/useLanguage');

// Charger les modèles nécessaires
const Quote = require('../../models/appModels/Quote');

// Fonction pour sauvegarder les logs dans un fichier .txt
const saveLogsToFile = (logs, quoteId) => {
    try {
        const logsDir = path.join(__dirname, '../../../logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
        const logFileName = `quote_puppeteer_logs_${quoteId}_${timestamp}.txt`;
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

// Fonction pour générer le HTML du devis
const generateQuoteHTML = async (quoteData, settings, logoBase64) => {
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
    let taxDetails = quoteData.taxDetails || {};
    let taxTotal = quoteData.taxTotal || 0;
    let subTotal = quoteData.subTotal || 0;
    let total = quoteData.total || 0;

    // LOGS DÉTAILLÉS POUR DEBUG
    console.log('🧮 CALCUL TAXES - Données reçues:');
    console.log('  - taxName:', quoteData.taxName);
    console.log('  - taxRate:', quoteData.taxRate);
    console.log('  - subTotal:', subTotal);
    console.log('  - taxDetails existant:', taxDetails);
    console.log('  - taxTotal existant:', taxTotal);
    console.log('  - total existant:', total);

    // Déterminer le type de taxe à partir du taxRate
    if (quoteData.taxRate === 10.5) {
        taxType = 'TPS et CSS';
        // Utiliser les valeurs des taxDetails si disponibles
        tps = taxDetails.tps || subTotal * 0.095;
        css = taxDetails.css || subTotal * 0.01;
    } else if (quoteData.taxRate === 19) {
        taxType = 'TVA et CSS';
        // Utiliser les valeurs des taxDetails si disponibles
        tva = taxDetails.tva || subTotal * 0.18;
        css = taxDetails.css || subTotal * 0.01;
    }
    console.log('🎯 Type de taxe déterminé:', taxType, '(basé sur taxRate:', quoteData.taxRate, ')');

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
            taxTotal = -tps + css; // TPS négatif + CSS positif
            taxDetails = { tps: -tps, css: css }; // TPS stocké en négatif
            console.log('✅ TPS et CSS calculées:', { tps: -tps, css, taxTotal });
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
    if (quoteData.services && quoteData.services.length > 0) {
        prestationsData = quoteData.services.map((service, index) => {
            const serviceName = service.name || 'Service';
            const dailyRate = service.dailyRate || 0;
            const numberOfAgents = service.numberOfAgents || 0;
            const numberOfDays = service.numberOfDays || 0;
            const lineTotal = dailyRate * numberOfDays * numberOfAgents;
            
            return {
                order_number: index + 1,
                designation: serviceName,
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
    
    // Lire le template HTML
    const templatePath = path.join(__dirname, 'DEVIS.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    // Remplacer les champs variables avec les bons placeholders
    htmlTemplate = htmlTemplate
        .replace(/\{\{LOGO_BASE64\}\}/g, `data:image/png;base64,${logoBase64}`)
        .replace(/\{\{QUOTE_NUMBER\}\}/g, (() => {
            const quoteNumber = quoteData.number;
            const quoteYear = new Date(quoteData.date).getFullYear();
            const yearShort = quoteYear.toString().slice(-2); // 2 derniers chiffres
            return `N°${quoteNumber}/${yearShort}`;
        })())
        .replace(/\{\{QUOTE_DATE\}\}/g, moment(quoteData.date).format('DD/MM/YYYY'))
        .replace(/\{\{CLIENT_NAME\}\}/g, quoteData.prospect || 'N/A')
        .replace(/\{\{CLIENT_ADDRESS\}\}/g, quoteData.prospectAddress || 'Adresse non renseignée')
        .replace(/\{\{CLIENT_PHONE\}\}/g, quoteData.prospectPhone || 'N/A')
        .replace(/\{\{OBJECT\}\}/g, `OBJET : ${quoteData.object || 'Devis de prestations'}`)
        .replace(/\{\{SUBTOTAL_AMOUNT\}\}/g, formatMoney(subTotal).replace(' XAF', ''))
        .replace(/\{\{CSS_AMOUNT\}\}/g, formatMoney(css).replace(' XAF', ''))
        .replace(/\{\{TAX_LABEL\}\}/g, taxType === 'TVA et CSS' ? 'TVA 18%' : 'TPS-9,5%')
        .replace(/\{\{TAX_LABEL_AMOUNT\}\}/g, taxType === 'TVA et CSS' 
            ? formatMoney(tva).replace(' XAF', '') 
            : `(${formatMoney(Math.abs(tps)).replace(' XAF', '')})`)
        .replace(/\{\{TPS_AMOUNT\}\}/g, taxType === 'TVA et CSS' 
            ? formatMoney(tva).replace(' XAF', '') 
            : `(${formatMoney(Math.abs(tps)).replace(' XAF', '')})`)
        .replace(/\{\{TOTAL_AMOUNT\}\}/g, formatMoney(total).replace(' XAF', ''))
        // Remplacer la boucle {{#each PRESTATIONS}} par les données des services
        .replace('{{#each PRESTATIONS}}', prestationsData.map(prestation => `
    <tr>
        <td style="border-left: 1px solid #000000; border-right: 1px solid #000000" height="19" align="left" valign=middle data-sheets-value="{ &quot;1&quot;: 2, &quot;2&quot;: &quot;${prestation.order_number}&quot;}">${prestation.order_number}</td>
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

// Fonction principale pour générer le PDF de devis
const generateQuotePDF = async (req, res) => {
    let debugLogs = '';
    let quoteId = 'unknown';
    
    try {
        console.log('🚨 DÉBUT GÉNÉRATION PDF DEVIS - Étape 1: Analyse des données reçues');
        
        // Logs détaillés des données reçues
        debugLogs += '=== DÉBUT GÉNÉRATION PDF DEVIS ===\n';
        debugLogs += `Timestamp: ${moment().format('YYYY-MM-DD HH:mm:ss')}\n\n`;
        
        // Analyser req.params
        debugLogs += '--- REQ.PARAMS ---\n';
        debugLogs += `req.params: ${JSON.stringify(req.params, null, 2)}\n`;
        if (req.params && req.params.id) {
            quoteId = req.params.id;
            debugLogs += `ID devis trouvé: ${quoteId}\n`;
        } else {
            debugLogs += '❌ Aucun ID trouvé dans req.params\n';
        }
        
        console.log('📊 Données reçues analysées');
        
        // Récupérer les données du devis
        let quote = null;
        
        if (req.params && req.params.id) {
            console.log('🔍 Récupération du devis depuis la base de données...');
            quote = await Quote.findById(req.params.id)
                .populate('contract')
                .exec();
            
            if (!quote) {
                throw new Error('Devis non trouvé');
            }
            
            console.log('✅ Devis récupéré:', {
                id: quote._id,
                number: quote.number,
                prospect: quote.prospect,
                services: quote.services?.length || 0
            });
        } else {
            throw new Error('ID du devis manquant');
        }
        
        debugLogs += `\n✅ Devis récupéré: ${quote.number}\n`;
        debugLogs += `Prospect: ${quote.prospect}\n`;
        debugLogs += `Services: ${quote.services?.length || 0}\n`;
        
        // Charger les paramètres
        console.log('⚙️ Chargement des paramètres...');
        const settings = await loadSettings();
        console.log('✅ Paramètres chargés');
        
        // Encoder l'image en base64
        const logoPath = path.join(__dirname, '../../public/uploads/setting/company-logo.png');
        let logoBase64 = '';
        let logoDebugInfo = '';

        try {
            logoDebugInfo += ` Chemin du logo: ${logoPath}\n`;
            if (fs.existsSync(logoPath)) {
                const logoBuffer = fs.readFileSync(logoPath);
                logoBase64 = logoBuffer.toString('base64');
                logoDebugInfo += ` Logo trouvé et encodé (${logoBuffer.length} bytes)\n`;
                console.log('✅ Logo chargé et encodé en base64');
            } else {
                logoDebugInfo += ` Logo non trouvé à ${logoPath}\n`;
                console.log('⚠️ Logo non trouvé, utilisation d\'une image par défaut');
                // Utiliser une image par défaut ou laisser vide
                logoBase64 = '';
            }
        } catch (logoError) {
            logoDebugInfo += ` Erreur lors du chargement du logo: ${logoError.message}\n`;
            console.error('❌ Erreur chargement logo:', logoError.message);
            logoBase64 = '';
        }
        
        debugLogs += `\n--- LOGO DEBUG ---\n${logoDebugInfo}\n`;
        
        // Générer le HTML
        console.log('🎨 Génération du HTML...');
        const htmlContent = await generateQuoteHTML(quote, settings, logoBase64);
        console.log('✅ HTML généré');
        
        // Lancer Puppeteer
        console.log('🚀 Lancement de Puppeteer...');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        
        // Charger le contenu HTML
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0'
        });
        
        // Générer le PDF
        console.log('📄 Génération du PDF...');
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            displayHeaderFooter: false,
            margin: {
                top: '10mm',
                right: '10mm',
                bottom: '25mm',
                left: '10mm'
            }
        });
        
        await browser.close();
        
        debugLogs += '\n✅ PDF généré\n';
        
        // Sauvegarder le PDF avec le nom attendu par le handler
        const fileName = `Devis-${quote._id}.pdf`;
        const filePath = path.join(__dirname, '../../../public/download/quote', fileName);
        
        // Créer le dossier s'il n'existe pas
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, pdf);
        
        debugLogs += `\n✅ PDF sauvegardé: ${filePath}\n`;
        
        // Mettre à jour le devis avec le chemin du PDF
        await Quote.findByIdAndUpdate(quoteId, { pdf: fileName });
        
        debugLogs += '\n✅ Devis mis à jour en base\n';
        debugLogs += '\n=== FIN GÉNÉRATION PDF DEVIS ===\n';
        
        // Sauvegarder les logs
        saveLogsToFile(debugLogs, quoteId);
        
        res.json({
            success: true,
            message: 'PDF généré avec succès',
            fileName: fileName,
            filePath: filePath
        });
        
    } catch (error) {
        console.error('Erreur génération PDF devis:', error);
        
        debugLogs += `\n❌ ERREUR: ${error.message}\n`;
        debugLogs += `Stack: ${error.stack}\n`;
        debugLogs += '\n=== FIN GÉNÉRATION PDF DEVIS (ERREUR) ===\n';
        
        // Sauvegarder les logs d'erreur
        saveLogsToFile(debugLogs, quoteId);
        
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la génération du PDF',
            error: error.message
        });
    }
};

module.exports = {
    generateQuotePDF,
    generateQuoteHTML
};
