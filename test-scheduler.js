// Test scheduler behavior
console.log('Test script starting...');

const scheduler = {
  tasks: [],
  addTask: function(definition) {
    console.log('addTask called for:', definition.name);

    const log = (msg) => process.stderr.write(msg + '\n');

    const shouldRun = () => {
      const now = new Date();
      const minute = now.getMinutes();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();

      const parts = definition.cronExpression.trim().split(/\s+/);
      const cronMin = parts[0];
      const cronHour = parts[1];
      const cronDayOfWeek = parts[4];

      // Check minute
      if (cronMin !== '*') {
        const mins = cronMin.split(',').map(Number);
        if (!mins.includes(minute)) return false;
      }

      // Check hour
      if (cronHour !== '*') {
        const hours = cronHour.split(',').map(Number);
        if (!hours.includes(hour)) return false;
      }

      // Check day of week
      if (cronDayOfWeek !== '*') {
        const days = cronDayOfWeek.split('-').map(Number);
        if (!days.includes(dayOfWeek)) return false;
      }

      return true;
    };

    const handler = async () => {
      log(`handler: shouldRun=${shouldRun()}, executing task ${definition.name}`);
      if (!shouldRun()) return;
      console.log('EXECUTING:', definition.name);
    };

    const scheduleNext = () => {
      const now = new Date();
      const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
      log(`scheduleNext: msUntilNextMinute=${msUntilNextMinute}, now=${now.toISOString()}`);

      const timeout = setTimeout(async () => {
        log(`setTimeout fired for ${definition.name}`);
        await handler();
        scheduleNext();
      }, msUntilNextMinute);

      this.tasks.push({ definition, timeout });
    };

    // Run immediately
    handler();

    // Schedule next
    scheduleNext();

    log(`Task ${definition.name} scheduled`);
  }
};

scheduler.addTask({
  name: 'test-task',
  cronExpression: '* * * * *',
  handler: async () => {
    console.log('Task executed!');
  }
});

console.log('Waiting for scheduler...');
setTimeout(() => {
  console.log('Test complete');
  process.exit(0);
}, 65000);
