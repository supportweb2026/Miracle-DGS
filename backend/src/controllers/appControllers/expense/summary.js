const mongoose = require('mongoose');
const Expense = mongoose.model('Expense'); // Assurez-vous que le modèle 'Expense' est correctement défini

const summary = async (req, res) => {
  try {
    // Récupérer la valeur de currency à partir des query params
    const { currency } = req.query; // Si 'currency' est passé dans les paramètres de la requête

    console.log("Currency reçu:", currency); // Pour déboguer, voir ce qui est reçu

    // Récupérer toutes les dépenses qui ne sont pas supprimées et filtrer par currency si présent
    const filter = { removed: false };
    
    if (currency) {
      filter.currency = currency; // Applique un filtre pour la devise si 'currency' est fourni
    }

    const expenses = await Expense.find(filter); // Utilisation du filtre pour récupérer les dépenses
    console.log("Dépenses récupérées:", expenses);

    // Calculer le total des dépenses
    const total = expenses.reduce((acc, expense) => acc + (expense.total || 0), 0);

    // Retourner la réponse avec le total
    return res.status(200).json({
      success: true,
      result: {
        total: total, // Renvoi du total calculé
      },
      message: 'Résumé des dépenses récupéré avec succès',
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du résumé des dépenses:', error);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

module.exports = summary;
