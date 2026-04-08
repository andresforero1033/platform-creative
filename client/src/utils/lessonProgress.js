const COMPLETED_STORAGE_PREFIX = 'creative_completed_lessons'
const MASTERED_STORAGE_PREFIX = 'creative_mastered_lessons'

function buildStorageKey(prefix, userId) {
  return `${prefix}:${userId || 'anonymous'}`
}

function readProgressMap(prefix, userId) {
  const raw = localStorage.getItem(buildStorageKey(prefix, userId))

  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeProgressMap(prefix, userId, payload) {
  localStorage.setItem(buildStorageKey(prefix, userId), JSON.stringify(payload))
}

function makeLessonKey(subjectId, lessonId) {
  return `${subjectId}:${lessonId}`
}

export function isLessonCompleted(userId, subjectId, lessonId) {
  if (!subjectId || !lessonId) return false

  const progress = readProgressMap(COMPLETED_STORAGE_PREFIX, userId)
  return !!progress[makeLessonKey(subjectId, lessonId)]
}

export function markLessonCompleted(userId, subjectId, lessonId) {
  if (!subjectId || !lessonId) return

  const progress = readProgressMap(COMPLETED_STORAGE_PREFIX, userId)
  progress[makeLessonKey(subjectId, lessonId)] = true
  writeProgressMap(COMPLETED_STORAGE_PREFIX, userId, progress)
}

export function isLessonMastered(userId, subjectId, lessonId) {
  if (!subjectId || !lessonId) return false

  const progress = readProgressMap(MASTERED_STORAGE_PREFIX, userId)
  return !!progress[makeLessonKey(subjectId, lessonId)]
}

export function markLessonMastered(userId, subjectId, lessonId) {
  if (!subjectId || !lessonId) return

  const progress = readProgressMap(MASTERED_STORAGE_PREFIX, userId)
  progress[makeLessonKey(subjectId, lessonId)] = true
  writeProgressMap(MASTERED_STORAGE_PREFIX, userId, progress)
}

export function getCompletedLessonsCount(userId, subjectId, lessons = []) {
  return lessons.reduce((acc, lesson) => {
    const lessonId = lesson?._id || lesson?.id
    if (!lessonId) return acc

    return isLessonCompleted(userId, subjectId, lessonId) ? acc + 1 : acc
  }, 0)
}

export function getMasteredLessonsCount(userId, subjectId, lessons = []) {
  return lessons.reduce((acc, lesson) => {
    const lessonId = lesson?._id || lesson?.id
    if (!lessonId) return acc

    return isLessonMastered(userId, subjectId, lessonId) ? acc + 1 : acc
  }, 0)
}

export function getFirstPendingLesson(subject, userId) {
  const subjectId = subject?._id || subject?.id
  const lessons = Array.isArray(subject?.lessons) ? subject.lessons : []

  if (!subjectId || lessons.length === 0) return null

  const firstPending = lessons.find((lesson) => {
    const lessonId = lesson?._id || lesson?.id
    return !isLessonCompleted(userId, subjectId, lessonId)
  })

  return firstPending || lessons[0]
}
