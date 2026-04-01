const Question = require("../models/Question");

async function findByIdsLean(questionIds) {
  return Question.find({ _id: { $in: questionIds } }).lean();
}

module.exports = {
  findByIdsLean,
};
