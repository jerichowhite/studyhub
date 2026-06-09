import OpenAI from 'openai';
import {
  buildComprehensiveContext,
  getGamificationInsight,
  getScheduleInsight,
  getMaterialsInsight,
  getActivityInsight,
  getTemporalInsight,
  getTimeAgo,
} from './aiContextBuilder';

const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a message to GitHub Models GPT-4o.
 * userContext may include a `userId` field; when present the AI receives a
 * comprehensive Firestore-backed profile snapshot before every reply.
 */
export const sendMessageToAI = async (
  userMessage,
  conversationHistory = [],
  userContext = {}
) => {
  try {
    console.log(`Using GitHub Token: ${GITHUB_TOKEN ? GITHUB_TOKEN.substring(0, 10) + '...' : 'MISSING_TOKEN'}`);

    const client = new OpenAI({
      baseURL: 'https://models.github.ai/inference',
      apiKey:  GITHUB_TOKEN,
      dangerouslyAllowBrowser: true,
    });

    // buildSystemPrompt is now async – it may fetch Firestore context
    const systemPrompt = await buildSystemPrompt(userContext);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg) => ({
        role:    msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    console.log('Starting GitHub Models API call with model: gpt-4o');

    const response = await client.chat.completions.create({
      messages,
      model:       'gpt-4o',
      temperature: 0.7,
      max_tokens:  1500,
      top_p:       0.95,
    });

    const aiResponse = response.choices[0].message.content;
    console.log('GitHub Models API Response received:', aiResponse.substring(0, 100) + '...');

    return { success: true, response: aiResponse, timestamp: new Date() };
  } catch (error) {
    console.error('GitHub Models API Error:', error);

    let errorMessage = 'Failed to get response from AI';
    if (error.message?.includes('401') || error.message?.includes('Unauthorized'))
      errorMessage = 'Invalid GitHub token. Please check your API key.';
    else if (error.message?.includes('429') || error.message?.includes('rate limit'))
      errorMessage = 'Rate limit exceeded. Please try again in a few minutes.';
    else if (error.message?.includes('network') || error.message?.includes('fetch'))
      errorMessage = 'Network error. Check your internet connection.';

    return { success: false, error: errorMessage, timestamp: new Date() };
  }
};

// ── System prompt builder (async) ─────────────────────────────────────────────

const buildSystemPrompt = async (userContext) => {
  const {
    aiName        = 'Study Assistant',
    displayName   = 'Student',
    level         = '400',
    department    = 'Computer Science',
    university    = 'Benson Idahosa University',
    courses       = [],
    personality   = 'friendly',
    responseLength = 'detailed',
    activeContext  = null,
    studyAreaContext = null,
    userId         = null,
  } = userContext;

  // ── Personality ──────────────────────────────────────────────────────────
  let personalityInstructions;
  if (personality === 'formal') {
    personalityInstructions =
      'Respond in a professional, academic tone like a university professor. Use technical terminology and formal language.';
  } else if (personality === 'motivational') {
    personalityInstructions =
      'Respond with enthusiasm and encouragement. Celebrate progress and motivate the student. Use energetic language.';
  } else {
    personalityInstructions =
      'Respond in a friendly, supportive tone like a helpful peer or study buddy. Be approachable and encouraging.';
  }

  // ── Response length ──────────────────────────────────────────────────────
  let lengthInstructions;
  if (responseLength === 'brief') {
    lengthInstructions = 'Keep responses concise and to the point. Aim for 2–3 paragraphs maximum.';
  } else if (responseLength === 'step-by-step') {
    lengthInstructions = 'Break down concepts into clear, numbered steps. Explain each step thoroughly.';
  } else {
    lengthInstructions = 'Provide detailed, comprehensive explanations with examples where appropriate.';
  }

  // ── Base prompt ──────────────────────────────────────────────────────────
  const basePrompt = `YOUR NAME IS ${aiName}. This is the name the student gave you. Always remember and use this name when referring to yourself.

You are ${aiName}, a friendly AI study assistant for ${displayName},
a ${level} level ${department} student at ${university}.

IMPORTANT: Your name is ${aiName}. If asked "What is your name?" or "Who are you?", always respond with "${aiName}".

Their enrolled courses are: ${courses.join(', ') || 'none listed'}.

PERSONALITY: ${personalityInstructions}

RESPONSE LENGTH: ${lengthInstructions}

CAPABILITIES:
- Answer questions about their course topics
- Explain complex concepts in simple terms
- Generate practice questions and quizzes
- Provide step-by-step problem solutions
- Summarise study materials
- Help create study plans
- Recommend learning resources
- Provide guidance on assignments (but don't give direct answers)

IMPORTANT RULES:
- Always be helpful, patient, and encouraging
- If you don't know something, say so honestly
- Never provide direct answers to assignments or exams – guide instead
- Use examples relevant to Nigerian context when appropriate
- If asked about topics outside their courses, you can help but remind them to focus
- Never engage with inappropriate requests
- Remind students to verify critical information with professors or textbooks

CURRENT DATE: ${new Date().toLocaleDateString('en-NG')}

REMEMBER: Your name is ${aiName}. The student's name is ${displayName}.`;

  // ── Course / topic context ────────────────────────────────────────────────
  let contextualGuidance = '';
  if (activeContext && activeContext !== 'general') {
    const course = courses.find(
      (c) =>
        c.toLowerCase().replace(/\s+/g, '_') === activeContext || c === activeContext
    );
    if (course) {
      contextualGuidance = `\n\nCURRENT FOCUS: The student wants help specifically with ${course}. Tailor your responses to this course.`;
    } else if (activeContext === 'exam-prep') {
      contextualGuidance = `\n\nCURRENT FOCUS: The student is preparing for exams. Focus on exam strategies, practice questions, key concepts review, and memory techniques.`;
    } else if (activeContext === 'assignment-help') {
      contextualGuidance = `\n\nCURRENT FOCUS: The student needs help with an assignment. Guide them through understanding the requirements and developing their solution — don't give direct answers.`;
    }
  }

  // ── Study Area live context (from ContextualAI widget) ───────────────────
  let studyAreaGuidance = '';
  if (studyAreaContext) {
    const {
      whiteboardSummary,
      stickyNotes,
      todaySchedule,
      upcoming,
      nextExam,
      currentFile,
      currentTime,
    } = studyAreaContext;

    const todayStr = todaySchedule?.length
      ? todaySchedule.map((c) => c.title).join(', ')
      : 'No classes today';

    const upcomingStr = upcoming?.length
      ? upcoming
          .map(
            (c) =>
              `${c.title} (${new Date(c.start).toLocaleDateString('en-NG', {
                weekday: 'short',
                month:   'short',
                day:     'numeric',
              })})`
          )
          .join(', ')
      : 'None';

    const examStr = nextExam
      ? `${nextExam.title} on ${new Date(nextExam.start).toLocaleDateString('en-NG', {
          weekday: 'long',
          month:   'long',
          day:     'numeric',
        })}`
      : 'None scheduled';

    studyAreaGuidance = `

CURRENT STUDY AREA CONTEXT:
You have live access to ${displayName}'s study workspace. Use this context to give highly relevant, personalised help.

WHITEBOARD:
${whiteboardSummary ? `- Notes on whiteboard: "${whiteboardSummary}"` : '- Whiteboard is currently empty'}
${stickyNotes ? `- Sticky notes: "${stickyNotes}"` : ''}
If they ask about something on the whiteboard, reference their exact words.

CLASS SCHEDULE:
- Today's classes: ${todayStr}
- Upcoming (next 7 days): ${upcomingStr}
- Next exam: ${examStr}
Proactively mention upcoming exams or clashes when relevant.

OPEN FILE:
${
  currentFile
    ? `- Currently viewing: "${currentFile.title}" (${currentFile.course}) — offer to explain concepts from this material`
    : '- No file open'
}

CURRENT TIME: ${currentTime}

STUDY AREA BEHAVIOUR:
- Reference specific whiteboard content when explaining concepts
- Build study plans around their actual schedule
- Warn if an exam is approaching and they haven't mentioned preparing
- When a file is open, offer to summarise or explain it unprompted`;
  }

  // ── Comprehensive Firestore context ──────────────────────────────────────
  let comprehensiveGuidance = '';
  if (userId) {
    try {
      const ctx = await buildComprehensiveContext(userId, userContext);
      const { gamification: gam, schedule, materials, studyArea, activity, temporal } = ctx;

      const toTime  = (d) => d ? new Date(d).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' }) : '';
      const toDate  = (d) => d ? new Date(d).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' }) : '';

      const todayClassLines = schedule.todayClasses?.length
        ? schedule.todayClasses.map((c) => `  - ${c.title} at ${toTime(c.time)}${c.location ? ` (${c.location})` : ''}`).join('\n')
        : '  - No classes today';

      const upcomingLines = schedule.upcomingClasses?.length
        ? schedule.upcomingClasses.map((c) => `  - ${c.course ? c.course + ': ' : ''}${c.title} on ${toDate(c.time)} at ${toTime(c.time)}`).join('\n')
        : '  - No upcoming classes scheduled';

      const examBlock = (() => {
        if (!schedule.nextExam) return '';
        const examDate = schedule.nextExam.startTime?.toDate
          ? schedule.nextExam.startTime.toDate()
          : new Date(schedule.nextExam.startTime || 0);
        const daysUntil = Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24));
        return `
⚠️ NEXT EXAM:
  - ${schedule.nextExam.title}
  - Date: ${examDate.toLocaleDateString('en-NG', { weekday: 'long', month: 'long', day: 'numeric' })}
  - Days until exam: ${daysUntil} — ${daysUntil <= 3 ? 'CRITICAL — help them prepare NOW!' : daysUntil <= 7 ? 'Time to start reviewing!' : 'Remind them to start planning.'}`;
      })();

      const materialsLines = materials.uploaded?.length
        ? materials.uploaded.slice(0, 5).map((m) => `  - ${m.title} (${m.course || 'unknown course'})`).join('\n')
        : '  - No materials uploaded yet';

      const activityLines = activity.recent?.length
        ? activity.recent.slice(0, 5).map((a) => `  - ${a.action} (+${a.points ?? '?'} pts) — ${getTimeAgo(a.timestamp)}`).join('\n')
        : '  - No recent activity recorded';

      comprehensiveGuidance = `

═══════════════════════════════════════════════════════════════
🤖 COMPREHENSIVE STUDENT PROFILE — USE THIS TO PERSONALISE EVERY REPLY
═══════════════════════════════════════════════════════════════

📊 GAMIFICATION:
  Level:        ${gam.level || 'Freshman Helper'}
  Total Points: ${gam.points ?? 0}
  Study Streak: ${gam.streak ?? 0} days 🔥
  Today's Pts:  ${gam.todayPoints ?? 0}
  This Week:    ${gam.weekPoints ?? 0} pts
  Badges:       ${gam.badges?.length ? gam.badges.join(', ') : 'None yet'}
  ${gam.rank ? `Leaderboard:  #${gam.rank}` : ''}
💡 ${getGamificationInsight(gam)}

═══════════════════════════════════════════════════════════════

📅 SCHEDULE (${temporal.dayOfWeek}):

TODAY:
${todayClassLines}

UPCOMING (next 5):
${upcomingLines}
${examBlock}
💡 ${getScheduleInsight(schedule, temporal)}

═══════════════════════════════════════════════════════════════

📚 MATERIALS:
  Total contributed: ${materials.totalUploaded ?? 0}
  Recent uploads:
${materialsLines}
💡 ${getMaterialsInsight(materials)}

═══════════════════════════════════════════════════════════════

📝 WHITEBOARD / STUDY AREA:
${
  studyArea.hasWhiteboard
    ? `  Active. ${studyArea.whiteboardSummary ? `Recent notes: "${studyArea.whiteboardSummary.substring(0, 300)}..."` : 'Canvas has drawings but no text elements.'}`
    : '  Empty — suggest they use the Study Area to take notes.'
}

═══════════════════════════════════════════════════════════════

🎯 RECENT ACTIVITY:
${activityLines}
  Most frequent action: ${activity.mostFrequentAction || 'N/A'}
💡 ${getActivityInsight(activity)}

═══════════════════════════════════════════════════════════════

⏰ TEMPORAL:
  Time:    ${temporal.currentTime?.toLocaleString('en-NG') || new Date().toLocaleString('en-NG')}
  Period:  ${temporal.timeOfDay}
  ${temporal.isWeekend ? 'It\'s the weekend!' : 'Weekday'}
💡 ${getTemporalInsight(temporal)}

═══════════════════════════════════════════════════════════════

🤖 YOUR PROACTIVE BEHAVIOURS (mandatory):

1. ANTICIPATE NEEDS — if an exam is < 7 days away, mention it even if not asked.
2. PERSONALISE — reference real data above (e.g. "I see your streak is ${gam.streak ?? 0} days").
3. SUGGEST NEXT STEPS — "Want me to quiz you on [course] before your class at [time]?"
4. NOTICE PATTERNS — if materials.totalUploaded is 0, suggest contributing.
5. TIME-AWARE — if it's ${temporal.timeOfDay}, acknowledge it naturally.
6. CELEBRATE MILESTONES — streak, badges, rank changes.

You are not a Q&A bot. You are ${displayName}'s AI study partner who knows their full academic life. Be genuinely helpful, proactive, and personal.
═══════════════════════════════════════════════════════════════`;
    } catch (err) {
      console.warn('aiContextBuilder failed (non-fatal):', err.message);
    }
  }

  return basePrompt + contextualGuidance + studyAreaGuidance + comprehensiveGuidance;
};

// ── Rate limit helper ─────────────────────────────────────────────────────────

export const checkRateLimit = async (_userId) => {
  return { allowed: true, remaining: 150 };
};
