var models = require('../models/models.js');

// MW que permite acciones solamente si el quiz objeto pertenece al usuario logeado o si es cuenta admin
exports.ownershipRequired = function(req, res, next){
    var objQuizOwner = req.quiz.UserId;
    var logUser = req.session.user.id;
    var isAdmin = req.session.user.isAdmin;

    if (isAdmin || objQuizOwner === logUser) {
        next();
    } else {
        res.redirect('/');
    }
};

// Autoload :id
exports.load = function(req, res, next, quizId) {
      models.Quiz.find({
            where: {
                id: Number(quizId)
            },
            include: [{
                model: models.Comment
            }]
        }).then(function(quiz) {
      if (quiz) {
        req.quiz = quiz;
        next();
      } else{next(new Error('No existe quizId=' + quizId))}
    }
  ).catch(function(error){next(error)});
};

// GET /quizes
// GET /users/:userId/quizes
exports.index = function(req, res) {
  //si hay query, buscamos lo que se pide
  if(req.query.search){
    var busq = req.query.search;
    for (var i=0; i<req.query.search.length; i++){
      busq = busq.replace(" ", "%");
    }
    models.Quiz.findAll({where: ["pregunta like ?", '%'+busq+'%'], order: "pregunta"}).then(
      function(quizes) {
        res.render('quizes/busqueda', { quizes: quizes, errors: []})});
  } else {
    // si no hay query, cargamos la lista normalmente
    var options = {};
    var favs = [];
    if(req.user){
      options.where = {UserId: req.user.id}
    }

    models.Quiz.findAll(options)
    .then(function(quizes) {
      if(req.session.user){
        models.Favourites.findAll( {where: { UserId: Number(req.session.user.id) }})
        .then(function(user){
          for(index in quizes){
            for(index2 in user){
              if(user[index2].QuizId === quizes[index].id){
                favs.push(quizes[index].id);
              }
            }
          }
          res.render("quizes/index", { quizes: quizes, favs: favs, errors: []});
        })
      }else{
        res.render("quizes/index", { quizes: quizes, favs: favs, errors: []});
      }
    }).catch(function(error){next(error)});
  }
};

// GET /quizes/:id
exports.show = function(req, res) {
  var fav = [];
  var myUser = [];

  if(req.session.user){
    models.Favourites.find({ where: { UserId: Number(req.session.user.id), QuizId: Number(req.quiz.id) }})
    .then(function(liked) {
      if (liked) {
        fav.push(req.quiz.id);
        res.render('quizes/show', { quiz: req.quiz, fav: fav, errors: []});
      } else {
        res.render('quizes/show', { quiz: req.quiz, fav: fav, errors: []});
      }
    });
  } else {
    res.render('quizes/show', { quiz: req.quiz, fav: fav, errors: []});
  }
};            

// GET /quizes/:id/answer
exports.answer = function(req, res) {
   var resultado = 'Incorrecto';
  if (req.query.respuesta === req.quiz.respuesta) {
    resultado = 'Correcto';
  }
  res.render(
    'quizes/answer', 
    { quiz: req.quiz, 
      respuesta: resultado, 
      errors: []
    }
  );
};

// GET /quizes/new
exports.new = function(req, res) {
  var quiz = models.Quiz.build( // crea objeto quiz 
    {pregunta: "Pregunta", respuesta: "Respuesta"}
  );

  res.render('quizes/new', {quiz: quiz, errors: []});
};

// POST /quizes/create
exports.create = function(req, res) {
  req.body.quiz.UserId = req.session.user.id;
  if(req.files.image){
    req.body.quiz.image = req.files.image.name;
  }
  var quiz = models.Quiz.build( req.body.quiz );

  quiz
  .validate()
  .then(
    function(err){
      if (err) {
        res.render('quizes/new', {quiz: quiz, errors: err.errors});
      } else {
        quiz // save: guarda en DB campos pregunta y respuesta de quiz
        .save({fields: ["pregunta", "respuesta", "UserId", "image", "category"]})
        .then( function(){ res.redirect('/quizes')}) 
      }      // res.redirect: Redirección HTTP a lista de preguntas
    }
  ).catch(function(error){next(error)});
};

// GET /quizes/:id/edit
exports.edit = function(req, res) {
  var quiz = req.quiz;  // req.quiz: autoload de instancia de quiz

  res.render('quizes/edit', {quiz: quiz, errors: []});
};

// PUT /quizes/:id
exports.update = function(req, res) {
  if(req.files.image){
    req.quiz.image = req.files.image.name;
  }
  req.quiz.pregunta  = req.body.quiz.pregunta;
  req.quiz.respuesta = req.body.quiz.respuesta;
  req.quiz.category = req.body.tema;

  req.quiz
  .validate()
  .then(
    function(err){
      if (err) {
        res.render('quizes/edit', {quiz: req.quiz, errors: err.errors});
      } else {
        req.quiz     // save: guarda campos pregunta y respuesta en DB
        .save( {fields: ["pregunta", "respuesta", "image", "category"]})
        .then( function(){ res.redirect('/quizes');});
      }     // Redirección HTTP a lista de preguntas (URL relativo)
    }
  ).catch(function(error){next(error)});
};

// DELETE /quizes/:id
exports.destroy = function(req, res) {
  req.quiz.destroy().then( function() {
    res.redirect('/quizes');
  }).catch(function(error){next(error)});
};

// GET /quizes/:id/showAnswer
exports.showAnswer = function(req, res) {
  res.render('quizes/showAnswer', { quiz: req.quiz, errors: []});
};

