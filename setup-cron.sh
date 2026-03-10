#!/bin/sh
# Simple cron scheduler
# Executes different tasks based on time:
# - 6:00 (weekdays): Daily report (generateDailyReport)
# - 9:00, 12:00, 21:00 (weekdays): Pipeline (news analysis)

HOUR=$(date +%H)
MINUTE=$(date +%M)
DAY=$(date +%u)

# Debug: log every minute
echo "[CRON] Triggered at $HOUR:$MINUTE on day $DAY" >&2

# Only run on weekdays (1-5)
if [ "$DAY" -lt 1 ] || [ "$DAY" -gt 5 ]; then
    echo "[CRON] Not a weekday (day=$DAY), skipping" >&2
    exit 0
fi

# Run at specific times
case "$HOUR:$MINUTE" in
    "6:00")
        echo "[CRON] Executing daily report at 6:00" >&2
        exec node /app/dist/index.js --schedule --report daily
        ;;
    "9:00")
        echo "[CRON] Executing morning pipeline at 9:00" >&2
        exec node /app/dist/index.js --schedule
        ;;
    "12:00")
        echo "[CRON] Executing noon pipeline at 12:00" >&2
        exec node /app/dist/index.js --schedule
        ;;
    "21:00")
        echo "[CRON] Executing night pipeline at 21:00" >&2
        exec node /app/dist/index.js --schedule
        ;;
    *)
        echo "[CRON] Time $HOUR:$MINUTE not in schedule, skipping" >&2
        exit 0
        ;;
esac
