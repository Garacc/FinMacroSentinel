#!/bin/sh
# Simple cron setup script

# Create scheduler script
echo '#!/bin/sh' > /app/scheduler.sh
echo 'HOUR=$(date +%H)' >> /app/scheduler.sh
echo 'MINUTE=$(date +%M)' >> /app/scheduler.sh
echo 'DAY=$(date +%u)' >> /app/scheduler.sh
echo 'if [ "$DAY" -lt 1 ] || [ "$DAY" -gt 5 ]; then exit 0; fi' >> /app/scheduler.sh
echo 'case "$HOUR:$MINUTE" in' >> /app/scheduler.sh
echo '    "6:00"|"9:00"|"12:00"|"21:00") exec node /app/dist/index.js --schedule ;;' >> /app/scheduler.sh
echo '    *) exit 0 ;;' >> /app/scheduler.sh
echo 'esac' >> /app/scheduler.sh

chmod +x /app/scheduler.sh

# Setup crontab
echo '* * * * * /app/scheduler.sh' > /etc/crontabs/root

# Start cron
exec crond -f -l 2
