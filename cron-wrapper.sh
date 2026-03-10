#!/bin/sh
# Cron wrapper script that starts the scheduler

# Set crontab
echo '* * * * * /app/run.sh' > /etc/crontabs/root

# Start cron in foreground
exec crond -f -l 2
