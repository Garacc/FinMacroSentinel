#!/bin/sh
# Simple cron scheduler
# Executes different tasks based on time:
# - Monday 00:00: Weekly report
# - 6:00 (every day): Daily report
# - 9:00, 12:00, 21:00 (weekdays only): Pipeline

# Create the scheduler script
cat > /app/scheduler.sh << 'SCHEDULER_EOF'
#!/bin/sh
HOUR=$(date +%H)
MINUTE=$(date +%M)
DAY=$(date +%u)  # 1=Monday, 7=Sunday

# Weekly report: Monday at 00:00
if [ "$DAY" = "1" ] && [ "$HOUR" = "00" ] && [ "$MINUTE" = "00" ]; then
    echo "[CRON] Executing weekly report (Monday 00:00)" >&2
    exec node /app/dist/index.js --schedule --report weekly
fi

# Daily report: 6:00 every day
if [ "$HOUR" = "6" ] && [ "$MINUTE" = "00" ]; then
    echo "[CRON] Executing daily report (6:00 every day)" >&2
    exec node /app/dist/index.js --schedule --report daily
fi

# Pipeline: 9:00, 12:00, 21:00 only on weekdays
if [ "$DAY" -ge 1 ] && [ "$DAY" -le 5 ]; then
    case "$HOUR:$MINUTE" in
        "9:00")
            echo "[CRON] Executing morning pipeline (9:00 weekdays)" >&2
            exec node /app/dist/index.js --schedule
            ;;
        "12:00")
            echo "[CRON] Executing noon pipeline (12:00 weekdays)" >&2
            exec node /app/dist/index.js --schedule
            ;;
        "21:00")
            echo "[CRON] Executing night pipeline (21:00 weekdays)" >&2
            exec node /app/dist/index.js --schedule
            ;;
    esac
fi

echo "[CRON] Time $HOUR:$MINUTE not in schedule, skipping" >&2
exit 0
SCHEDULER_EOF

chmod +x /app/scheduler.sh

# Setup crontab
echo "* * * * * /app/scheduler.sh" > /etc/crontabs/root

# Start cron in foreground
echo "[CRON] Starting cron daemon..." >&2
exec crond -f -l 2
