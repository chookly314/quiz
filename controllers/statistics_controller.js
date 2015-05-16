var models = require('../models/models.js');

exports.stats = function(req, res) {
    models.Quiz.findAll({include: [models.Comment]}).then(function(quizes) {
        res.render('quizes/statistics', {quizes: quizes, errors: []});
    });
};