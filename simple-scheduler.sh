#!/bin/sh
# Simple scheduler that runs at specific times
# Uses a wrapper script to check time and execute

cd /app

# Get current time
HOUR=$(date +%H)
MINUTE=$(date +%M)
DAYOFWEEK=$(date +%u)  # 1-7 (Monday is 1)

# Only run on weekdays (1-5)
if [ "$DAYOFWEEK" -lt 1 ] || [ "$DAYOFWEEK" -gt 5 ]; then
    exit 0
fi

# Run at specific times: 6:00, 9:00, 12:00, 21:00
case "$HOUR:$MINUTE" in
    "6:00")
        echo "[CRON] Running daily report at 6:00"
        exec node /app/dist/index.js --time-period=morning
        ;;
    "9:00")
        echo "[CRON] Running pipeline at 9:00"
        exec node /app/dist/index.js --time-period=morning
        ;;
    "12:00"|"12:30")
        echo "[CRON] Running pipeline at noon"
        exec node /app/dist/index.js --time-period=noon
        ;;
    "21:00")
        echo "[CRON] Running pipeline at 21:00"
        exec node /app/dist/index.js --time-period=night
        ;;
    *)
        exit 0
        ;;
esac
