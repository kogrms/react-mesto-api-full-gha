const { STATUS_201 } = require('../utils/constants');
const DeleteCardError = require('../errors/delete-card-error');
const NotFoundError = require('../errors/not-found-error');
const ValidationError = require('../errors/validation-error');
const Card = require('../models/card');

module.exports.getCard = (req, res, next) => {
  Card.find({})
    .populate(['owner', 'likes'])
    .then((card) => res.send({ data: card }))
    .catch(next);
};

module.exports.deleteCardsById = (req, res, next) => {
  Card.findById(req.params.cardId)
    .then((card) => {
      if (card == null) {
        throw new NotFoundError('Пользователь по указанному _id не найден');
      }
      if (!(card.owner._id.toString() === req.user._id)) {
        throw new DeleteCardError('Вы не можете удалить чужую карточку!');
      }
      return Card.findByIdAndRemove(req.params.cardId)
        .then((cardDelete) => res.send({ data: cardDelete }))
        .catch(next);
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        next(new ValidationError('Переданы некорректные данные для удаления карточки'));
      } else {
        next(err);
      }
    });
};

module.exports.createCard = (req, res, next) => {
  const { name, link } = req.body;
  Card.create({ name, owner: req.user._id, link })
    .then((card) => res.status(STATUS_201).send({ data: card }))
    // .catch(next);
    .catch((err) => {
      if (err.name === 'ValidationError') {
        next(new ValidationError('Переданы некорректные данные при создании карточки'));
      } else {
        next(err);
      }
    });
};

module.exports.likeCard = (req, res, next) => Card.findByIdAndUpdate(
  req.params.cardId,
  {
    $addToSet: { likes: req.user._id },
  },
  { new: true },
)
  .populate(['owner', 'likes'])
  .then((card) => {
    if (card == null) {
      throw new NotFoundError('Пользователь по указанному _id не найден');
    }
    return res.send({ data: card });
  })
  .catch((err) => {
    if (err.name === 'CastError') {
      next(new ValidationError('Переданы некорректные данные для постановки лайка'));
    } else {
      next(err);
    }
  });

module.exports.dislikeCard = (req, res, next) => Card.findByIdAndUpdate(
  req.params.cardId,
  {
    $pull: { likes: req.user._id },
  },
  { new: true },
)
  .populate(['owner', 'likes'])
  .then((card) => {
    if (card == null) {
      throw new NotFoundError('Пользователь по указанному _id не найден');
    }
    return res.send({ data: card });
  })
  .catch((err) => {
    if (err.name === 'CastError') {
      next(new ValidationError('Переданы некорректные данные для удаления лайка'));
    } else {
      next(err);
    }
  });
