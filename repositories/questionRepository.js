const Question = require("../models/Question");
const mongoose = require("mongoose");

async function findRandomBySubjectLean(subjectId, limit) {
  if (!mongoose.Types.ObjectId.isValid(subjectId)) {
    return [];
  }

  return Question.aggregate([
    {
      $match: {
        subjectId: new mongoose.Types.ObjectId(String(subjectId)),
      },
    },
    {
      $sample: {
        size: limit,
      },
    },
  ]);
}

async function findByIdsLean(questionIds) {
  return Question.find({ _id: { $in: questionIds } }).lean();
}

async function findByIdsAndSubjectLean(questionIds, subjectId) {
  return Question.find({
    _id: { $in: questionIds },
    subjectId,
  }).lean();
}

module.exports = {
  findRandomBySubjectLean,
  findByIdsLean,
  findByIdsAndSubjectLean,
};
