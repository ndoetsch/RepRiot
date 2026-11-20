export type LibraryExercise = {
  name: string
  mode: 'reps' | 'seconds'
  amount: number
  tutorial: string
  modifier: string
  gifSearch: string
}

/** Starter list. Every set takes a minute or less. People can also add their own. */
export const LIBRARY: LibraryExercise[] = [
  { name: 'Squats', mode: 'reps', amount: 10, tutorial: 'Feet shoulder-width apart. Sit back like there is a chair behind you, chest up, then stand.', modifier: 'Harder: pause 2 seconds at the bottom', gifSearch: 'squats' },
  { name: 'Push-ups', mode: 'reps', amount: 10, tutorial: 'Hands under shoulders, body in a straight line. Lower your chest to the floor and push back up.', modifier: 'Easier: knees on the floor', gifSearch: 'push ups' },
  { name: 'Calf raises', mode: 'reps', amount: 10, tutorial: 'Stand tall, feet hip-width. Rise onto your toes, pause 1 second, lower slowly.', modifier: 'Harder: one leg at a time', gifSearch: 'calf raises' },
  { name: 'Lunges', mode: 'reps', amount: 10, tutorial: 'Step forward and lower until both knees are at 90 degrees. Push back up and switch legs.', modifier: 'Easier: hold a wall or chair', gifSearch: 'lunges' },
  { name: 'Plank', mode: 'seconds', amount: 30, tutorial: 'Forearms on the floor, elbows under shoulders, body straight from head to heels. Hold.', modifier: 'Easier: knees down', gifSearch: 'plank workout' },
  { name: 'Wall sit', mode: 'seconds', amount: 30, tutorial: 'Back flat on a wall, slide down until knees are at 90 degrees. Hold.', modifier: 'Easier: sit a little higher', gifSearch: 'wall sit' },
  { name: 'Jumping jacks', mode: 'reps', amount: 20, tutorial: 'Jump your feet out while raising your arms overhead, then jump back.', modifier: 'Easier: step out instead of jumping', gifSearch: 'jumping jacks' },
  { name: 'Burpees', mode: 'reps', amount: 5, tutorial: 'Squat, hands down, jump feet back to a plank, jump feet in, then jump up.', modifier: 'Easier: step back instead of jumping', gifSearch: 'burpees' },
  { name: 'High knees', mode: 'seconds', amount: 30, tutorial: 'Run in place, driving your knees up to hip height.', modifier: 'Easier: march instead of run', gifSearch: 'high knees' },
  { name: 'Mountain climbers', mode: 'seconds', amount: 30, tutorial: 'From a plank, drive one knee to your chest, then switch quickly.', modifier: 'Easier: slow it down', gifSearch: 'mountain climbers' },
  { name: 'Glute bridges', mode: 'reps', amount: 12, tutorial: 'Lie on your back, knees bent. Squeeze your glutes and lift your hips, then lower.', modifier: 'Harder: one leg at a time', gifSearch: 'glute bridge' },
  { name: 'Sit-ups', mode: 'reps', amount: 12, tutorial: 'Lie on your back, knees bent, feet flat. Curl up to sitting, then lower slowly.', modifier: 'Easier: crunches instead', gifSearch: 'sit ups' },
  { name: 'Crunches', mode: 'reps', amount: 15, tutorial: 'Lie on your back, knees bent. Lift your shoulders off the floor, then lower.', modifier: 'Harder: feet off the floor', gifSearch: 'crunches' },
  { name: 'Bicycle crunches', mode: 'reps', amount: 20, tutorial: 'On your back, bring opposite elbow to opposite knee, alternating like pedaling.', modifier: 'Easier: keep one foot on the floor', gifSearch: 'bicycle crunches' },
  { name: 'Russian twists', mode: 'reps', amount: 20, tutorial: 'Sit leaning back slightly, feet up or down. Twist side to side, touching the floor.', modifier: 'Harder: hold a weight', gifSearch: 'russian twist' },
  { name: 'Tricep dips', mode: 'reps', amount: 10, tutorial: 'Hands on the edge of a chair behind you. Bend your elbows to lower, then push up.', modifier: 'Harder: straighten your legs', gifSearch: 'tricep dips' },
  { name: 'Bicep curls', mode: 'reps', amount: 12, tutorial: 'Elbows pinned to your sides. Curl the weights up, then lower slowly.', modifier: 'Easier: use a water bottle', gifSearch: 'bicep curls' },
  { name: 'Overhead dumbbell press', mode: 'reps', amount: 10, tutorial: 'Dumbbells at your shoulders. Press straight up, then lower with control.', modifier: 'Easier: one arm at a time', gifSearch: 'shoulder press' },
  { name: 'Arm circles', mode: 'seconds', amount: 30, tutorial: 'Arms straight out to the sides. Make small circles, switching direction halfway.', modifier: 'Harder: bigger circles', gifSearch: 'arm circles' },
  { name: 'Side lunges', mode: 'reps', amount: 10, tutorial: 'Step wide to one side, bend that knee, keep the other leg straight. Push back and switch.', modifier: 'Easier: smaller step', gifSearch: 'side lunge' },
  { name: 'Jump squats', mode: 'reps', amount: 10, tutorial: 'Squat down, then explode up into a jump. Land softly into the next squat.', modifier: 'Easier: regular squats', gifSearch: 'jump squat' },
  { name: 'Step-ups', mode: 'reps', amount: 10, tutorial: 'Step onto a sturdy stair or bench, stand tall, then step down. Alternate legs.', modifier: 'Harder: hold weights', gifSearch: 'step ups' },
  { name: 'Superman', mode: 'reps', amount: 10, tutorial: 'Lie face down. Lift your arms, chest and legs off the floor, hold 1 second, lower.', modifier: 'Easier: lift arms only', gifSearch: 'superman' },
  { name: 'Side plank', mode: 'seconds', amount: 20, tutorial: 'On one forearm, body in a straight line, hips up. Hold, then switch sides next set.', modifier: 'Easier: bottom knee down', gifSearch: 'side plank' },
  { name: 'Leg raises', mode: 'reps', amount: 10, tutorial: 'Lie on your back, legs straight. Raise them to vertical, then lower slowly without touching down.', modifier: 'Easier: bend your knees', gifSearch: 'leg raises' },
  { name: 'Inchworms', mode: 'reps', amount: 5, tutorial: 'Bend down, walk your hands out to a plank, then walk them back and stand up.', modifier: 'Harder: add a push-up', gifSearch: 'inchworm' },
  { name: 'Skater hops', mode: 'reps', amount: 16, tutorial: 'Hop sideways from one foot to the other, swinging your arms like a speed skater.', modifier: 'Easier: step instead of hop', gifSearch: 'skater' },
  { name: 'Shadow boxing', mode: 'seconds', amount: 30, tutorial: 'Light on your feet, throw fast jabs and crosses at the air.', modifier: 'Harder: hold light weights', gifSearch: 'boxing' },
  { name: 'Toe touches', mode: 'reps', amount: 15, tutorial: 'Lie on your back, legs straight up. Reach up to touch your toes, then lower.', modifier: 'Easier: bend your knees', gifSearch: 'toe touch' },
  { name: 'Bear crawl', mode: 'seconds', amount: 20, tutorial: 'Hands and toes on the floor, knees just off the ground. Crawl forward and back.', modifier: 'Easier: hold in place', gifSearch: 'bear crawl' },
]

export const GOAL_OPTIONS = ['Get stronger', 'Move more at work', 'Lose weight', 'Stay consistent', 'More energy', 'Have fun with friends']
export const THEME_OPTIONS = ['Superheroes', 'Cartoons', 'Sports', 'Animals', 'Movie classics', 'Memes', 'Anime', 'Dance']
