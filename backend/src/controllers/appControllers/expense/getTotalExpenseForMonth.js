// Dépendances
const mongoose = require('mongoose');
const Expense = mongoose.model('Expense');

// Fonction pour récupérer les dépenses du mois
const getTotalExpenseForMonth = async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  try {
    // Récupérer la somme des dépenses pour le mois en cours
    const total = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth }, // Filtrer les dépenses du mois en cours
        },
      },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: '$amount' }, // Somme des montants des dépenses
        },
      },
    ]);

    // Si des dépenses sont trouvées, renvoyer le total
    if (total.length > 0) {
      return res.status(200).json({
        success: true,
        total: total[0].totalExpense,
      });
    }

    // Si aucune dépense n'est trouvée
    return res.status(200).json({
      success: true,
      total: 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du calcul du total des dépenses',
    });
  }
};

module.exports = {
  getTotalExpenseForMonth,
};
