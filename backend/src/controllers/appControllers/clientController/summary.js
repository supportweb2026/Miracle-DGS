const mongoose = require('mongoose');
const moment = require('moment');

const InvoiceModel = mongoose.model('Invoice');

const summary = async (Model, req, res) => {
  let defaultType = 'month';
  const { type } = req.query;

  if (type && ['week', 'month', 'year'].includes(type)) {
    defaultType = type;
  } else if (type) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Invalid type',
    });
  }

  const currentDate = moment();
  let startDate = currentDate.clone().startOf(defaultType);
  let endDate = currentDate.clone().endOf(defaultType);

  try {
    // Pipeline simplifié pour éviter les erreurs
    const pipeline = [
      {
        $facet: {
          totalClients: [
            { $match: { removed: false, enabled: true } },
            { $count: 'count' }
          ],
          newClients: [
            { 
              $match: { 
                removed: false, 
                enabled: true,
                created: { $gte: startDate.toDate(), $lte: endDate.toDate() }
              } 
            },
            { $count: 'count' }
          ],
          activeClients: [
            {
              $lookup: {
                from: 'invoices',
                localField: '_id',
                foreignField: 'client',
                as: 'invoices'
              }
            },
            {
              $match: {
                'invoices': { $exists: true, $ne: [] }
              }
            },
            {
              $addFields: {
                hasActiveInvoices: {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: '$invoices',
                          as: 'invoice',
                          cond: { $eq: ['$$invoice.removed', false] }
                        }
                      }
                    },
                    0
                  ]
                }
              }
            },
            {
              $match: {
                hasActiveInvoices: true
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ];

    const aggregationResult = await Model.aggregate(pipeline);
    const result = aggregationResult[0];
    
    const totalClients = result.totalClients[0]?.count || 0;
    const totalNewClients = result.newClients[0]?.count || 0;
    const activeClients = result.activeClients[0]?.count || 0;

    const totalActiveClientsPercentage = totalClients > 0 ? (activeClients / totalClients) * 100 : 0;
    const totalNewClientsPercentage = totalClients > 0 ? (totalNewClients / totalClients) * 100 : 0;

    return res.status(200).json({
      success: true,
      result: {
        new: Math.round(totalNewClientsPercentage),
        active: Math.round(totalActiveClientsPercentage),
      },
      message: 'Successfully get summary of new clients',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Erreur lors de l\'agrégation client summary',
    });
  }
};

module.exports = summary;
