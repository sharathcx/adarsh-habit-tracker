import { connectDB } from "@/lib/db";
import { Subject } from "@/lib/models/Subject";
import { Topic } from "@/lib/models/Topic";
import { StudySession } from "@/lib/models/StudySession";
import { SEED_SUBJECTS } from "@/lib/seed-data";

export async function seedDatabase(force = false) {
  await connectDB();

  const existingCount = await Subject.countDocuments();
  if (existingCount > 0 && !force) {
    return { skipped: true, subjects: existingCount };
  }

  if (force) {
    await Promise.all([Subject.deleteMany({}), Topic.deleteMany({}), StudySession.deleteMany({})]);
  }

  let topicCount = 0;
  let totalMinutes = 0;

  for (const seedSubject of SEED_SUBJECTS) {
    const subject = await Subject.create({
      name: seedSubject.name,
      order: seedSubject.order,
      color: seedSubject.color,
    });
    for (const [topicIndex, seedTopic] of seedSubject.topics.entries()) {
      await Topic.create({
        subjectId: subject._id,
        name: seedTopic.name,
        durationMin: seedTopic.durationMin,
        order: topicIndex + 1,
        section: seedTopic.section ?? null,
      });
      topicCount++;
      totalMinutes += seedTopic.durationMin;
    }
  }

  return {
    skipped: false,
    subjects: SEED_SUBJECTS.length,
    topics: topicCount,
    totalMinutes,
  };
}
