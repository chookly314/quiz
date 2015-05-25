var models = require('../models/models.js');

// PUT /user/:userId/favourites/:quizId 
exports.new = function(req, res) {
	req.user.hasQuiz(req.quiz)
	.then(function(created) {
      if (created) {
        res.redirect('/quizes');
      } else {
        req.user.addQuiz(req.quiz)
        .then(function() {
            res.redirect('/quizes');
          }
        )  
        }; 
      } 
  ).catch(function(error){next(error)});
};

// DELETE /user/:userId/favourites/:quizId
exports.destroy = function(req, res) {
      req.user.removeQuiz(req.quiz)
      .then(function(){
        res.redirect('/quizes');
      }
      ).catch(function(error){next(error)});
    
};

// GET /user/:userId/favourites
exports.show = function(req, res) {
  models.Favourites.findAll({ where: { UserId: Number(req.user.id)}})
  .then(function(users){
    var quizesIds = [];
    for (index in users){
      quizesIds.push(users[index].QuizId);
    }
    models.Quiz.findAll({ where: { id: quizesIds }})
    .then(function(quizes){
      res.render('favourites', { quizes: quizes, errors: []});
      });
    }
  ).catch(function(error){next(error)});
};