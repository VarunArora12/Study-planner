import { daysUntilExam } from "./scheduler.js";

function groupTopicsByDate(topics) {
  return topics.reduce((days, topic) => {
    const existing = days.find((day) => day.date === topic.study_date);

    if (existing) {
      existing.items.push(topic);
      existing.totalHours += topic.estimated_hours;
      return days;
    }

    days.push({
      date: topic.study_date,
      dayNumber: topic.day_number,
      totalHours: topic.estimated_hours,
      items: [topic]
    });
    return days;
  }, []);
}

export function presentPlan(plan, topics) {
  if (!plan) return null;

  const completedCount = topics.filter((topic) => topic.completed).length;
  const progress = topics.length ? Math.round((completedCount / topics.length) * 100) : 0;

  return {
    id: plan.id,
    subjectId: plan.subject_id,
    subjectName: plan.subject_name,
    syllabusText: plan.syllabus_text,
    examDate: plan.exam_date,
    hoursPerDay: plan.hours_per_day,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
    countdown: Math.max(0, daysUntilExam(plan.exam_date)),
    progress,
    completedCount,
    totalTasks: topics.length,
    revisionTasks: topics.filter((topic) => topic.is_revision).length,
    schedule: groupTopicsByDate(
      topics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        study_date: topic.study_date,
        day_number: topic.day_number,
        estimated_hours: topic.estimated_hours,
        is_revision: Boolean(topic.is_revision),
        completed: Boolean(topic.completed),
        sort_order: topic.sort_order
      }))
    )
  };
}
