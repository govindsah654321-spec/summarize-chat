import type { Conversation } from '@/types';
import { parseChatText } from '@/utils/chatParser';

const SAMPLE_CHAT = `[12/10/2025, 09:15] Priya: Hey everyone! Quick reminder about the Database Management Systems project - the submission deadline is this Friday, 17th October by 5 PM. Please make sure your reports are ready!

[12/10/2025, 09:18] Rohan: Oh no, I haven't finished my part yet. I'm still working on the ER diagram section. Can someone help me with the normalization part?

[12/10/2025, 09:20] Sneha: Rohan, I can help with normalization. I finished my section yesterday. Let's meet tomorrow at 3 PM in the library to go through everything together.

[12/10/2025, 09:22] Priya: Good idea Sneha. Also, the professor said there will be a practical exam next Monday, 20th October. Start preparing from the lab manual, chapters 5 to 8.

[12/10/2025, 09:25] Arjun: Wait, practical exam on Monday? That's really soon. I need to revise everything this weekend. Is anyone forming a study group?

[12/10/2025, 09:27] Sneha: Arjun, let's form a study group. We can meet on Saturday evening at the college canteen. Everyone is welcome to join!

[12/10/2025, 09:30] Rohan: I'm in for the study group. Also, our coding club is organizing a hackathon next weekend, 25th and 26th October. The registration deadline is Wednesday, 22nd October. Teams of 3-4 people.

[12/10/2025, 09:32] Priya: That sounds exciting! I already have a team of 3. We need one more person. Anyone interested?

[12/10/2025, 09:35] Arjun: I'd love to join your team, Priya! I've been wanting to participate in a hackathon for a while.

[12/10/2025, 09:37] Priya: Great! You're in, Arjun. So our team is me, Sneha, Arjun, and one more. Let's decide on a project idea before the registration deadline. We should meet this Thursday to brainstorm.

[12/10/2025, 09:40] Sneha: Perfect. I'll create a shared document where we can all add ideas. Also, don't forget the assignment for Software Engineering is due next Wednesday, 22nd October. It's the UML diagrams assignment.

[12/10/2025, 09:42] Rohan: I keep forgetting about that one. Thanks for the reminder, Sneha. Can you share the assignment details again? I lost the PDF.

[12/10/2025, 09:45] Sneha: Sure Rohan, I'll send the PDF in a bit. Just make sure to draw all 5 UML diagrams - use case, class, sequence, activity, and state diagram. The professor was specific about that.

[12/10/2025, 09:48] Arjun: Also everyone, the college cultural committee announced that the annual tech fest "Innovate 2025" will be held on November 5th. Registration for events starts next week. There are coding contests, robotics, paper presentations, and a gaming tournament.

[12/10/2025, 09:50] Priya: That's awesome! I want to participate in the paper presentation. Has anyone started working on any research topic?

[12/10/2025, 09:52] Rohan: I was thinking of presenting something on AI in education. But I haven't started writing yet. Is the deadline for abstract submission soon?

[12/10/2025, 09:55] Arjun: The abstract submission deadline is October 28th. You have some time, Rohan, but don't leave it till the last minute. I can help review your abstract if you want.

[12/10/2025, 09:58] Sneha: Okay everyone, let me summarize the important deadlines:
1. DBMS project report - Friday, October 17th, 5 PM
2. Library meeting to review project - Tomorrow, 3 PM
3. Software Engineering UML assignment - Wednesday, October 22nd
4. Hackathon registration - Wednesday, October 22nd
5. Practical exam - Monday, October 20th
6. Study group meeting - Saturday evening
7. Tech fest abstract - October 28th
8. Tech fest "Innovate 2025" - November 5th

[12/10/2025, 10:00] Priya: Thanks Sneha for that summary! You're a lifesaver. Let's all make sure we don't miss anything. If anyone has questions, just ask here.

[12/10/2025, 10:02] Rohan: One more thing - can someone please send me the notes from yesterday's Operating Systems class? I missed it because of the doctor's appointment.

[12/10/2025, 10:05] Arjun: Sure Rohan, I'll share my OS notes with you by tonight. Don't worry about it. Focus on the DBMS project first since that's due Friday.

[12/10/2025, 10:08] Sneha: Also, the class representative announced that there's a change in schedule for next week. Our Wednesday OS class is moved to Friday afternoon. Check the notice board for details.

[12/10/2025, 10:10] Priya: Got it. Thanks for letting us know. Alright team, let's get to work. Priority is the DBMS project first, then SE assignment. See you all tomorrow at 3 PM in the library!
`;

export function createSampleConversation(): Conversation {
  const conv = parseChatText(
    SAMPLE_CHAT,
    'College Study Group (Demo)',
    'sample-college-group.txt',
    true
  );
  return conv;
}
